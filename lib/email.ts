// 이메일 텍스트 오프라인 분석 (외부 통신 없음, 망분리 안전)
// 붙여넣은 메일에서 프로젝트 정보를 추출한다.

export type EmailAnalysis = {
  subtitle: string;
  summary: string;
  startDate: string | null;
  endDate: string | null;
  opEpicUrl: string;
  opEffortUrl: string;
  opQaUrl: string;
  opUrls: string[];
};

// OpenProject URL 패턴 (projects / work_packages)
const OP_URL_RE =
  /https?:\/\/[^\s)>\]]+\/(?:projects|work_packages|wp)\/[^\s)>\]]+/gi;
const ANY_URL_RE = /https?:\/\/[^\s)>\]]+/gi;

// 날짜 패턴: 2024-01-31, 2024/1/31, 2024.01.31
const DATE_RE = /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/g;

function normDate(y: string, m: string, d: string): string {
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** 제목/프로젝트명 후보 추출 */
function extractTitle(text: string): string {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  // "제목:", "Subject:", "프로젝트:", "건명:" 등 라벨 우선
  const labelRe = /^(?:제목|subject|프로젝트|건명|title|案件名?)\s*[:：]\s*(.+)$/i;
  for (const l of lines) {
    const m = l.match(labelRe);
    if (m && m[1].trim()) return m[1].trim().slice(0, 120);
  }
  // 라벨 없으면 첫 비어있지 않은 줄
  const first = lines.find((l) => l.length > 0);
  return (first ?? "").slice(0, 120);
}

/** 요약: 본문 앞부분(라벨 줄 제외) */
function extractSummary(text: string): string {
  const cleaned = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" ");
  return cleaned.slice(0, 300);
}

export function analyzeEmail(text: string): EmailAnalysis {
  const body = text ?? "";

  // URL
  const opUrls = Array.from(
    new Set((body.match(OP_URL_RE) ?? []).map((u) => u.replace(/[.,)]+$/, "")))
  );
  if (opUrls.length === 0) {
    // op 패턴이 없으면 일반 URL이라도 후보로
    const any = Array.from(
      new Set((body.match(ANY_URL_RE) ?? []).map((u) => u.replace(/[.,)]+$/, "")))
    );
    opUrls.push(...any.slice(0, 3));
  }

  // URL 종류 추정 (epic/effort/qa)
  const pick = (kw: RegExp) => opUrls.find((u) => kw.test(u)) ?? "";
  const opEpicUrl = pick(/epic|backlog|project/i);
  const opEffortUrl = pick(/effort|cost|공수|estimate/i);
  const opQaUrl = pick(/qa|test|quality/i);

  // 날짜 (가장 이른 것=시작, 가장 늦은 것=종료)
  const dates: string[] = [];
  let m: RegExpExecArray | null;
  DATE_RE.lastIndex = 0;
  while ((m = DATE_RE.exec(body)) !== null) {
    const mm = Number(m[2]);
    const dd = Number(m[3]);
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      dates.push(normDate(m[1], m[2], m[3]));
    }
  }
  dates.sort();
  const startDate = dates[0] ?? null;
  const endDate = dates.length > 1 ? dates[dates.length - 1] : null;

  return {
    subtitle: extractTitle(body),
    summary: extractSummary(body),
    startDate,
    endDate,
    opEpicUrl,
    opEffortUrl,
    opQaUrl,
    opUrls,
  };
}
