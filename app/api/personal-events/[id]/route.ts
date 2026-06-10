import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.string().optional(),
  color: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  memo: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  const d = parsed.data;
  const data: Record<string, unknown> = {};
  for (const k of ["title", "type", "color", "startDate", "memo"] as const) {
    if (d[k] !== undefined) data[k] = d[k];
  }
  if (d.endDate !== undefined) data.endDate = d.endDate || null;
  try {
    const event = await prisma.personalEvent.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: "없음" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.personalEvent.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "없음" }, { status: 404 });
  }
}
