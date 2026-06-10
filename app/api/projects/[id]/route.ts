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

const updateSchema = z.object({
  type: z.enum(["RFI", "RFP", "실행중인 프로젝트"]).optional(),
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
  archived: z.boolean().optional(),
  emailContent: z.string().optional(),
  opEpicUrl: z.string().optional(),
  opEffortUrl: z.string().optional(),
  opQaUrl: z.string().optional(),
  opUserIds: z.array(z.string()).optional(),
  order: z.number().optional(),
  assignments: z.array(assignmentSchema).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { assignments: true },
  });
  if (!project) return NextResponse.json({ error: "없음" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "잘못된 요청" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const data: Record<string, unknown> = {};
  const scalar = [
    "type", "name", "subtitle", "remark", "client", "summary",
    "effort", "effortUnit", "effortDetail", "status", "archived",
    "emailContent", "opEpicUrl", "opEffortUrl", "opQaUrl", "order",
  ] as const;
  for (const k of scalar) {
    if (d[k] !== undefined) data[k] = d[k];
  }
  if (d.startDate !== undefined) data.startDate = d.startDate || null;
  if (d.endDate !== undefined) data.endDate = d.endDate || null;
  if (d.opUserIds !== undefined) data.opUserIds = JSON.stringify(d.opUserIds);

  try {
    const project = await prisma.$transaction(async (tx) => {
      // 배정이 들어오면 전체 교체
      if (d.assignments !== undefined) {
        await tx.assignment.deleteMany({ where: { projectId: params.id } });
        for (const a of d.assignments) {
          await tx.assignment.create({
            data: {
              projectId: params.id,
              userId: a.userId || null,
              name: a.name,
              role: a.role,
              effort: a.effort,
              effortUnit: a.effortUnit,
            },
          });
        }
      }
      return tx.project.update({
        where: { id: params.id },
        data,
        include: { assignments: true },
      });
    });
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "없음" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.project.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "없음" }, { status: 404 });
  }
}
