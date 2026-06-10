import { NextRequest, NextResponse } from "next/server";
import { readOpConfig, authHeader, normalizeBase } from "@/lib/opConfig";

export const runtime = "nodejs";

type OpResult = {
  kind: "project" | "work_package";
  name: string;
  summary: string;
  startDate: string | null;
  endDate: string | null;
};

// URL 에서 종류와 id 추출
function parseUrl(url: string): { kind: OpResult["kind"]; id: string } | null {
  const wp = url.match(/\/(?:work_packages|wp)\/(\d+)/i);
  if (wp) return { kind: "work_package", id: wp[1] };
  const pj = url.match(/\/projects\/([^/?#]+)/i);
  if (pj) return { kind: "project", id: pj[1] };
  return null;
}

function stripHtml(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url).searchParams.get("url") ?? "";
  const target = parseUrl(url);
  if (!target) {
    return NextResponse.json(
      { error: "OpenProject 프로젝트/작업 URL 형식이 아닙니다." },
      { status: 400 }
    );
  }

  const cfg = readOpConfig();
  if (!cfg.baseUrl || !cfg.apiKey) {
    return NextResponse.json(
      { error: "OpenProject 연동이 설정되지 않았습니다. (관리 > 연동)" },
      { status: 400 }
    );
  }
  const base = normalizeBase(cfg.baseUrl);
  const endpoint =
    target.kind === "work_package"
      ? `${base}/api/v3/work_packages/${target.id}`
      : `${base}/api/v3/projects/${target.id}`;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(endpoint, {
      headers: { Authorization: authHeader(cfg.apiKey) },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      return NextResponse.json(
        { error: `OpenProject 조회 실패 (HTTP ${res.status})` },
        { status: 400 }
      );
    }
    const d = await res.json();
    const result: OpResult =
      target.kind === "work_package"
        ? {
            kind: "work_package",
            name: d.subject ?? "",
            summary: stripHtml(d.description?.raw),
            startDate: d.startDate ?? null,
            endDate: d.dueDate ?? null,
          }
        : {
            kind: "project",
            name: d.name ?? "",
            summary: stripHtml(d.description?.raw),
            startDate: null,
            endDate: null,
          };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "OpenProject 서버에 연결할 수 없습니다." },
      { status: 400 }
    );
  }
}
