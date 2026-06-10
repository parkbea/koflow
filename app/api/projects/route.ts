import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const assignmentSchema = z.object({
  userId: z.string().nullable().optional(),
  name: z.string().default(""),
  role: z.string().default(""),
  effort: z.number().default(1),
  effortUnit: z.string().default("MM"),
});

const createSchema = z.object({
  type: z.enum(["RFI", "RFP", "실행중인 프로젝트"]).default("RFI"),
  name: z.string().optional(),
  subtitle: z.string().optional(),
  remark: z.string().optional(),
  client: z.string().optional(),
  summary: z.string().optional(),
  effort: z.number().optional(),
  effortUnit: z.enum(["MM", "MW", "MD"]).optional(),
  effortDetail: z.string().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  status: z.string().optional(),
  emailContent: z.string().optional(),
  opEpicUrl: z.string().optional(),
  opEffortUrl: z.string().optional(),
  opQaUrl: z.string().optional(),
  opUserIds: z.array(z.string()).optional(),
  assignments: z.array(assignmentSchema).optional(),
});

export async function GET(req: NextRequest) {
  const scope = new URL(req.url).searchParams.get("scope"); // active | archived | all
  const projects = await prisma.project.findMany({
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    include: { assignments: true },
  });
  if (scope === "archived")
    return NextResponse.json(projects.filter((p) => p.archived));
  if (scope === "active")
    return NextResponse.json(projects.filter((p) => !p.archived));
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "잘못된 요청" },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const project = await prisma.project.create({
    data: {
      type: d.type,
      name: d.name ?? "",
      subtitle: d.subtitle ?? "",
      remark: d.remark ?? "",
      client: d.client ?? "",
      summary: d.summary ?? "",
      effort: d.effort ?? 0,
      effortUnit: d.effortUnit ?? "MM",
      effortDetail: d.effortDetail ?? "",
      startDate: d.startDate || null,
      endDate: d.endDate || null,
      status: d.status ?? "대기",
      emailContent: d.emailContent ?? "",
      opEpicUrl: d.opEpicUrl ?? "",
      opEffortUrl: d.opEffortUrl ?? "",
      opQaUrl: d.opQaUrl ?? "",
      opUserIds: JSON.stringify(d.opUserIds ?? []),
      assignments: d.assignments
        ? {
            create: d.assignments.map((a) => ({
              userId: a.userId || null,
              name: a.name,
              role: a.role,
              effort: a.effort,
              effortUnit: a.effortUnit,
            })),
          }
        : undefined,
    },
    include: { assignments: true },
  });
  return NextResponse.json(project, { status: 201 });
}
