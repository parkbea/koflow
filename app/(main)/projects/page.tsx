import prisma from "@/lib/prisma";
import { ProjectBoard } from "@/components/projects/ProjectBoard";
import type {
  ProjectData,
  MemberLite,
  PersonalEventData,
} from "@/components/projects/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "업무 보드 · koFlow" };

function parseIds(json: string): string[] {
  try {
    const a = JSON.parse(json);
    return Array.isArray(a) ? a.map(String) : [];
  } catch {
    return [];
  }
}

export default async function ProjectsPage() {
  const [projects, members, events] = await Promise.all([
    prisma.project.findMany({
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      include: { assignments: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, role: true, team: true, capacity: true },
    }),
    prisma.personalEvent.findMany({ orderBy: { startDate: "asc" } }),
  ]);

  const projectData: ProjectData[] = projects.map((p) => ({
    id: p.id,
    type: p.type,
    name: p.name,
    subtitle: p.subtitle,
    remark: p.remark,
    client: p.client,
    summary: p.summary,
    effort: p.effort,
    effortUnit: p.effortUnit,
    effortDetail: p.effortDetail,
    startDate: p.startDate,
    endDate: p.endDate,
    status: p.status,
    archived: p.archived,
    emailContent: p.emailContent,
    opEpicUrl: p.opEpicUrl,
    opEffortUrl: p.opEffortUrl,
    opQaUrl: p.opQaUrl,
    opUserIds: parseIds(p.opUserIds),
    assignments: p.assignments.map((a) => ({
      id: a.id,
      userId: a.userId,
      name: a.name,
      role: a.role,
      effort: a.effort,
      effortUnit: a.effortUnit,
    })),
  }));

  const memberData: MemberLite[] = members;
  const eventData: PersonalEventData[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    color: e.color,
    startDate: e.startDate,
    endDate: e.endDate,
    memo: e.memo,
  }));

  return (
    <ProjectBoard
      initialProjects={projectData}
      members={memberData}
      initialEvents={eventData}
    />
  );
}
