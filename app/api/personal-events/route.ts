import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().min(1, "제목을 입력하세요"),
  type: z.string().optional(),
  color: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().nullable().optional(),
  memo: z.string().optional(),
});

export async function GET() {
  const events = await prisma.personalEvent.findMany({
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json(events);
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
  const event = await prisma.personalEvent.create({
    data: {
      title: d.title,
      type: d.type ?? "개인",
      color: d.color ?? "#ec4899",
      startDate: d.startDate,
      endDate: d.endDate || null,
      memo: d.memo ?? "",
    },
  });
  return NextResponse.json(event, { status: 201 });
}
