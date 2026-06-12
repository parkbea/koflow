import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getDefaultUser } from "@/lib/user";
import { indexDocument } from "@/lib/search";

const createSchema = z.object({
  title: z.string().min(1, "제목을 입력하세요"),
  content: z.string().min(1),
  categoryId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published"]).optional(),
  visibility: z.enum(["team", "private"]).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category");
  const status = searchParams.get("status");

  const docs = await prisma.document.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { category: true, author: true },
  });
  return NextResponse.json(docs);
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
  const data = parsed.data;
  const user = await getDefaultUser();

  const doc = await prisma.document.create({
    data: {
      title: data.title,
      content: data.content,
      categoryId: data.categoryId || null,
      authorId: user.id,
      status: data.status ?? "published",
      visibility: data.visibility ?? "team",
      tags: JSON.stringify(data.tags ?? []),
    },
  });

  indexDocument(doc);
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "created",
      target: "document",
      targetId: doc.id,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
