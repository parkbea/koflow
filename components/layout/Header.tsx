"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";

export function Header() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-slate-200/70 bg-white/70 px-6 backdrop-blur-md">
      <form onSubmit={onSearch} className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="문서·프로젝트 검색..."
          className="rounded-full border-slate-200 bg-slate-50/80 pl-8"
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        <Link href="/docs/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" />
          새 문서
        </Link>
      </div>
    </header>
  );
}
