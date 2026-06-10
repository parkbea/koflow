import path from "path";
import fs from "fs";

/**
 * OpenProject 연동 설정 저장 (data/op-config.json).
 * apiKey 는 서버에만 보관하며 클라이언트로 노출하지 않는다.
 */
export type OpConfig = {
  baseUrl: string;
  apiKey: string;
};

function dataDir(): string {
  const url = process.env.DATABASE_URL ?? "file:../data/koflow.db";
  let f = url.replace(/^file:/, "");
  if (path.isAbsolute(f)) return path.dirname(f);
  f = f.replace(/^\.\.\//, "").replace(/^\.\//, "");
  return path.dirname(path.join(process.cwd(), f));
}

function configPath(): string {
  return path.join(dataDir(), "op-config.json");
}

export function readOpConfig(): OpConfig {
  try {
    const raw = fs.readFileSync(configPath(), "utf-8");
    const c = JSON.parse(raw);
    return { baseUrl: c.baseUrl ?? "", apiKey: c.apiKey ?? "" };
  } catch {
    return { baseUrl: "", apiKey: "" };
  }
}

export function writeOpConfig(c: OpConfig): void {
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(c, null, 2), "utf-8");
}

/** OpenProject API 호출용 Basic 인증 헤더 (username 고정값 'apikey') */
export function authHeader(apiKey: string): string {
  return "Basic " + Buffer.from(`apikey:${apiKey}`).toString("base64");
}

/** baseUrl 정규화 (끝 슬래시 제거) */
export function normalizeBase(url: string): string {
  return url.trim().replace(/\/+$/, "");
}
