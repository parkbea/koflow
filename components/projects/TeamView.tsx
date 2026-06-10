"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { displayName, toMM, TYPE_COLOR } from "@/lib/projects";
import type { ProjectData, MemberLite } from "./types";

export function TeamView({
  members,
  projects,
}: {
  members: MemberLite[];
  projects: ProjectData[];
}) {
  // 멤버별 배정 공수 집계 (userId 우선, 없으면 이름)
  const alloc: Record<string, { totalMM: number; projects: { name: string; type: string; effort: number; unit: string }[] }> = {};
  for (const p of projects) {
    for (const a of p.assignments) {
      const key = a.userId || a.name;
      if (!key) continue;
      (alloc[key] ??= { totalMM: 0, projects: [] });
      alloc[key].totalMM += toMM(a.effort, a.effortUnit);
      alloc[key].projects.push({
        name: displayName(p),
        type: p.type,
        effort: a.effort,
        unit: a.effortUnit,
      });
    }
  }

  const totalCap = members.reduce((s, m) => s + (m.capacity || 1), 0);
  const totalAlloc = Object.values(alloc).reduce((s, v) => s + v.totalMM, 0);
  const overloaded = members.filter(
    (m) => (alloc[m.id]?.totalMM ?? 0) > (m.capacity || 1) * 1.5
  ).length;

  const stats = [
    { label: "전체 팀원", value: members.length, unit: "명", color: "#6366F1" },
    { label: "총 가용 공수", value: totalCap.toFixed(1), unit: "MM/월", color: "#10B981" },
    { label: "배정 공수", value: totalAlloc.toFixed(1), unit: "MM", color: "#F59E0B" },
    { label: "과부하", value: overloaded, unit: "명", color: "#EF4444" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border-l-4 bg-card px-4 py-3 shadow-sm"
            style={{ borderColor: s.color }}
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold">
              {s.value}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {s.unit}
              </span>
            </p>
          </div>
        ))}
      </div>

      {members.length === 0 ? (
        <div className="rounded-lg border bg-card py-12 text-center">
          <p className="text-sm text-muted-foreground">등록된 팀원이 없습니다.</p>
          <Link
            href="/admin/users"
            className="mt-1 inline-block text-sm text-primary hover:underline"
          >
            팀원 관리에서 추가하기
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const a = alloc[m.id] ?? { totalMM: 0, projects: [] };
            const cap = m.capacity || 1;
            const pct = Math.min(100, (a.totalMM / cap) * 100);
            const fill =
              a.totalMM > cap * 1.5
                ? "bg-red-400"
                : a.totalMM > cap
                ? "bg-amber-400"
                : "bg-indigo-400";
            return (
              <div
                key={m.id}
                className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                    {m.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.role || "직무 미지정"}
                      {m.team ? ` · ${m.team}` : ""}
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">투입 공수</span>
                    <span
                      className={cn(
                        "font-semibold",
                        a.totalMM > cap * 1.5 ? "text-red-500" : "text-slate-700"
                      )}
                    >
                      {a.totalMM.toFixed(1)} / {cap} MM
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full", fill)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                {a.projects.length > 0 ? (
                  <div className="space-y-1">
                    {a.projects.map((pr, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="flex items-center gap-1 truncate">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: TYPE_COLOR[pr.type] ?? "#6366f1" }}
                          />
                          <span className="truncate text-slate-600">{pr.name}</span>
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {pr.effort} {pr.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-300">배정된 프로젝트 없음</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          팀원 관리
        </Link>
      </div>
    </div>
  );
}
