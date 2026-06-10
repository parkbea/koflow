import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getDefaultUser } from "@/lib/user";
import { indexDocument, removeDocument } from "@/lib/search";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  categoryId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published"]).optional(),
  visibility: z.enum(["team", "private"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    include: { category: true, author: true },
  });
  if (!doc) return NextResponse.json({ error: "없음" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const existing = await prisma.document.findUnique({
    where: { id: params.id },
  });
  if (!existing) return NextResponse.json({ error: "없음" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "잘못된 요청" },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const user = await getDefaultUser();

  // 내용/제목 변경 시 이전 버전 스냅샷 저장
  const contentChanged =
    (data.content !== undefined && data.content !== existing.content) ||
    (data.title !== undefined && data.title !== existing.title);

  const updated = await prisma.$transaction(async (tx) => {
    if (contentChanged) {
      await tx.documentHistory.create({
        data: {
          documentId: existing.id,
          title: existing.title,
          content: existing.content,
          version: existing.version,
        },
      });
    }
    return tx.document.update({
      where: { id: existing.id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.categoryId !== undefined
          ? { categoryId: data.categoryId || null }
          : {}),
        ...(data.tags !== undefined
          ? { tags: JSON.stringify(data.tags) }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.visibility !== undefined
          ? { visibility: data.visibility }
          : {}),
        ...(contentChanged ? { version: existing.version + 1 } : {}),
      },
    });
  });

  indexDocument(updated);
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "updated",
      target: "document",
      targetId: updated.id,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const existing = await prisma.document.findUnique({
    where: { id: params.id },
  });
  if (!existing) return NextResponse.json({ error: "없음" }, { status: 404 });

  await prisma.$transaction([
    prisma.documentHistory.deleteMany({ where: { documentId: params.id } }),
    prisma.document.delete({ where: { id: params.id } }),
  ]);

  removeDocument(params.id);
  return NextResponse.json({ ok: true });
}
