import { AdminTabs } from "@/components/admin/AdminTabs";

export const metadata = { title: "관리 · koFlow" };

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">관리</h1>
        <p className="text-sm text-muted-foreground">
          카테고리와 팀원을 관리합니다.
        </p>
      </div>
      <AdminTabs />
      {children}
    </div>
  );
}
