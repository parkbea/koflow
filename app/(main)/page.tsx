import Link from "next/link";
import {
  LayoutGrid,
  FileText,
  Clock,
  AlertTriangle,
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
  STATUS_BADGE,
} from "@/lib/projects";

export const dynamic = "force-dynamic";

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

  const stats = [
    { label: "전체", value: active.length, unit: "건", color: "#6366F1" },
    { label: "RFI", value: active.filter((p) => p.type === "RFI").length, unit: "건", color: TYPE_COLOR["RFI"] },
    { label: "RFP", value: active.filter((p) => p.type === "RFP").length, unit: "건", color: TYPE_COLOR["RFP"] },
    { label: "실행중", value: active.filter((p) => p.type === "실행중인 프로젝트").length, unit: "건", color: TYPE_COLOR["실행중인 프로젝트"] },
    { label: "총 공수", value: totalMM.toFixed(1), unit: "MM", color: "#8B5CF6" },
  ];

  // 마감 임박/지연 프로젝트
  const upcoming = active
    .map((p) => ({ p, dd: dDay(p) }))
    .filter((x) => x.dd)
    .sort((a, b) => (a.p.endDate || "").localeCompare(b.p.endDate || ""))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-sm text-muted-foreground">
          프로젝트 현황 & 사내 위키
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="border-l-4" style={{ borderColor: s.color }}>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${s.color}1a` }}
              >
                <Layers className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold leading-tight">
                  {s.value}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    {s.unit}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 마감 임박 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              마감 임박 / 지연
            </CardTitle>
            <Link href="/projects" className="text-sm text-primary hover:underline">
              보드 열기
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {upcoming.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                임박한 마감이 없습니다.
              </p>
            )}
            {upcoming.map(({ p, dd }) => (
              <Link
                key={p.id}
                href="/projects"
                className="flex items-center justify-between gap-2 rounded-md px-3 py-2 hover:bg-accent"
              >
                <span className="flex items-center gap-2 truncate">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: TYPE_COLOR[p.type] }}
                  />
                  <span className="truncate font-medium">{displayName(p)}</span>
                </span>
                <span className={`shrink-0 text-xs font-medium ${dd!.cls}`}>
                  {dd!.txt}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* 최근 문서 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              최근 문서
              <Badge variant="secondary">{docCount}</Badge>
            </CardTitle>
            <Link href="/docs" className="text-sm text-primary hover:underline">
              전체보기
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentDocs.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                문서가 없습니다.
              </p>
            )}
            {recentDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/docs/${doc.id}`}
                className="block rounded-md px-3 py-2 hover:bg-accent"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{doc.title}</span>
                  {doc.status === "draft" && (
                    <Badge variant="secondary" className="shrink-0">
                      초안
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {doc.category && <span>{doc.category.name}</span>}
                  <span>·</span>
                  <span>{formatDate(doc.updatedAt)}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <LayoutGrid className="h-4 w-4" />
          프로젝트 보드
        </Link>
        <Link
          href="/docs/new"
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <Clock className="h-4 w-4" />
          새 문서 작성
        </Link>
      </div>
    </div>
  );
}
