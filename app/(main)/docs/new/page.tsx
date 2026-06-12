import { DocumentForm } from "@/components/docs/DocumentForm";
import { getCategoryOptions } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const metadata = { title: "새 문서 · koFlow" };

export default async function NewDocPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const categoryOptions = await getCategoryOptions();

  return (
    <div className="space-y-5">
      <h1 className="mx-auto max-w-4xl text-2xl font-bold">새 문서 작성</h1>
      <DocumentForm
        categoryOptions={categoryOptions}
        initial={
          searchParams.category
            ? {
                title: "",
                content: "",
                categoryId: searchParams.category,
                tags: [],
              }
            : undefined
        }
      />
    </div>
  );
}
