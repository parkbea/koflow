import Link from "next/link";
import { Plus } from "lucide-react";
import prisma from "@/lib/prisma";
import { DocumentCard } from "@/components/docs/DocumentCard";
import { buttonVariants } from "@/components/ui/button";
import { getCategoryTree } from "@/lib/categories";

export const dynamic = "force-dynamic";

type SearchParams = { category?: string };

/** 선택된 카테고리 + 모든 하위 카테고리 id 목록 */
function collectCategoryIds(
  tree: Awaited<ReturnType<typeof getCategoryTree>>,
  targetId: string
): string[] {
  const result: string[] = [];
  const find = (nodes: typeof tree): boolean => {
    for (const n of nodes) {
      if (n.id === targetId) {
        const gather = (node: typeof n) => {
          result.push(node.id);
          node.children.forEach(gather);
        };
        gather(n);
        return true;
      }
      if (find(n.children)) return true;
    }
    return false;
  };
  find(tree);
  return result;
}

export default async function DocsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category } = searchParams;

  const tree = await getCategoryTree();
  let categoryName: string | null = null;
  let categoryIds: string[] | undefined;
  if (category) {
    categoryIds = collectCategoryIds(tree, category);
    const flat = (nodes: typeof tree): typeof tree =>
      nodes.flatMap((n) => [n, ...flat(n.children)]);
    categoryName = flat(tree).find((c) => c.id === category)?.name ?? null;
  }

  const documents = await prisma.document.findMany({
    where: categoryIds ? { categoryId: { in: categoryIds } } : {},
    orderBy: { updatedAt: "desc" },
    include: { category: true, author: true },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {categoryName ?? "전체 문서"}
          </h1>
          <p className="text-sm text-muted-foreground">
            총 <span className="font-semibold text-foreground">{documents.length}</span>건
          </p>
        </div>
        <Link href="/docs/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />새 문서
        </Link>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 py-16 text-center text-muted-foreground">
          <p>문서가 없습니다.</p>
          <Link
            href="/docs/new"
            className="mt-2 inline-block text-primary hover:underline"
          >
            첫 문서를 작성해보세요
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
