import prisma from "@/lib/prisma";
import { CategoryManager, type CatItem } from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { documents: true } } },
  });

  const items: CatItem[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId,
    order: c.order,
    docCount: c._count.documents,
  }));

  return <CategoryManager initial={items} />;
}
