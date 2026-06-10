import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().optional(),
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
  // 자기 자신을 부모로 지정 방지
  if (d.parentId && d.parentId === params.id) {
    return NextResponse.json(
      { error: "자기 자신을 상위로 지정할 수 없습니다." },
      { status: 400 }
    );
  }
  try {
    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.parentId !== undefined ? { parentId: d.parentId || null } : {}),
        ...(d.order !== undefined ? { order: d.order } : {}),
      },
    });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "없음" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const [childCount, docCount] = await Promise.all([
    prisma.category.count({ where: { parentId: params.id } }),
    prisma.document.count({ where: { categoryId: params.id } }),
  ]);
  if (childCount > 0) {
    return NextResponse.json(
      { error: "하위 카테고리가 있어 삭제할 수 없습니다." },
      { status: 400 }
    );
  }
  // 문서가 있으면 미지정으로 이동 후 삭제
  if (docCount > 0) {
    await prisma.document.updateMany({
      where: { categoryId: params.id },
      data: { categoryId: null },
    });
  }
  try {
    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "없음" }, { status: 404 });
  }
}
