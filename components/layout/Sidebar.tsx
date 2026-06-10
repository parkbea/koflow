"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  KanbanSquare,
  Search,
  Settings,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo, Wordmark } from "@/components/layout/Logo";
import type { CategoryNode } from "@/lib/categories";

const NAV = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/projects", label: "업무 보드", icon: KanbanSquare },
  { href: "/docs", label: "문서", icon: FileText },
  { href: "/search", label: "검색", icon: Search },
];

export function Sidebar({ categories }: { categories: CategoryNode[] }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300">
      {/* 브랜드 */}
      <div className="flex h-16 items-center gap-3 px-4">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_4px_20px_rgba(79,70,229,0.5)] ring-1 ring-inset ring-white/10"
          style={{
            background:
              "linear-gradient(135deg,#0f172a 0%,#1e40af 45%,#4f46e5 100%)",
          }}
        >
          <Logo className="h-7 w-7" />
        </div>
        <div className="leading-none">
          <Wordmark className="text-2xl leading-none" />
          <p className="mt-1 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-slate-500">
            Korea<span className="text-indigo-400">·</span>Branch
            <span className="text-indigo-400">·</span>Work
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-indigo-600 text-white shadow-[0_2px_12px_rgba(99,102,241,0.4)]"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6">
          <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-600">
            카테고리
          </p>
          <ul className="space-y-0.5">
            {categories.map((cat) => (
              <CategoryItem key={cat.id} node={cat} />
            ))}
          </ul>
        </div>
      </nav>

      <div className="border-t border-slate-800 p-3">
        <Link
          href="/admin/categories"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
            pathname.startsWith("/admin")
              ? "bg-indigo-600 text-white shadow-[0_2px_12px_rgba(99,102,241,0.4)]"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          )}
        >
          <Settings className="h-4 w-4" />
          관리
        </Link>
      </div>
    </aside>
  );
}

function CategoryItem({ node }: { node: CategoryNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeCat = searchParams.get("category");
  const isActive = pathname === "/docs" && activeCat === node.id;
  const hasChildren = node.children.length > 0;
  const [open, setOpen] = useState(true);

  return (
    <li>
      <div className="flex items-center">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="p-1 text-slate-500 hover:text-slate-200"
            aria-label="toggle"
          >
            {open ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Link
          href={`/docs?category=${node.id}`}
          className={cn(
            "flex flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors",
            isActive
              ? "bg-white/10 font-medium text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          )}
        >
          {hasChildren ? (
            open ? (
              <FolderOpen className="h-4 w-4 text-amber-400" />
            ) : (
              <Folder className="h-4 w-4 text-amber-400" />
            )
          ) : (
            <FileText className="h-3.5 w-3.5 text-slate-500" />
          )}
          <span className="flex-1 truncate">{node.name}</span>
          {node.docCount > 0 && (
            <span className="text-xs text-slate-600">{node.docCount}</span>
          )}
        </Link>
      </div>
      {hasChildren && open && (
        <ul className="ml-4 space-y-0.5 border-l border-slate-800 pl-2">
          {node.children.map((child) => (
            <CategoryItem key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
