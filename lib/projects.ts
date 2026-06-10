// 프로젝트 도메인 상수/유틸 (서버·클라이언트 공용, prisma 미의존)

export type ProjectType = "RFI" | "RFP" | "실행중인 프로젝트";
export type EffortUnit = "MM" | "MW" | "MD";

export const PROJECT_TYPES: ProjectType[] = ["RFI", "RFP", "실행중인 프로젝트"];

export const TYPE_LABEL: Record<string, string> = {
  RFI: "RFI",
  RFP: "RFP",
  "실행중인 프로젝트": "실행중",
};

// 칸반/간트/캘린더 공통 타입 색상 (hex)
export const TYPE_COLOR: Record<string, string> = {
  RFI: "#3B82F6",
  RFP: "#F59E0B",
  "실행중인 프로젝트": "#10B981",
};

// 좌측 보더 등 Tailwind 클래스
export const TYPE_BORDER: Record<string, string> = {
  RFI: "border-blue-400",
  RFP: "border-amber-400",
  "실행중인 프로젝트": "border-emerald-400",
};

export const PROGRESS_STATUSES = ["대기", "진행중"];
export const DONE_STATUSES = ["개발완료", "중지", "보류", "리젝", "완료"];
export const ALL_STATUSES = ["대기", "진행중", "개발완료", "중지", "보류", "리젝"];

export const STATUS_BADGE: Record<string, string> = {
  대기: "bg-slate-100 text-slate-500",
  진행중: "bg-blue-100 text-blue-700",
  개발완료: "bg-emerald-100 text-emerald-700",
  중지: "bg-rose-100 text-rose-700",
  보류: "bg-amber-100 text-amber-700",
  리젝: "bg-zinc-200 text-zinc-600",
  완료: "bg-emerald-100 text-emerald-700",
};

export const EFFORT_UNITS: EffortUnit[] = ["MM", "MW", "MD"];

export const PERSONAL_TYPES = [
  "개인",
  "휴가",
  "출장",
  "회의",
  "기념일",
  "기타",
];
export const PERSONAL_COLOR: Record<string, string> = {
  개인: "#ec4899",
  휴가: "#22c55e",
  출장: "#3b82f6",
  회의: "#a855f7",
  기념일: "#f59e0b",
  기타: "#64748b",
};

/** 공수를 MM(맨먼스) 기준으로 환산. 1MM = 4MW = 20MD */
export function toMM(effort: number | null | undefined, unit: string): number {
  const e = Number(effort) || 0;
  if (unit === "MW") return e / 4;
  if (unit === "MD") return e / 20;
  return e; // MM
}

export type ProjectLike = {
  type: string;
  name?: string | null;
  subtitle?: string | null;
  status: string;
  archived?: boolean;
  startDate?: string | null;
  endDate?: string | null;
};

/** 종료(완료/보관) 여부 */
export function isDone(p: ProjectLike): boolean {
  return !!p.archived || DONE_STATUSES.includes(p.status);
}

/** 목록 대표 표시명 = 서브타이틀(한글) 우선, 없으면 원제 */
export function displayName(p: ProjectLike): string {
  return p.subtitle && p.subtitle.trim() ? p.subtitle : p.name || "(제목 없음)";
}

/** 마감 D-day 계산 */
export function dDay(
  p: ProjectLike
): { txt: string; cls: string } | null {
  if (!p.endDate || isDone(p)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(p.endDate);
  if (Number.isNaN(end.getTime())) return null;
  const diff = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { txt: `${Math.abs(diff)}일 지연`, cls: "text-red-500" };
  if (diff === 0) return { txt: "오늘 마감", cls: "text-red-500" };
  if (diff <= 7) return { txt: `D-${diff}`, cls: "text-amber-500" };
  if (diff <= 30) return { txt: `D-${diff}`, cls: "text-blue-400" };
  return null;
}
