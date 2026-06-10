import { cn } from "@/lib/utils";

/** koFlow 로고 — K + flow 화살표 (인라인 SVG, 망분리 안전) */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      className={cn("h-7 w-7", className)}
      aria-hidden="true"
    >
      {/* K */}
      <path d="M7 8 L7 36" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M7 22 L20 8" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 22 L21 36" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* flow 화살표 */}
      <path d="M26 16 L38 22 L26 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <path d="M28 22 L38 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/** koFlow 워드마크 (ko + Flow 그라데이션) */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-extrabold tracking-tight", className)}>
      <span className="text-sky-300">ko</span>
      <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
        Flow
      </span>
    </span>
  );
}
