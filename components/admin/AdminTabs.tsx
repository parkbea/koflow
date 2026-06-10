"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderTree, Users, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/categories", label: "카테고리", icon: FolderTree },
  { href: "/admin/users", label: "팀원", icon: Users },
  { href: "/admin/integrations", label: "연동", icon: Plug },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 border-b">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2 text-sm transition-colors",
              active
                ? "border-primary font-medium text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
