import Link from "next/link";
import {
  LayoutGrid,
  FileText,
  AlertTriangle,
  ArrowRight,
  PenLine,
  Layers,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  isDone,
  displayName,
  dDay,
  toMM,
  TYPE_COLOR,
  TYPE_LABEL,
  PROJECT_TYPES,
} from "@/lib/projects";

export const dynamic = "force-dynamic";

/** dDay().cls(텍스트색) → 필 배지 클래스 */
const DDAY_PILL: Record<string, string> = {
  "text-red-500": "bg-red-50 text-red-600 ring-1 ring-red-100",
  "text-amber-500": "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
  "text-blue-400": "bg-blue-50 text-blue-500 ring-1 ring-blue-100",
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "고요한 새벽이에요";
  if (h < 12) return "좋은 아침이에요";
  if (h < 18) return "활기찬 오후예요";
  return "수고 많았어요, 저녁이에요";
}

export default async function DashboardPage() {
  const [projects, recentDocs, docCount] = await Promise.all([
    prisma.project.findMany({ include: { assignments: true } }),
    prisma.document.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { author: true, category: true },
    }),
    prisma.document.count(),
  ]);

  const active = projects.filter((p) => !isDone(p));
  const totalMM = active.reduce((s, p) => s + toMM(p.effort, p.effortUnit), 0);
  const today = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  const byType = PROJECT_TYPES.map((t) => ({
    type: t,
    label: TYPE_LABEL[t],
    color: TYPE_COLOR[t],
    count: active.filter((p) => p.type === t).length,
  }));

  // 마감 임박/지연 프로젝트
  const upcoming = active
    .map((p) => ({ p, dd: dDay(p) }))
    .filter((x) => x.dd)
    .sort((a, b) => (a.p.endDate || "").localeCompare(b.p.endDate || ""))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* ── 히어로 ───────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-slate-900 px-7 py-7 text-white shadow-lift sm:px-9">
        {/* 장식 오브 */}
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-indigo-600/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 right-44 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-24 h-60 w-60 rounded-full bg-fuchsia-600/15 blur-3xl" />

        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-indigo-300">{today}</p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting()} <span className="align-middle">👋</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              진행 중인 프로젝트{" "}
              <span className="font-semibold text-white">{active.length}건</span>
              {" · "}총 공수{" "}
              <span className="font-semibold text-white">
                {totalMM.toFixed(1)} MM
              </span>
              {" · "}문서{" "}
              <span className="font-semibold text-white">{docCount}건</span>
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-400 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/40 active:translate-y-0"
            >
              <LayoutGrid className="h-4 w-4" />
              업무 보드
            </Link>
            <Link
              href="/docs/new"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/10 hover:text-white active:translate-y-0"
            >
              <PenLine className="h-4 w-4" />
              새 문서
            </Link>
          </div>
        </div>

        {/* 타입별 현황 미니 바 */}
        <div className="relative mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
          {byType.map((t) => (
            <Link
              key={t.type}
              href="/projects"
              className="group rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur transition-colors hover:bg-white/10"
            >
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: t.color }}
                />
                {t.label}
              </div>
              <p className="mt-1 text-xl font-bold leading-none">
                {t.count}
                <span className="ml-0.5 text-xs font-normal text-slate-500">
                  건
                </span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 본문 2열 ─────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 마감 임박 */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-gradient-to-r from-rose-50/60 to-transparent py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-500">
                <AlertTriangle className="h-4 w-4" />
              </span>
              마감 임박 / 지연
            </CardTitle>
            <Link
              href="/projects"
              className="group flex items-center gap-1 text-sm font-medium text-primary"
            >
              보드 열기
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-0.5 p-3">
            {upcoming.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                임박한 마감이 없습니다. 🎉
              </p>
            )}
            {upcoming.map(({ p, dd }) => (
              <Link
                key={p.id}
                href="/projects"
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: TYPE_COLOR[p.type] }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {displayName(p)}
                    </span>
                    {p.endDate && (
                      <span className="block text-xs text-muted-foreground">
                        ~ {p.endDate}
                      </span>
                    )}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    DDAY_PILL[dd!.cls] ?? "bg-slate-100 text-slate-500"
                  }`}
                >
                  {dd!.txt}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* 최근 문서 */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-transparent py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-500">
                <FileText className="h-4 w-4" />
              </span>
              최근 문서
              <Badge variant="secondary">{docCount}</Badge>
            </CardTitle>
            <Link
              href="/docs"
              className="group flex items-center gap-1 text-sm font-medium text-primary"
            >
              전체보기
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-0.5 p-3">
            {recentDocs.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                문서가 없습니다.
              </p>
            )}
            {recentDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/docs/${doc.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {doc.title}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {doc.category && <span>{doc.category.name}</span>}
                    {doc.category && <span>·</span>}
                    <span>{formatDate(doc.updatedAt)}</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── 전체 공수 요약 ───────────────────── */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-500">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">투입 공수 합계</p>
              <p className="text-xs text-muted-foreground">
                진행 중 프로젝트 {active.length}건 기준
              </p>
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {totalMM.toFixed(1)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              MM
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
