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
  ChevronsLeft,
  ChevronsRight,
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

export function Sidebar({
  categories,
  collapsed = false,
  onToggle,
}: {
  categories: CategoryNode[];
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* 브랜드 */}
      <div
        className={cn(
          "flex h-16 items-center",
          collapsed ? "justify-center" : "gap-3 px-4"
        )}
      >
        <div
          className={cn(
            "flex flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_4px_20px_rgba(79,70,229,0.5)] ring-1 ring-inset ring-white/10",
            collapsed ? "h-9 w-9 rounded-xl" : "h-11 w-11"
          )}
          style={{
            background:
              "linear-gradient(135deg,#0f172a 0%,#1e40af 45%,#4f46e5 100%)",
          }}
        >
          <Logo className={collapsed ? "h-6 w-6" : "h-7 w-7"} />
        </div>
        {!collapsed && (
          <>
            <div className="leading-none">
              <Wordmark className="text-2xl leading-none" />
              <p className="mt-1 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-slate-500">
                Korea<span className="text-indigo-400">·</span>Branch
                <span className="text-indigo-400">·</span>Work
              </p>
            </div>
            {onToggle && (
              <ToggleButton collapsed={false} onToggle={onToggle} className="ml-auto" />
            )}
          </>
        )}
      </div>

      {/* 접힘 상태: 로고 아래 펼치기 버튼 */}
      {collapsed && onToggle && (
        <div className="flex justify-center pb-3">
          <ToggleButton collapsed onToggle={onToggle} />
        </div>
      )}

      <nav
        className={cn(
          "flex-1 overflow-y-auto py-2",
          collapsed ? "px-2.5" : "px-3"
        )}
      >
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
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                    collapsed ? "justify-center py-2.5" : "px-3 py-2",
                    active
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-glow"
                      : "text-slate-400 hover:bg-white/5 hover:text-white",
                    !active && !collapsed && "hover:translate-x-0.5"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      !active && "group-hover:scale-110"
                    )}
                  />
                  {!collapsed && item.label}
                  {active && !collapsed && (
                    <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {!collapsed && (
          <div className="mt-6 border-t border-white/5 pt-4">
            <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
              카테고리
            </p>
            <ul className="space-y-0.5">
              {categories.map((cat) => (
                <CategoryItem key={cat.id} node={cat} />
              ))}
            </ul>
          </div>
        )}
      </nav>

      <div
        className={cn(
          "border-t border-slate-800",
          collapsed ? "p-2.5" : "p-3"
        )}
      >
        <Link
          href="/admin/categories"
          title={collapsed ? "관리" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
            collapsed ? "justify-center py-2.5" : "px-3 py-2",
            pathname.startsWith("/admin")
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-glow"
              : "text-slate-400 hover:bg-white/5 hover:text-white",
            !pathname.startsWith("/admin") && !collapsed && "hover:translate-x-0.5"
          )}
        >
          <Settings className="h-4 w-4" />
          {!collapsed && "관리"}
        </Link>
      </div>
    </aside>
  );
}

/** 접기/펼치기 토글 — 원형 고스트 버튼, 호버 시 인디고 글로우 */
function ToggleButton({
  collapsed,
  onToggle,
  className,
}: {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
      aria-label={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
      className={cn(
        "group flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-400 transition-all duration-200",
        "hover:border-indigo-400/50 hover:bg-indigo-500/25 hover:text-white hover:shadow-[0_0_14px_rgba(99,102,241,0.5)]",
        className
      )}
    >
      {collapsed ? (
        <ChevronsRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      ) : (
        <ChevronsLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
      )}
    </button>
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
