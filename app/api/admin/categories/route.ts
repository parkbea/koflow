import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요"),
  parentId: z.string().nullable().optional(),
  order: z.number().optional(),
});

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { documents: true } } },
  });
  return NextResponse.json(categories);
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
  const count = await prisma.category.count({
    where: { parentId: d.parentId || null },
  });
  const category = await prisma.category.create({
    data: {
      name: d.name,
      parentId: d.parentId || null,
      order: d.order ?? count,
    },
  });
  return NextResponse.json(category, { status: 201 });
}
