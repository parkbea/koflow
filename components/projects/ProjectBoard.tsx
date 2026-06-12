"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  KanbanSquare,
  GanttChartSquare,
  CalendarDays,
  Users,
  Plus,
  Archive,
  Search,
  FileBarChart,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ALL_STATUSES, isDone, PROJECT_TYPES, TYPE_LABEL, TYPE_COLOR } from "@/lib/projects";
import type { ProjectData, MemberLite, PersonalEventData } from "./types";
import { KanbanView } from "./KanbanView";
import { GanttView } from "./GanttView";
import { CalendarView } from "./CalendarView";
import { TeamView } from "./TeamView";
import { ProjectModal } from "./ProjectModal";
import { PersonalEventModal } from "./PersonalEventModal";
import { ArchiveModal } from "./ArchiveModal";

type View = "kanban" | "gantt" | "calendar" | "team";
type TypeFilter = Record<string, boolean>;

const VIEWS: { key: View; label: string; icon: typeof KanbanSquare }[] = [
  { key: "kanban", label: "칸반", icon: KanbanSquare },
  { key: "gantt", label: "간트", icon: GanttChartSquare },
  { key: "calendar", label: "캘린더", icon: CalendarDays },
  { key: "team", label: "팀", icon: Users },
];

export function ProjectBoard({
  initialProjects,
  members,
  initialEvents,
}: {
  initialProjects: ProjectData[];
  members: MemberLite[];
  initialEvents: PersonalEventData[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectData[]>(initialProjects);
  const [events, setEvents] = useState<PersonalEventData[]>(initialEvents);
  const [view, setView] = useState<View>("kanban");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>({
    RFI: true,
    RFP: true,
    "실행중인 프로젝트": true,
  });
  const [showPersonal, setShowPersonal] = useState(true);

  const [editing, setEditing] = useState<ProjectData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncTarget, setSyncTarget] = useState(""); // "" = 팀원 전체
  const [eventModal, setEventModal] = useState<{
    event: PersonalEventData | null;
    date: string;
  } | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const active = projects.filter((p) => !isDone(p));
  const archived = projects.filter((p) => isDone(p));

  // ── 뮤테이션 ───────────────────────────────
  const patchProject = useCallback(
    async (id: string, partial: Partial<ProjectData>) => {
      const prev = projects;
      setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...partial } : p)));
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      if (!res.ok) {
        setProjects(prev);
        alert("변경 실패");
      } else {
        router.refresh();
      }
    },
    [projects, router]
  );

  const removeProject = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((ps) => ps.filter((p) => p.id !== id));
        router.refresh();
      } else alert("삭제 실패");
    },
    [router]
  );

  const saveProject = useCallback(
    async (payload: Partial<ProjectData>, id?: string) => {
      const res = await fetch(id ? `/api/projects/${id}` : "/api/projects", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        alert((await res.json().catch(() => ({}))).error ?? "저장 실패");
        return false;
      }
      const saved = (await res.json()) as ProjectData & { opUserIds: string };
      const normalized: ProjectData = {
        ...saved,
        opUserIds: Array.isArray(saved.opUserIds)
          ? saved.opUserIds
          : safeIds(saved.opUserIds),
      };
      setProjects((ps) =>
        id ? ps.map((p) => (p.id === id ? normalized : p)) : [...ps, normalized]
      );
      router.refresh();
      return true;
    },
    [router]
  );

  const saveEvent = useCallback(
    async (payload: Partial<PersonalEventData>, id?: string) => {
      const res = await fetch(
        id ? `/api/personal-events/${id}` : "/api/personal-events",
        {
          method: id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        alert("일정 저장 실패");
        return false;
      }
      const saved = (await res.json()) as PersonalEventData;
      setEvents((es) =>
        id ? es.map((e) => (e.id === id ? saved : e)) : [...es, saved]
      );
      router.refresh();
      return true;
    },
    [router]
  );

  const removeEvent = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/personal-events/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEvents((es) => es.filter((e) => e.id !== id));
        router.refresh();
      } else alert("삭제 실패");
    },
    [router]
  );

  // OpenProject 동기화: 팀원(또는 선택한 직원)의 진행 중 work package 가져오기
  const syncOpenProject = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/integrations/openproject/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syncTarget ? { userId: syncTarget } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "동기화 실패");
        return;
      }
      // 최신 프로젝트 목록 반영
      const refreshed = await fetch("/api/projects").then((r) => r.json());
      setProjects(
        (refreshed as (ProjectData & { opUserIds: string })[]).map((p) => ({
          ...p,
          opUserIds: Array.isArray(p.opUserIds)
            ? p.opUserIds
            : safeIds(p.opUserIds),
        }))
      );
      router.refresh();
      alert(
        `OpenProject 동기화 완료 — ${data.scope}\n` +
          `· 가져온 작업: ${data.fetched}건 (범위 내 ${data.matched}건)\n` +
          `· 신규 등록: ${data.created}건\n` +
          `· 내용 수정: ${data.updated}건\n` +
          `· 완료 처리: ${data.completed}건`
      );
    } catch {
      alert("동기화 실패 — 관리 > 연동 설정과 네트워크를 확인하세요.");
    } finally {
      setSyncing(false);
    }
  }, [syncing, syncTarget, router]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(p: ProjectData) {
    setEditing(p);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">업무 보드</h1>
          <p className="text-sm text-muted-foreground">
            진행 <span className="font-semibold text-foreground">{active.length}</span>건
            {" · "}완료 <span className="font-semibold text-foreground">{archived.length}</span>건
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-md border">
            <span className="flex items-center gap-1 px-2 text-xs text-muted-foreground">
              <FileBarChart className="h-3.5 w-3.5" />
              주간보고
            </span>
            <a
              href="/api/reports/weekly?format=xlsx"
              className="border-l px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
            >
              Excel
            </a>
            <a
              href="/api/reports/weekly?format=pptx"
              className="border-l px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
            >
              PPT
            </a>
          </div>
          <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white/80 shadow-sm">
            <Select
              value={syncTarget}
              onChange={(e) => setSyncTarget(e.target.value)}
              className="h-9 w-28 rounded-none border-0 bg-transparent text-xs shadow-none focus-visible:ring-0"
              title="동기화할 직원 선택"
            >
              <option value="">팀원 전체</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            <button
              onClick={syncOpenProject}
              disabled={syncing}
              title="OpenProject 의 진행 중 작업을 가져옵니다 (선택한 직원 또는 팀원 전체)"
              className="flex h-9 items-center gap-2 border-l border-slate-200 px-3 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
              {syncing ? "동기화 중..." : "OP 동기화"}
            </button>
          </div>
          <Button variant="outline" onClick={() => setArchiveOpen(true)}>
            <Archive className="h-4 w-4" />
            보관함 {archived.length > 0 && `(${archived.length})`}
          </Button>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />새 프로젝트
          </Button>
        </div>
      </div>

      {/* 뷰 전환 — 세그먼트 컨트롤 */}
      <div className="inline-flex items-center gap-1 rounded-xl bg-slate-200/70 p-1">
        {VIEWS.map((v) => {
          const Icon = v.icon;
          return (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm transition-all",
                view === v.key
                  ? "bg-white font-semibold text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Icon className="h-4 w-4" />
              {v.label}
            </button>
          );
        })}
      </div>

      {/* 컨텍스트 툴바 */}
      {view === "kanban" && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="프로젝트 검색..."
              className="pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
          >
            <option value="">전체 상태</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      )}

      {(view === "gantt" || view === "calendar") && (
        <div className="flex flex-wrap items-center gap-1.5">
          {PROJECT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() =>
                setTypeFilter((f) => {
                  const next = { ...f, [t]: !f[t] };
                  if (!Object.values(next).some(Boolean)) return f;
                  return next;
                })
              }
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                typeFilter[t]
                  ? "text-white"
                  : "bg-slate-100 text-slate-400 line-through"
              )}
              style={typeFilter[t] ? { background: TYPE_COLOR[t] } : undefined}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
          {view === "calendar" && (
            <button
              onClick={() => setShowPersonal((s) => !s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                showPersonal ? "bg-pink-400 text-white" : "bg-slate-100 text-slate-400"
              )}
            >
              개인일정
            </button>
          )}
        </div>
      )}

      {/* 뷰 본문 */}
      {view === "kanban" && (
        <KanbanView
          projects={active}
          search={search}
          statusFilter={statusFilter}
          onMove={(id, type) => patchProject(id, { type })}
          onArchive={(id) => patchProject(id, { archived: true })}
          onEdit={openEdit}
        />
      )}
      {view === "gantt" && (
        <GanttView
          projects={active.filter((p) => typeFilter[p.type])}
          onEdit={openEdit}
        />
      )}
      {view === "calendar" && (
        <CalendarView
          projects={active.filter((p) => typeFilter[p.type])}
          events={showPersonal ? events : []}
          onEditProject={openEdit}
          onAddPersonal={(date) => setEventModal({ event: null, date })}
          onEditPersonal={(ev) => setEventModal({ event: ev, date: ev.startDate })}
        />
      )}
      {view === "team" && <TeamView members={members} projects={active} />}

      {/* 모달들 */}
      {modalOpen && (
        <ProjectModal
          project={editing}
          members={members}
          onClose={() => setModalOpen(false)}
          onSave={saveProject}
          onDelete={removeProject}
        />
      )}
      {eventModal && (
        <PersonalEventModal
          event={eventModal.event}
          date={eventModal.date}
          onClose={() => setEventModal(null)}
          onSave={saveEvent}
          onDelete={removeEvent}
        />
      )}
      {archiveOpen && (
        <ArchiveModal
          archived={archived}
          onClose={() => setArchiveOpen(false)}
          onRestore={(id) => patchProject(id, { archived: false, status: "진행중" })}
          onDelete={removeProject}
          onEdit={(p) => {
            setArchiveOpen(false);
            openEdit(p);
          }}
        />
      )}
    </div>
  );
}

function safeIds(json: string): string[] {
  try {
    const a = JSON.parse(json);
    return Array.isArray(a) ? a.map(String) : [];
  } catch {
    return [];
  }
}
