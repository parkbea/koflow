import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
  md: "text/markdown; charset=utf-8",
};

/**
 * 루트 uploads/ 디렉토리의 파일을 서빙한다.
 * (public 밖에 보관 → standalone 빌드에서도 cwd 기준으로 동작)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const segments = params.path ?? [];

  // 경로 탈출 방지
  const rel = path.posix.join(...segments);
  if (rel.includes("..") || path.isAbsolute(rel)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const filePath = path.join(process.cwd(), "uploads", ...segments);
  try {
    const data = await fs.readFile(filePath);
    const ext = (filePath.split(".").pop() ?? "").toLowerCase();
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
