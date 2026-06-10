"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { displayName, isDone, TYPE_COLOR } from "@/lib/projects";
import type { ProjectData, PersonalEventData } from "./types";

type CalItem =
  | { kind: "project"; label: string; id: string; color: string; project: ProjectData }
  | { kind: "personal"; label: string; id: string; color: string; event: PersonalEventData };

function ds(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function CalendarView({
  projects,
  events,
  onEditProject,
  onAddPersonal,
  onEditPersonal,
}: {
  projects: ProjectData[];
  events: PersonalEventData[];
  onEditProject: (p: ProjectData) => void;
  onAddPersonal: (date: string) => void;
  onEditPersonal: (e: PersonalEventData) => void;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  function move(dir: number) {
    let m = month + dir;
    let y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m);
    setYear(y);
  }

  // 날짜별 이벤트 맵
  const map: Record<string, CalItem[]> = {};
  const add = (date: string, item: CalItem) => {
    (map[date] ??= []).push(item);
  };
  for (const p of projects) {
    if (isDone(p)) continue;
    if (p.startDate)
      add(p.startDate, { kind: "project", label: `▶ ${displayName(p)}`, id: p.id, color: TYPE_COLOR[p.type] ?? "#6366f1", project: p });
    if (p.endDate && p.endDate !== p.startDate)
      add(p.endDate, { kind: "project", label: `■ ${displayName(p)}`, id: p.id, color: TYPE_COLOR[p.type] ?? "#6366f1", project: p });
  }
  for (const ev of events) {
    if (!ev.startDate) continue;
    const s = new Date(ev.startDate);
    const e = new Date(ev.endDate || ev.startDate);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      add(ds(d.getFullYear(), d.getMonth(), d.getDate()), {
        kind: "personal",
        label: ev.title,
        id: ev.id,
        color: ev.color || "#ec4899",
        event: ev,
      });
    }
  }

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDow; i++) {
    cells.push(<div key={`p${i}`} className="min-h-[96px] border bg-muted/20" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    const isToday = dt.getTime() === today.getTime();
    const key = ds(year, month, d);
    const evs = map[key] ?? [];
    const dow = dt.getDay();
    const nc = dow === 0 ? "text-red-400" : dow === 6 ? "text-blue-400" : "text-slate-600";
    cells.push(
      <div
        key={key}
        onDoubleClick={() => onAddPersonal(key)}
        className={cn(
          "min-h-[96px] border p-1 align-top transition-colors hover:bg-accent/40",
          isToday && "bg-primary/5 ring-1 ring-inset ring-primary/30"
        )}
      >
        <span className={cn("text-xs font-semibold", nc)}>{d}</span>
        <div className="mt-0.5 space-y-0.5">
          {evs.slice(0, 3).map((ev, i) =>
            ev.kind === "project" ? (
              <button
                key={i}
                onClick={() => onEditProject(ev.project)}
                title={ev.label}
                className="block w-full truncate rounded px-1 py-0.5 text-left text-[11px] text-white"
                style={{ background: ev.color }}
              >
                {ev.label}
              </button>
            ) : (
              <button
                key={i}
                onClick={() => onEditPersonal(ev.event)}
                title={ev.label}
                className="block w-full truncate rounded border-l-2 bg-white px-1 py-0.5 text-left text-[11px] text-slate-600"
                style={{ borderColor: ev.color }}
              >
                {ev.label}
              </button>
            )
          )}
          {evs.length > 3 && (
            <div className="pl-1 text-[10px] text-muted-foreground">
              +{evs.length - 3}
            </div>
          )}
        </div>
      </div>
    );
  }

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {year}년 {month + 1}월
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => move(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setYear(now.getFullYear());
              setMonth(now.getMonth());
            }}
          >
            오늘
          </Button>
          <Button variant="outline" size="icon" onClick={() => move(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7">
        {weekdays.map((w, i) => (
          <div
            key={w}
            className={cn(
              "border-b py-1.5 text-center text-xs font-medium",
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-muted-foreground"
            )}
          >
            {w}
          </div>
        ))}
        {cells}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        빈 날짜를 더블클릭하면 개인 일정을 추가할 수 있습니다.
      </p>
    </div>
  );
}
