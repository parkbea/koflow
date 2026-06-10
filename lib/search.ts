import db from "./sqlite";
import { extractText } from "./tiptap";

/**
 * SQLite FTS5 기반 문서 전문검색.
 * Document 의 생성/수정/삭제 시 docs_fts 테이블을 동기화한다.
 */

const upsertStmt = db.prepare(
  `INSERT INTO docs_fts (docId, title, content, tags) VALUES (@docId, @title, @content, @tags)`
);
const deleteStmt = db.prepare(`DELETE FROM docs_fts WHERE docId = ?`);

export function indexDocument(doc: {
  id: string;
  title: string;
  content: string;
  tags?: string;
}) {
  deleteStmt.run(doc.id);
  const tagText = (() => {
    try {
      return (JSON.parse(doc.tags ?? "[]") as string[]).join(" ");
    } catch {
      return "";
    }
  })();
  upsertStmt.run({
    docId: doc.id,
    title: doc.title ?? "",
    content: extractText(doc.content),
    tags: tagText,
  });
}

export function removeDocument(docId: string) {
  deleteStmt.run(docId);
}

// 하이라이트 마커 (HTML 대신 제어문자 → 렌더 시 <mark> 로 변환, XSS 방지)
export const HL_START = String.fromCharCode(1);
export const HL_END = String.fromCharCode(2);

export type SearchHit = {
  docId: string;
  title: string;
  snippet: string;
  rank: number;
};

/**
 * FTS5 검색 실행. snippet() 으로 매치 구간을 마커로 감싼다.
 * 사용자 입력은 prefix 매치가 되도록 토큰별로 가공한다.
 */
export function searchDocuments(query: string, limit = 30): SearchHit[] {
  const q = query.trim();
  if (!q) return [];

  // 특수문자 제거 후 토큰별 prefix 매치 (예: "결제 오류" → "결제"* OR "오류"*)
  const tokens = q
    .replace(/["()*]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `"${t}"*`);
  if (tokens.length === 0) return [];
  const matchExpr = tokens.join(" OR ");

  try {
    const rows = db
      .prepare(
        `SELECT docId,
                title,
                snippet(docs_fts, 2, @s, @e, ' … ', 12) AS snippet,
                rank
         FROM docs_fts
         WHERE docs_fts MATCH @match
         ORDER BY rank
         LIMIT @limit`
      )
      .all({ s: HL_START, e: HL_END, match: matchExpr, limit }) as SearchHit[];
    return rows;
  } catch {
    return [];
  }
}

/** 전체 문서를 FTS 에 재색인 (seed / 복구용) */
export function reindexAll(
  docs: { id: string; title: string; content: string; tags?: string }[]
) {
  db.exec("DELETE FROM docs_fts");
  const tx = db.transaction((items: typeof docs) =>
    items.forEach((d) => indexDocument(d))
  );
  tx(docs);
}
