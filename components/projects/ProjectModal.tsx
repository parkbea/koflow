"use client";

import { useState } from "react";
import { Plus, Trash2, Sparkles, DownloadCloud, ExternalLink } from "lucide-react";
import { analyzeEmail } from "@/lib/email";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  PROJECT_TYPES,
  TYPE_LABEL,
  ALL_STATUSES,
  EFFORT_UNITS,
} from "@/lib/projects";
import type { ProjectData, MemberLite, Assignment } from "./types";

export function ProjectModal({
  project,
  members,
  onClose,
  onSave,
  onDelete,
}: {
  project: ProjectData | null;
  members: MemberLite[];
  onClose: () => void;
  onSave: (payload: Partial<ProjectData>, id?: string) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [f, setF] = useState({
    type: project?.type ?? "RFI",
    subtitle: project?.subtitle ?? "",
    name: project?.name ?? "",
    client: project?.client ?? "",
    status: project?.status ?? "대기",
    effort: project?.effort?.toString() ?? "0",
    effortUnit: project?.effortUnit ?? "MM",
    startDate: project?.startDate ?? "",
    endDate: project?.endDate ?? "",
    summary: project?.summary ?? "",
    remark: project?.remark ?? "",
    effortDetail: project?.effortDetail ?? "",
    opEpicUrl: project?.opEpicUrl ?? "",
    opEffortUrl: project?.opEffortUrl ?? "",
    opQaUrl: project?.opQaUrl ?? "",
    emailContent: project?.emailContent ?? "",
  });
  const [assigns, setAssigns] = useState<Assignment[]>(
    project?.assignments ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [opMsg, setOpMsg] = useState("");
  const [opBusy, setOpBusy] = useState(false);

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((s) => ({ ...s, [k]: v }));
  }

  // 이메일 텍스트 분석 → 빈 필드 자동 채움 (오프라인)
  function doAnalyze() {
    if (!f.emailContent.trim()) {
      setOpMsg("분석할 이메일 내용을 입력하세요.");
      return;
    }
    const r = analyzeEmail(f.emailContent);
    setF((s) => ({
      ...s,
      subtitle: s.subtitle || r.subtitle,
      summary: s.summary || r.summary,
      startDate: s.startDate || (r.startDate ?? ""),
      endDate: s.endDate || (r.endDate ?? ""),
      opEpicUrl: s.opEpicUrl || r.opEpicUrl,
      opEffortUrl: s.opEffortUrl || r.opEffortUrl,
      opQaUrl: s.opQaUrl || r.opQaUrl,
    }));
    setOpMsg(
      `분석 완료 — OpenProject URL ${r.opUrls.length}건, 날짜 ${
        [r.startDate, r.endDate].filter(Boolean).length
      }건 추출 (빈 칸만 채움)`
    );
  }

  // OpenProject URL 로 프로젝트 정보 가져오기 (서버 프록시 경유)
  async function doFetchOP() {
    const url = f.opEpicUrl || f.opEffortUrl || f.opQaUrl;
    if (!url) {
      setOpMsg("OpenProject URL이 없습니다. 먼저 URL 입력 또는 이메일 분석을 하세요.");
      return;
    }
    setOpBusy(true);
    setOpMsg("OpenProject 조회 중...");
    try {
      const res = await fetch(
        `/api/integrations/openproject/fetch?url=${encodeURIComponent(url)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setOpMsg(data.error ?? "가져오기 실패");
        return;
      }
      setF((s) => ({
        ...s,
        name: data.name || s.name,
        subtitle: s.subtitle || data.name || "",
        summary: data.summary || s.summary,
        startDate: data.startDate || s.startDate,
        endDate: data.endDate || s.endDate,
      }));
      setOpMsg("OpenProject 정보를 가져왔습니다.");
    } catch {
      setOpMsg("연결 실패 — 관리 > 연동 설정을 확인하세요.");
    } finally {
      setOpBusy(false);
    }
  }

  function addAssign() {
    setAssigns((a) => [
      ...a,
      { userId: null, name: "", role: "", effort: 1, effortUnit: "MM" },
    ]);
  }
  function updateAssign(i: number, patch: Partial<Assignment>) {
    setAssigns((a) => a.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeAssign(i: number) {
    setAssigns((a) => a.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!f.subtitle.trim() && !f.name.trim()) {
      setError("표시명 또는 원제를 입력하세요.");
      return;
    }
    setSaving(true);
    setError("");
    const ok = await onSave(
      {
        type: f.type,
        subtitle: f.subtitle.trim(),
        name: f.name.trim(),
        client: f.client.trim(),
        status: f.status,
        effort: parseFloat(f.effort) || 0,
        effortUnit: f.effortUnit,
        startDate: f.startDate || null,
        endDate: f.endDate || null,
        summary: f.summary,
        remark: f.remark,
        effortDetail: f.effortDetail,
        opEpicUrl: f.opEpicUrl.trim(),
        opEffortUrl: f.opEffortUrl.trim(),
        opQaUrl: f.opQaUrl.trim(),
        emailContent: f.emailContent,
        assignments: assigns.map((a) => ({
          userId: a.userId || null,
          name: a.name,
          role: a.role,
          effort: Number(a.effort) || 0,
          effortUnit: a.effortUnit,
        })),
      },
      project?.id
    );
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Modal
      title={project ? "프로젝트 수정" : "새 프로젝트"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          {project && (
            <Button
              variant="ghost"
              className="mr-auto text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (confirm("이 프로젝트를 삭제하시겠습니까?")) {
                  onDelete(project.id);
                  onClose();
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>유형</Label>
            <Select value={f.type} onChange={(e) => set("type", e.target.value)}>
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>상태</Label>
            <Select value={f.status} onChange={(e) => set("status", e.target.value)}>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>표시명 (한글)</Label>
          <Input
            autoFocus
            value={f.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            placeholder="목록에 표시될 한글 이름"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>원제 (선택)</Label>
            <Input
              value={f.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="OpenProject 원제 등"
            />
          </div>
          <div className="space-y-1.5">
            <Label>고객사</Label>
            <Input
              value={f.client}
              onChange={(e) => set("client", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>시작일</Label>
            <Input type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>종료일</Label>
            <Input type="date" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>공수</Label>
            <Input type="number" step="0.1" value={f.effort} onChange={(e) => set("effort", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>단위</Label>
            <Select value={f.effortUnit} onChange={(e) => set("effortUnit", e.target.value)}>
              {EFFORT_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>요약</Label>
          <Textarea rows={2} value={f.summary} onChange={(e) => set("summary", e.target.value)} />
        </div>

        {/* 배정 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>담당자 배정</Label>
            <Button type="button" size="sm" variant="outline" onClick={addAssign}>
              <Plus className="h-3.5 w-3.5" />
              추가
            </Button>
          </div>
          {assigns.length === 0 && (
            <p className="text-xs text-muted-foreground">배정된 담당자가 없습니다.</p>
          )}
          <div className="space-y-2">
            {assigns.map((a, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                <Select
                  value={a.userId ?? ""}
                  onChange={(e) => {
                    const uid = e.target.value;
                    const m = members.find((x) => x.id === uid);
                    updateAssign(i, {
                      userId: uid || null,
                      name: m ? m.name : a.name,
                      role: m && !a.role ? m.role : a.role,
                    });
                  }}
                  className="w-32"
                >
                  <option value="">직접 입력</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
                <Input
                  value={a.name}
                  onChange={(e) => updateAssign(i, { name: e.target.value })}
                  placeholder="이름"
                  className="w-24"
                />
                <Input
                  value={a.role}
                  onChange={(e) => updateAssign(i, { role: e.target.value })}
                  placeholder="역할"
                  className="w-24"
                />
                <Input
                  type="number"
                  step="0.1"
                  value={a.effort}
                  onChange={(e) => updateAssign(i, { effort: Number(e.target.value) })}
                  className="w-16"
                />
                <Select
                  value={a.effortUnit}
                  onChange={(e) => updateAssign(i, { effortUnit: e.target.value })}
                  className="w-20"
                >
                  {EFFORT_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => removeAssign(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* 상세 (접이식 대신 항상 노출, 간결히) */}
        <details className="rounded-md border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            상세 정보 (비고 · 공수근거 · OpenProject 링크)
          </summary>
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label>비고</Label>
              <Textarea rows={2} value={f.remark} onChange={(e) => set("remark", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>공수 산정 근거</Label>
              <Textarea rows={2} value={f.effortDetail} onChange={(e) => set("effortDetail", e.target.value)} />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <UrlField label="Epic URL" value={f.opEpicUrl} onChange={(v) => set("opEpicUrl", v)} />
              <UrlField label="공수 URL" value={f.opEffortUrl} onChange={(v) => set("opEffortUrl", v)} />
              <UrlField label="QA URL" value={f.opQaUrl} onChange={(v) => set("opQaUrl", v)} />
            </div>
          </div>
        </details>

        {/* 외부 연동: 이메일 분석 + OpenProject 가져오기 */}
        <div className="rounded-md border bg-muted/30 p-3">
          <div className="mb-2 text-sm font-medium text-muted-foreground">
            외부 연동
          </div>
          <Textarea
            rows={3}
            value={f.emailContent}
            onChange={(e) => set("emailContent", e.target.value)}
            placeholder="이메일 내용을 붙여넣고 '이메일 분석'을 누르면 제목·날짜·요약·OpenProject URL을 자동 추출합니다."
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={doAnalyze}>
              <Sparkles className="h-4 w-4" />
              이메일 분석
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={doFetchOP}
              disabled={opBusy}
            >
              <DownloadCloud className="h-4 w-4" />
              OpenProject 가져오기
            </Button>
          </div>
          {opMsg && (
            <p className="mt-2 text-xs text-muted-foreground">{opMsg}</p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </Modal>
  );
}

// URL 입력 + "열기"(새 창) 링크. URL 이 있을 때만 링크 표시.
function UrlField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const valid = /^https?:\/\//i.test(value.trim());
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        {valid && (
          <a
            href={value.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
            title="새 창으로 열기"
          >
            <ExternalLink className="h-3 w-3" />
            열기
          </a>
        )}
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="http://..."
      />
    </div>
  );
}
