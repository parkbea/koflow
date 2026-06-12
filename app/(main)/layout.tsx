import { AppShell } from "@/components/layout/AppShell";
import { getCategoryTree } from "@/lib/categories";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategoryTree();

  return <AppShell categories={categories}>{children}</AppShell>;
}
