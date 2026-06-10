"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  FolderTree,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type CatItem = {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  docCount: number;
};

export function CategoryManager({ initial }: { initial: CatItem[] }) {
  const router = useRouter();
  const [cats, setCats] = useState<CatItem[]>(initial);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");

  // 편집 상태
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editParent, setEditParent] = useState("");

  const tops = cats
    .filter((c) => !c.parentId)
    .sort((a, b) => a.order - b.order);
  const childrenOf = (pid: string) =>
    cats.filter((c) => c.parentId === pid).sort((a, b) => a.order - b.order);
  const hasChildren = (id: string) => cats.some((c) => c.parentId === id);

  async function api(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error ?? "요청 실패");
    }
    return res.json().catch(() => ({}));
  }

  async function add() {
    if (!name.trim()) return;
    try {
      const c = await api("/api/admin/categories", "POST", {
        name: name.trim(),
        parentId: parentId || null,
      });
      setCats((cs) => [...cs, { ...c, docCount: 0 }]);
      setName("");
      setParentId("");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "추가 실패");
    }
  }

  function startEdit(c: CatItem) {
    setEditing(c.id);
    setEditName(c.name);
    setEditParent(c.parentId ?? "");
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    try {
      await api(`/api/admin/categories/${id}`, "PUT", {
        name: editName.trim(),
        parentId: editParent || null,
      });
      setCats((cs) =>
        cs.map((c) =>
          c.id === id
            ? { ...c, name: editName.trim(), parentId: editParent || null }
            : c
        )
      );
      setEditing(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "수정 실패");
    }
  }

  async function remove(id: string) {
    if (!confirm("이 카테고리를 삭제하시겠습니까?")) return;
    try {
      await api(`/api/admin/categories/${id}`, "DELETE");
      setCats((cs) => cs.filter((c) => c.id !== id));
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "삭제 실패");
    }
  }

  // 같은 부모 내 형제와 순서 교환
  async function reorder(c: CatItem, dir: -1 | 1) {
    const siblings = (c.parentId ? childrenOf(c.parentId) : tops).slice();
    const idx = siblings.findIndex((s) => s.id === c.id);
    const swapWith = siblings[idx + dir];
    if (!swapWith) return;
    const a = c.order;
    const b = swapWith.order;
    // 동일 order 값이면 인덱스 기반으로 보정
    const newA = a === b ? idx + dir : b;
    const newB = a === b ? idx : a;
    setCats((cs) =>
      cs.map((x) =>
        x.id === c.id
          ? { ...x, order: newA }
          : x.id === swapWith.id
          ? { ...x, order: newB }
          : x
      )
    );
    try {
      await Promise.all([
        api(`/api/admin/categories/${c.id}`, "PUT", { order: newA }),
        api(`/api/admin/categories/${swapWith.id}`, "PUT", { order: newB }),
      ]);
      router.refresh();
    } catch {
      router.refresh();
    }
  }

  function row(c: CatItem, depth: number, isLast: boolean, isFirst: boolean) {
    const isEditing = editing === c.id;
    const parentOptions = tops.filter((t) => t.id !== c.id);
    const lockParent = hasChildren(c.id); // 하위가 있으면 최상위 고정

    return (
      <div
        key={c.id}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
        style={{ paddingLeft: depth * 20 + 8 }}
      >
        {isEditing ? (
          <>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 w-40"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit(c.id);
                if (e.key === "Escape") setEditing(null);
              }}
            />
            <Select
              value={editParent}
              onChange={(e) => setEditParent(e.target.value)}
              className="h-8 w-40"
              disabled={lockParent}
              title={lockParent ? "하위 항목이 있어 최상위만 가능" : "상위 카테고리"}
            >
              <option value="">(최상위)</option>
              {parentOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            <Button size="icon" variant="ghost" onClick={() => saveEdit(c.id)} title="저장">
              <Check className="h-4 w-4 text-emerald-600" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setEditing(null)} title="취소">
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <FolderTree
              className={depth === 0 ? "h-4 w-4 text-amber-600" : "h-3.5 w-3.5 text-muted-foreground"}
            />
            <span className="flex-1">
              <span className={depth === 0 ? "font-medium" : ""}>{c.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                문서 {c.docCount}
              </span>
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              disabled={isFirst}
              onClick={() => reorder(c, -1)}
              title="위로"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              disabled={isLast}
              onClick={() => reorder(c, 1)}
              title="아래로"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => startEdit(c)}
              title="편집"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive"
              onClick={() => remove(c.id)}
              title="삭제"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-2 p-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">카테고리 이름</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="새 카테고리"
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">상위</label>
            <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">(최상위)</option>
              {tops.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={add}>
            <Plus className="h-4 w-4" />
            추가
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-2">
          {tops.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              카테고리가 없습니다.
            </p>
          )}
          {tops.map((top, ti) => {
            const kids = childrenOf(top.id);
            return (
              <div key={top.id} className="border-b last:border-0">
                {row(top, 0, ti === tops.length - 1, ti === 0)}
                {kids.map((child, ci) =>
                  row(child, 1, ci === kids.length - 1, ci === 0)
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        편집(✎)에서 이름과 상위 카테고리를 바꿀 수 있고, ↑↓ 로 순서를 조정합니다.
      </p>
    </div>
  );
}
