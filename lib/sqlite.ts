import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

/**
 * Prisma 와 동일한 SQLite 파일을 better-sqlite3 로 직접 연결한다.
 * - WAL 모드로 동시 접속 성능 향상 (Prisma 와 파일 공유)
 * - FTS5 전문검색 가상 테이블 관리 (Prisma 는 가상 테이블을 직접 다루기 어려움)
 *
 * 망분리 환경: 외부 DB 서버 없이 로컬 파일만 사용한다.
 */

// DATABASE_URL 또는 기본 경로(data/koflow.db)에서 DB 파일 경로 계산
// Prisma 와 동일한 파일을 가리키도록 한다.
//  - 절대경로(file:/abs/...): 그대로 사용 (standalone 배포 권장)
//  - 상대경로(file:../data/...): prisma 스키마 기준(../) 을 프로젝트 루트로 환산해 cwd 기준 적용
function resolveDbPath(): string {
  const url = process.env.DATABASE_URL ?? "file:../data/koflow.db";
  let filePart = url.replace(/^file:/, "");

  if (path.isAbsolute(filePart)) {
    return filePart;
  }
  filePart = filePart.replace(/^\.\.\//, "").replace(/^\.\//, "");
  return path.join(process.cwd(), filePart);
}

const globalForSqlite = globalThis as unknown as {
  sqlite: Database.Database | undefined;
};

function createConnection(): Database.Database {
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  // FTS5 전문검색 테이블 (앱에서 직접 동기화)
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS docs_fts USING fts5(
      docId UNINDEXED,
      title,
      content,
      tags,
      tokenize = 'unicode61'
    );
  `);

  return db;
}

const db = globalForSqlite.sqlite ?? createConnection();
if (process.env.NODE_ENV !== "production") {
  globalForSqlite.sqlite = db;
}

export default db;
