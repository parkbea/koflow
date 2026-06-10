import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.string().optional(),
  team: z.string().nullable().optional(),
  capacity: z.number().optional(),
  memo: z.string().nullable().optional(),
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
  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: parsed.data,
      select: {
        id: true, name: true, email: true, role: true,
        team: true, capacity: true, memo: true,
      },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "없음" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const docCount = await prisma.document.count({
    where: { authorId: params.id },
  });
  if (docCount > 0) {
    return NextResponse.json(
      { error: "작성한 문서가 있어 삭제할 수 없습니다." },
      { status: 400 }
    );
  }
  // 프로젝트 배정은 미배정 처리 (이름은 보존)
  await prisma.assignment.updateMany({
    where: { userId: params.id },
    data: { userId: null },
  });
  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "없음" }, { status: 404 });
  }
}
