import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

// 허용 확장자 (망분리: 외부 저장소 없이 로컬 파일시스템에만 저장)
const ALLOWED = new Set(["jpg", "jpeg", "png", "gif", "webp", "pdf", "md"]);
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "파일 크기는 10MB 이하만 가능합니다." },
      { status: 400 }
    );
  }

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED.has(ext)) {
    return NextResponse.json(
      { error: `허용되지 않는 형식입니다. (${Array.from(ALLOWED).join(", ")})` },
      { status: 400 }
    );
  }

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const filename = `${randomUUID()}.${ext}`;

  const relDir = path.join("uploads", year, month);
  const absDir = path.join(process.cwd(), relDir);
  await fs.mkdir(absDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(absDir, filename), buffer);

  // 정적 서빙 URL (next.config 의 rewrite 로 /uploads → 파일 제공)
  const url = `/uploads/${year}/${month}/${filename}`;
  return NextResponse.json({ url, name: file.name });
}
