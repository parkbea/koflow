"use client";

import { useState } from "react";
import { Check, Maximize2, Minimize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PROJECT_TYPES,
  TYPE_LABEL,
  TYPE_BORDER,
  TYPE_COLOR,
  STATUS_BADGE,
  displayName,
  dDay,
} from "@/lib/projects";
import type { ProjectData } from "./types";

export function KanbanView({
  projects,
  search,
  statusFilter,
  onMove,
  onArchive,
  onEdit,
}: {
  projects: ProjectData[];
  search: string;
  statusFilter: string;
  onMove: (id: string, type: string) => void;
  onArchive: (id: string) => void;
  onEdit: (p: ProjectData) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  const q = search.trim().toLowerCase();
  const visible = projects.filter((p) => {
    const ms =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q) ||
      p.client.toLowerCase().includes(q);
    const mf = !statusFilter || p.status === statusFilter;
    return ms && mf;
  });

  const columns = focus ? PROJECT_TYPES.filter((t) => t === focus) : PROJECT_TYPES;

  return (
    <div className={cn(focus ? "block" : "grid gap-4 md:grid-cols-3")}>
      {columns.map((type) => {
        const list = visible.filter((p) => p.type === type);
        const total = projects.filter((p) => p.type === type).length;
        const focused = focus === type;
        return (
          <div
            key={type}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(type);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => {
              if (dragId) {
                const p = projects.find((x) => x.id === dragId);
                if (p && p.type !== type) onMove(dragId, type);
              }
              setDragId(null);
              setDragOver(null);
            }}
            className={cn(
              "flex flex-col rounded-xl border border-slate-200/70 bg-white/55 shadow-card backdrop-blur-sm transition-shadow",
              dragOver === type && "ring-2 ring-primary"
            )}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <span className="flex items-center gap-2 font-semibold">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: TYPE_COLOR[type] }}
                />
                {TYPE_LABEL[type]}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{total}</Badge>
                <button
                  onClick={() => setFocus(focused ? null : type)}
                  title={focused ? "원래 보기로" : "이 칸반만 크게 보기"}
                  className="flex items-center gap-1 rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  {focused ? (
                    <>
                      <Minimize2 className="h-4 w-4" />
                      <span className="text-xs font-medium">닫기</span>
                    </>
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div
              className={cn(
                "flex-1 px-3 pb-3",
                focused
                  ? "grid content-start gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "space-y-2"
              )}
            >
              {list.length === 0 && (
                <p className="select-none py-10 text-center text-xs text-slate-300 sm:col-span-full">
                  {focused ? "카드가 없습니다" : "카드를 드래그하세요"}
                </p>
              )}
              {list.map((p) => {
                const dd = dDay(p);
                return (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => setDragId(p.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setDragOver(null);
                    }}
                    onClick={() => onEdit(p)}
                    className={cn(
                      "cursor-pointer rounded-xl border border-l-4 bg-background p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift",
                      TYPE_BORDER[p.type],
                      dragId === p.id && "opacity-50"
                    )}
                  >
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-snug">
                        {displayName(p)}
                      </h3>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium",
                          STATUS_BADGE[p.status]
                        )}
                      >
                        {p.status}
                      </span>
                    </div>

                    {(p.opEpicUrl || p.opEffortUrl || p.opQaUrl) && (
                      <div className="mb-1.5 flex gap-1">
                        {p.opEpicUrl && <OpTag label="Epic" href={p.opEpicUrl} cls="bg-blue-50 text-blue-500 hover:bg-blue-100" />}
                        {p.opEffortUrl && <OpTag label="공수" href={p.opEffortUrl} cls="bg-indigo-50 text-indigo-500 hover:bg-indigo-100" />}
                        {p.opQaUrl && <OpTag label="QA" href={p.opQaUrl} cls="bg-violet-50 text-violet-500 hover:bg-violet-100" />}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-xs text-muted-foreground">
                      <span>
                        {p.startDate ?? ""}
                        {p.endDate ? ` ~ ${p.endDate}` : ""}
                      </span>
                      <span>{p.effort ? `${p.effort} ${p.effortUnit}` : "공수 미정"}</span>
                    </div>

                    {p.assignments.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.assignments.slice(0, 3).map((a, i) => (
                          <span
                            key={a.id ?? i}
                            className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-600"
                          >
                            {a.name}
                          </span>
                        ))}
                        {p.assignments.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{p.assignments.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {dd && (
                      <div className={cn("mt-1.5 text-xs font-medium", dd.cls)}>
                        {dd.txt}
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {PROJECT_TYPES.filter((t) => t !== p.type).map((t) => (
                        <button
                          key={t}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMove(p.id, t);
                          }}
                          className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
                        >
                          → {TYPE_LABEL[t]}
                        </button>
                      ))}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchive(p.id);
                        }}
                        title="완료 처리(보관)"
                        className="ml-auto flex items-center gap-0.5 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 transition-colors hover:bg-emerald-100 hover:text-emerald-600"
                      >
                        <Check className="h-3 w-3" />
                        완료
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OpTag({
  label,
  href,
  cls,
}: {
  label: string;
  href: string;
  cls: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={`OpenProject ${label} 새 창으로 열기`}
      className={cn(
        "rounded px-1.5 py-0.5 text-xs font-medium transition-colors",
        cls
      )}
    >
      {label}
    </a>
  );
}
