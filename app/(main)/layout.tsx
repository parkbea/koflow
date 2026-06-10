import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { getCategoryTree } from "@/lib/categories";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategoryTree();

  return (
    <div className="flex h-screen overflow-hidden">
      <Suspense>
        <Sidebar categories={categories} />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/40">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
