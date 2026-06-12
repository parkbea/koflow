import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { readOpConfig, authHeader, normalizeBase } from "@/lib/opConfig";

export const runtime = "nodejs";

/**
 * OpenProject 동기화
 *
 * ⚠️ 불변 원칙: OpenProject 는 **읽기 전용(GET only)** — 어떤 경우에도
 *    OpenProject 에 쓰기(POST/PUT/PATCH/DELETE)를 보내지 않는다.
 *    모든 생성/수정/완료 처리는 koFlow 로컬 DB 에만 적용된다.
 *
 * - 담당자(assignee)가 지정된 "진행 중(open)" work package 들을 가져와
 *   koFlow 프로젝트와 동기화한다.
 * - 범위: koFlow 에 등록된 팀원과 이름이 일치하는 작업만.
 *   body { userId } 를 주면 해당 직원의 작업만 동기화한다.
 * - 매칭 키: Project.opEpicUrl 에 저장된 `${base}/work_packages/${id}`
 *   · 이미 있던 항목  → 내용 수정(제목/요약/일정/담당자)
 *   · 새 항목         → 프로젝트 생성(진행중)
 *   · OpenProject 에서 사라진 동기화 항목 → 상태를 "완료" 로 변경(완료 목록)
 *     (이번 동기화 범위에 포함된 담당자의 항목만 — 부분 동기화가 다른
 *      직원의 프로젝트를 완료 처리하지 않도록)
 * - opEpicUrl 이 work_packages URL 인 프로젝트만 "동기화 대상"으로 보고,
 *   수동 생성 프로젝트는 절대 건드리지 않는다.
 */

type WP = {
  id: number;
  subject: string;
  summary: string;
  startDate: string | null;
  endDate: string | null;
  assigneeName: string;
  assigneeHref: string | null;
  projectTitle: string;
};

function stripHtml(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** opEpicUrl 에서 work package id 추출 (동기화 대상 식별) */
function wpIdFromUrl(url: string): number | null {
  const m = url.match(/\/(?:work_packages|wp)\/(\d+)/i);
  return m ? Number(m[1]) : null;
}

async function fetchOpenWorkPackages(
  base: string,
  apiKey: string
): Promise<WP[]> {
  // 진행 중(open) + 담당자 지정(*) 필터
  const filters = encodeURIComponent(
    JSON.stringify([
      { status: { operator: "o", values: [] } },
      { assignee: { operator: "*", values: [] } },
    ])
  );

  const pageSize = 200;
  let offset = 1;
  const out: WP[] = [];

  // 페이지네이션 (망분리 소규모 팀 기준 충분)
  for (let guard = 0; guard < 50; guard++) {
    const endpoint =
      `${base}/api/v3/work_packages` +
      `?pageSize=${pageSize}&offset=${offset}&filters=${filters}`;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(endpoint, {
      headers: { Authorization: authHeader(apiKey) },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      throw new Error(`OpenProject 조회 실패 (HTTP ${res.status})`);
    }
    const data = await res.json();
    const elements: any[] = data?._embedded?.elements ?? [];
    for (const e of elements) {
      const assigneeLink = e?._links?.assignee;
      const assigneeName: string = assigneeLink?.title ?? "";
      // 담당자 없는 항목은 제외(필터로 걸러지지만 방어)
      if (!assigneeName) continue;
      out.push({
        id: Number(e.id),
        subject: e.subject ?? "",
        summary: stripHtml(e.description?.raw),
        startDate: e.startDate ?? null,
        endDate: e.dueDate ?? null,
        assigneeName,
        assigneeHref: assigneeLink?.href ?? null,
        projectTitle: e?._links?.project?.title ?? "",
      });
    }

    const total: number = data?.total ?? out.length;
    const count: number = data?.count ?? elements.length;
    offset += 1;
    if (count < pageSize || (offset - 1) * pageSize >= total) break;
  }

  return out;
}

export async function POST(req: NextRequest) {
  const cfg = readOpConfig();
  if (!cfg.baseUrl || !cfg.apiKey) {
    return NextResponse.json(
      { error: "OpenProject 연동이 설정되지 않았습니다. (관리 > 연동)" },
      { status: 400 }
    );
  }
  const base = normalizeBase(cfg.baseUrl);

  // 동기화 범위: 기본 = 등록된 전체 팀원, userId 지정 시 = 해당 직원만
  const body = await req.json().catch(() => ({} as { userId?: unknown }));
  const targetUserId =
    typeof body?.userId === "string" && body.userId ? body.userId : null;

  // 담당자 이름 → koFlow 사용자 매칭용
  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  const userByName = new Map(users.map((u) => [u.name.trim(), u.id]));
  const target = targetUserId
    ? users.find((u) => u.id === targetUserId) ?? null
    : null;
  if (targetUserId && !target) {
    return NextResponse.json(
      { error: "선택한 직원을 찾을 수 없습니다." },
      { status: 400 }
    );
  }

  let wps: WP[];
  try {
    wps = await fetchOpenWorkPackages(base, cfg.apiKey);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "OpenProject 연결 실패" },
      { status: 400 }
    );
  }
  const fetched = wps.length;

  // 범위 필터: 팀원 이름과 일치하는 작업만 (직원 지정 시 그 직원만)
  wps = wps.filter((wp) => {
    const name = wp.assigneeName.trim();
    return target ? name === target.name.trim() : userByName.has(name);
  });

  // 기존 동기화 대상 프로젝트(opEpicUrl 이 work package URL 인 것) 로드
  const allProjects = await prisma.project.findMany({
    select: {
      id: true,
      opEpicUrl: true,
      status: true,
      archived: true,
      assignments: { select: { userId: true, name: true } },
    },
  });
  const syncedByWpId = new Map<number, (typeof allProjects)[number]>();
  for (const p of allProjects) {
    const id = wpIdFromUrl(p.opEpicUrl);
    if (id != null) syncedByWpId.set(id, p);
  }

  const incomingIds = new Set<number>();
  let created = 0;
  let updated = 0;
  let completed = 0;

  for (const wp of wps) {
    incomingIds.add(wp.id);
    const url = `${base}/work_packages/${wp.id}`;
    const userId = userByName.get(wp.assigneeName.trim()) ?? null;

    const assignment = {
      userId,
      name: wp.assigneeName,
      role: "",
      effort: 1,
      effortUnit: "MM",
    };

    const existing = syncedByWpId.get(wp.id);
    if (existing) {
      // 있던 것 → 내용 수정 (담당자 배정도 최신화)
      await prisma.$transaction(async (tx) => {
        await tx.assignment.deleteMany({ where: { projectId: existing.id } });
        await tx.project.update({
          where: { id: existing.id },
          data: {
            name: wp.subject,
            subtitle: wp.subject,
            summary: wp.summary,
            client: wp.projectTitle,
            startDate: wp.startDate,
            endDate: wp.endDate,
            status: "진행중",
            archived: false,
            opEpicUrl: url,
            assignments: { create: [assignment] },
          },
        });
      });
      updated++;
    } else {
      // 새 항목 → 생성
      await prisma.project.create({
        data: {
          type: "실행중인 프로젝트",
          name: wp.subject,
          subtitle: wp.subject,
          summary: wp.summary,
          client: wp.projectTitle,
          startDate: wp.startDate,
          endDate: wp.endDate,
          status: "진행중",
          opEpicUrl: url,
          assignments: { create: [assignment] },
        },
      });
      created++;
    }
  }

  // OpenProject 에서 사라진 동기화 항목 → 완료 처리
  // (이번 동기화 범위에 든 담당자의 항목만 — 부분 동기화 보호)
  for (const [wpId, p] of syncedByWpId) {
    if (incomingIds.has(wpId)) continue;
    if (p.status === "완료") continue; // 이미 완료면 건너뜀
    const inScope = target
      ? p.assignments.some(
          (a) =>
            a.userId === target.id || a.name.trim() === target.name.trim()
        )
      : p.assignments.some(
          (a) => a.userId != null || userByName.has(a.name.trim())
        );
    if (!inScope) continue;
    await prisma.project.update({
      where: { id: p.id },
      data: { status: "완료" },
    });
    completed++;
  }

  return NextResponse.json({
    ok: true,
    fetched,
    matched: wps.length,
    scope: target ? target.name : "팀원 전체",
    created,
    updated,
    completed,
  });
}
