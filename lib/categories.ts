import prisma from "./prisma";

export type CategoryNode = {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  docCount: number;
  children: CategoryNode[];
};

/** 전체 카테고리를 트리 구조로 반환 (문서 수 포함) */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { documents: true } } },
  });

  const map = new Map<string, CategoryNode>();
  categories.forEach((c) => {
    map.set(c.id, {
      id: c.id,
      name: c.name,
      parentId: c.parentId,
      order: c.order,
      docCount: c._count.documents,
      children: [],
    });
  });

  const roots: CategoryNode[] = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/** 플랫 목록 (select 등에서 사용, "상위 > 하위" 라벨) */
export async function getCategoryOptions() {
  const tree = await getCategoryTree();
  const options: { id: string; label: string }[] = [];
  for (const top of tree) {
    options.push({ id: top.id, label: top.name });
    for (const child of top.children) {
      options.push({ id: child.id, label: `${top.name} > ${child.name}` });
    }
  }
  return options;
}
