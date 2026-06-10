import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요"),
  email: z.string().email("올바른 이메일을 입력하세요"),
  role: z.string().optional(),
  team: z.string().optional(),
  capacity: z.number().optional(),
  memo: z.string().optional(),
});

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      team: true,
      capacity: true,
      memo: true,
      createdAt: true,
      _count: { select: { documents: true, assignments: true } },
    },
  });
  return NextResponse.json(users);
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
  const exists = await prisma.user.findUnique({ where: { email: d.email } });
  if (exists) {
    return NextResponse.json(
      { error: "이미 존재하는 이메일입니다." },
      { status: 400 }
    );
  }
  const user = await prisma.user.create({
    data: {
      name: d.name,
      email: d.email,
      role: d.role ?? "member",
      team: d.team ?? null,
      capacity: d.capacity ?? 1,
      memo: d.memo ?? null,
      password: "",
    },
    select: {
      id: true, name: true, email: true, role: true,
      team: true, capacity: true, memo: true, createdAt: true,
    },
  });
  return NextResponse.json(user, { status: 201 });
}
