import { Fragment } from "react";
import { HL_START, HL_END } from "@/lib/search";

/**
 * snippet 의 제어문자 마커를 <mark> 로 안전하게 렌더 (HTML 주입 없음)
 */
export function Highlight({ text }: { text: string }) {
  //  ...  구간을 강조
  const regex = new RegExp(`${HL_START}([^${HL_END}]*)${HL_END}`, "g");
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>
      );
    }
    nodes.push(
      <mark key={key++} className="rounded bg-yellow-200 px-0.5">
        {match[1]}
      </mark>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return <>{nodes}</>;
}
