"use client";

import { displayName, TYPE_COLOR } from "@/lib/projects";
import type { ProjectData } from "./types";

const LABEL_W = 170;

export function GanttView({
  projects,
  onEdit,
}: {
  projects: ProjectData[];
  onEdit: (p: ProjectData) => void;
}) {
  const ps = projects.filter((p) => p.startDate || p.endDate);
  if (ps.length === 0) {
    return (
      <div className="rounded-lg border bg-card py-16 text-center text-sm text-muted-foreground">
        일정이 등록된 프로젝트가 없습니다.
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let minD = new Date(today);
  let maxD = new Date(today);
  for (const p of ps) {
    if (p.startDate) {
      const d = new Date(p.startDate);
      if (d < minD) minD = d;
    }
    if (p.endDate) {
      const d = new Date(p.endDate);
      if (d > maxD) maxD = d;
    }
  }
  minD = new Date(minD.getFullYear(), minD.getMonth() - 1, 1);
  maxD = new Date(maxD.getFullYear(), maxD.getMonth() + 2, 0);
  const totalMs = maxD.getTime() - minD.getTime();

  const months: Date[] = [];
  let cur = new Date(minD.getFullYear(), minD.getMonth(), 1);
  while (cur <= maxD) {
    months.push(new Date(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  const todayPct = Math.max(
    0,
    Math.min(100, ((today.getTime() - minD.getTime()) / totalMs) * 100)
  );

  return (
    <div className="overflow-x-auto rounded-lg border bg-card p-4">
      <div style={{ minWidth: LABEL_W + months.length * 90 }}>
        {/* 월 헤더 */}
        <div className="mb-1 flex" style={{ paddingLeft: LABEL_W }}>
          {months.map((m, i) => (
            <div
              key={i}
              className="flex-shrink-0 text-center text-xs font-medium text-muted-foreground"
              style={{ width: `${(100 / months.length).toFixed(2)}%`, minWidth: 80 }}
            >
              {m.getFullYear()}.{String(m.getMonth() + 1).padStart(2, "0")}
            </div>
          ))}
        </div>

        <div className="relative">
          {/* 월 구분선 */}
          {months.map((m, i) => {
            if (i === 0) return null;
            const pct = ((m.getTime() - minD.getTime()) / totalMs) * 100;
            return (
              <div
                key={i}
                className="absolute bottom-0 top-0 w-px bg-slate-100"
                style={{ left: `calc(${LABEL_W}px + ${pct.toFixed(2)}%)` }}
              />
            );
          })}
          {/* 오늘 라인 */}
          <div
            className="absolute bottom-0 top-0 z-[5] w-0.5 bg-red-400"
            style={{ left: `calc(${LABEL_W}px + ${todayPct.toFixed(2)}%)` }}
          >
            <span className="absolute left-0 top-0 -translate-x-1/2 whitespace-nowrap rounded border border-red-300 bg-white px-1 text-[9px] font-bold text-red-500">
              TODAY
            </span>
          </div>

          {/* 막대 */}
          {ps.map((p) => {
            const sD = p.startDate ? new Date(p.startDate) : new Date(minD);
            const eD = p.endDate ? new Date(p.endDate) : new Date(maxD);
            const lPct = Math.max(0, ((sD.getTime() - minD.getTime()) / totalMs) * 100);
            const wPct = Math.max(0.5, ((eD.getTime() - sD.getTime()) / totalMs) * 100);
            return (
              <div key={p.id} className="mb-2 flex items-center">
                <div
                  className="flex-shrink-0 pr-3 text-right"
                  style={{ width: LABEL_W }}
                >
                  <p className="truncate text-xs font-semibold text-slate-700">
                    {displayName(p)}
                  </p>
                </div>
                <div className="relative flex h-9 flex-1 items-center">
                  <button
                    onClick={() => onEdit(p)}
                    title={displayName(p)}
                    className="absolute flex h-6 items-center overflow-hidden rounded px-2 text-xs font-medium text-white shadow-sm"
                    style={{
                      left: `${lPct.toFixed(2)}%`,
                      width: `${wPct.toFixed(2)}%`,
                      background: TYPE_COLOR[p.type] ?? "#6366f1",
                    }}
                  >
                    <span className="truncate">{displayName(p)}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
