"use client";

import { Suspense, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import type { CategoryNode } from "@/lib/categories";

const STORAGE_KEY = "koflow.sidebarHidden";

export function AppShell({
  categories,
  children,
}: {
  categories: CategoryNode[];
  children: React.ReactNode;
}) {
  // 초기엔 표시 상태로 렌더(SSR 일치) → 마운트 후 저장값 반영
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHidden(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function toggle() {
    setHidden((h) => {
      const next = !h;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* 무시 */
      }
      return next;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 사이드바: 펼침(w-64) ↔ 아이콘 레일(w-16) 폭 애니메이션 */}
      <div
        className={`flex-shrink-0 overflow-hidden transition-[width] duration-200 ${
          hidden ? "w-16" : "w-64"
        }`}
      >
        <Suspense>
          <Sidebar categories={categories} collapsed={hidden} onToggle={toggle} />
        </Suspense>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden bg-slate-100/90 bg-[radial-gradient(900px_circle_at_85%_-10%,rgba(99,102,241,0.10),transparent_55%),radial-gradient(700px_circle_at_-5%_110%,rgba(14,165,233,0.08),transparent_55%)]">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
