"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PERSONAL_TYPES, PERSONAL_COLOR } from "@/lib/projects";
import type { PersonalEventData } from "./types";

export function PersonalEventModal({
  event,
  date,
  onClose,
  onSave,
  onDelete,
}: {
  event: PersonalEventData | null;
  date: string;
  onClose: () => void;
  onSave: (payload: Partial<PersonalEventData>, id?: string) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState({
    title: event?.title ?? "",
    type: event?.type ?? "개인",
    color: event?.color ?? PERSONAL_COLOR["개인"],
    startDate: event?.startDate ?? date,
    endDate: event?.endDate ?? "",
    memo: event?.memo ?? "",
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (!form.title.trim()) return;
    setSaving(true);
    const ok = await onSave(
      {
        title: form.title.trim(),
        type: form.type,
        color: form.color,
        startDate: form.startDate,
        endDate: form.endDate || null,
        memo: form.memo,
      },
      event?.id
    );
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Modal
      title={event ? "개인 일정 수정" : "개인 일정 추가"}
      onClose={onClose}
      footer={
        <>
          {event && (
            <Button
              variant="ghost"
              className="mr-auto text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (confirm("이 일정을 삭제하시겠습니까?")) {
                  onDelete(event.id);
                  onClose();
                }
              }}
            >
              삭제
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>제목</Label>
          <Input
            autoFocus
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="일정 제목"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>유형</Label>
            <Select
              value={form.type}
              onChange={(e) => {
                const t = e.target.value;
                setForm((f) => ({ ...f, type: t, color: PERSONAL_COLOR[t] ?? f.color }));
              }}
            >
              {PERSONAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>색상</Label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => set("color", e.target.value)}
              className="h-9 w-full rounded-md border"
            />
          </div>
          <div className="space-y-2">
            <Label>시작일</Label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>종료일 (선택)</Label>
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>메모</Label>
          <Textarea
            rows={3}
            value={form.memo}
            onChange={(e) => set("memo", e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
