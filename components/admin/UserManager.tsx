"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";

export type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string | null;
  capacity: number;
  createdAt: string;
  docCount: number;
  assignCount: number;
};

export function UserManager({ initial }: { initial: UserItem[] }) {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>(initial);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    team: "",
    capacity: "1",
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function add() {
    if (!form.name.trim() || !form.email.trim()) return;
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        team: form.team.trim(),
        capacity: parseFloat(form.capacity) || 1,
      }),
    });
    if (res.ok) {
      const u = await res.json();
      setUsers((us) => [...us, { ...u, docCount: 0, assignCount: 0 }]);
      setForm({ name: "", email: "", role: "", team: "", capacity: "1" });
      router.refresh();
    } else {
      alert((await res.json()).error ?? "추가 실패");
    }
  }

  async function remove(id: string) {
    if (!confirm("이 팀원을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((us) => us.filter((u) => u.id !== id));
      router.refresh();
    } else {
      alert((await res.json()).error ?? "삭제 실패");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-2 p-4">
          <Field label="이름">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="홍길동" className="w-28" />
          </Field>
          <Field label="이메일" grow>
            <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="user@company.local" />
          </Field>
          <Field label="직무">
            <Input value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="백엔드" className="w-24" />
          </Field>
          <Field label="팀">
            <Input value={form.team} onChange={(e) => set("team", e.target.value)} placeholder="개발" className="w-24" />
          </Field>
          <Field label="가용공수(MM)">
            <Input type="number" step="0.1" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} className="w-24" />
          </Field>
          <Button onClick={add}>
            <Plus className="h-4 w-4" />
            추가
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">이름</th>
                <th className="px-4 py-2 font-medium">이메일</th>
                <th className="px-4 py-2 font-medium">직무</th>
                <th className="px-4 py-2 font-medium">팀</th>
                <th className="px-4 py-2 font-medium">가용공수</th>
                <th className="px-4 py-2 font-medium">문서/배정</th>
                <th className="px-4 py-2 font-medium">등록일</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">{u.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-2">{u.role || "-"}</td>
                  <td className="px-4 py-2">{u.team || "-"}</td>
                  <td className="px-4 py-2">{u.capacity} MM</td>
                  <td className="px-4 py-2">
                    <Badge variant="outline">
                      {u.docCount} / {u.assignCount}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {formatDateShort(u.createdAt)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => remove(u.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
  grow,
}: {
  label: string;
  children: React.ReactNode;
  grow?: boolean;
}) {
  return (
    <div className={`space-y-1 ${grow ? "flex-1" : ""}`}>
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
