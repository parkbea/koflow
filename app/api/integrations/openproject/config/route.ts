import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  readOpConfig,
  writeOpConfig,
  normalizeBase,
  authHeader,
} from "@/lib/opConfig";

export const runtime = "nodejs";

// GET: 설정 조회 (apiKey 는 노출하지 않고 설정 여부만 반환)
export async function GET() {
  const c = readOpConfig();
  return NextResponse.json({
    baseUrl: c.baseUrl,
    hasApiKey: !!c.apiKey,
  });
}

const saveSchema = z.object({
  baseUrl: z.string(),
  apiKey: z.string().optional(), // 비우면 기존 키 유지
  test: z.boolean().optional(),
});

// POST: 저장 (+ test:true 면 연결 테스트)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  const prev = readOpConfig();
  const baseUrl = normalizeBase(parsed.data.baseUrl);
  const apiKey = parsed.data.apiKey ? parsed.data.apiKey : prev.apiKey;

  if (parsed.data.test) {
    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { error: "서버 URL과 API 키를 입력하세요." },
        { status: 400 }
      );
    }
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(`${baseUrl}/api/v3/users/me`, {
        headers: { Authorization: authHeader(apiKey) },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        return NextResponse.json(
          { error: `연결 실패 (HTTP ${res.status})` },
          { status: 400 }
        );
      }
      const me = await res.json();
      // 테스트 성공 시 저장
      writeOpConfig({ baseUrl, apiKey });
      return NextResponse.json({
        ok: true,
        user: me?.name ?? me?.login ?? "연결됨",
      });
    } catch {
      return NextResponse.json(
        { error: "서버에 연결할 수 없습니다. URL/네트워크를 확인하세요." },
        { status: 400 }
      );
    }
  }

  writeOpConfig({ baseUrl, apiKey });
  return NextResponse.json({ ok: true });
}
