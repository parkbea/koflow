"use client";

import { RotateCcw, Trash2, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { displayName, STATUS_BADGE } from "@/lib/projects";
import { cn } from "@/lib/utils";
import type { ProjectData } from "./types";

export function ArchiveModal({
  archived,
  onClose,
  onRestore,
  onDelete,
  onEdit,
}: {
  archived: ProjectData[];
  onClose: () => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (p: ProjectData) => void;
}) {
  return (
    <Modal title={`완료 보관함 (${archived.length})`} onClose={onClose} size="lg">
      {archived.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          보관된 프로젝트가 없습니다.
        </p>
      ) : (
        <div className="space-y-2">
          {archived.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{displayName(p)}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium",
                      STATUS_BADGE[p.status]
                    )}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.client && `${p.client} · `}
                  {p.startDate ?? ""}
                  {p.endDate ? ` ~ ${p.endDate}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => onEdit(p)} title="수정">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRestore(p.id)}
                  title="복원"
                >
                  <RotateCcw className="h-4 w-4" />
                  복원
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm("영구 삭제하시겠습니까?")) onDelete(p.id);
                  }}
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
