"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export function DocActions({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (!confirm("이 문서를 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;
    setDeleting(true);
    const res = await fetch(`/api/docs/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/docs");
      router.refresh();
    } else {
      alert("삭제에 실패했습니다.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/docs/${id}/edit`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <Pencil className="h-4 w-4" />
        수정
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        disabled={deleting}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        삭제
      </Button>
    </div>
  );
}
