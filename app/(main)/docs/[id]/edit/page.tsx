import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { DocumentForm } from "@/components/docs/DocumentForm";
import { getCategoryOptions } from "@/lib/categories";
import { parseTags } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "문서 수정 · koFlow" };

export default async function EditDocPage({
  params,
}: {
  params: { id: string };
}) {
  const [doc, categoryOptions] = await Promise.all([
    prisma.document.findUnique({ where: { id: params.id } }),
    getCategoryOptions(),
  ]);
  if (!doc) notFound();

  return (
    <div className="space-y-5">
      <h1 className="mx-auto max-w-4xl text-2xl font-bold">문서 수정</h1>
      <DocumentForm
        categoryOptions={categoryOptions}
        initial={{
          id: doc.id,
          title: doc.title,
          content: doc.content,
          categoryId: doc.categoryId,
          tags: parseTags(doc.tags),
          status: doc.status,
        }}
      />
    </div>
  );
}
