"use client";

import { useState } from "react";
import { History, Eye } from "lucide-react";
import { DocumentViewer } from "./DocumentViewer";
import { formatDate } from "@/lib/utils";

export type VersionItem = {
  id: string;
  version: number;
  title: string;
  content: string;
  createdAt: string;
};

export function VersionHistory({
  currentVersion,
  histories,
}: {
  currentVersion: number;
  histories: VersionItem[];
}) {
  const [active, setActive] = useState<VersionItem | null>(null);

  if (histories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        이전 버전 기록이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-1">
        <li className="flex items-center justify-between rounded-md bg-accent px-3 py-2 text-sm">
          <span className="font-medium">v{currentVersion} (현재)</span>
        </li>
        {histories.map((h) => (
          <li
            key={h.id}
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent"
          >
            <span>
              v{h.version}
              <span className="ml-2 text-xs text-muted-foreground">
                {formatDate(h.createdAt)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setActive(active?.id === h.id ? null : h)}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Eye className="h-3.5 w-3.5" />
              {active?.id === h.id ? "닫기" : "보기"}
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <div className="rounded-md border bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <History className="h-4 w-4" />
            v{active.version} · {active.title}
          </div>
          <DocumentViewer content={active.content} />
        </div>
      )}
    </div>
  );
}
