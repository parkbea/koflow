/**
 * Tiptap JSON 콘텐츠에서 일반 텍스트를 추출한다.
 * - FTS 인덱싱 / 목록 미리보기용
 */
type TiptapNode = {
  type?: string;
  text?: string;
  content?: TiptapNode[];
};

export function extractText(content: string | null | undefined): string {
  if (!content) return "";
  let doc: TiptapNode;
  try {
    doc = JSON.parse(content);
  } catch {
    // JSON 이 아니면 그대로 텍스트 취급
    return String(content);
  }

  const parts: string[] = [];
  const walk = (node: TiptapNode | undefined) => {
    if (!node) return;
    if (node.text) parts.push(node.text);
    if (node.content) node.content.forEach(walk);
  };
  walk(doc);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** 빈 Tiptap 문서 JSON */
export const EMPTY_DOC = JSON.stringify({
  type: "doc",
  content: [{ type: "paragraph" }],
});
