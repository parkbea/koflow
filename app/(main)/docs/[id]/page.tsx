import { notFound } from "next/navigation";
import Link from "next/link";
import { FolderTree, User, Clock } from "lucide-react";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentViewer } from "@/components/docs/DocumentViewer";
import { DocActions } from "@/components/docs/DocActions";
import { VersionHistory } from "@/components/docs/VersionHistory";
import { formatDate, parseTags } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DocDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    include: {
      author: true,
      category: true,
      histories: { orderBy: { version: "desc" } },
    },
  });
  if (!doc) notFound();

  const tags = parseTags(doc.tags);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {doc.status === "draft" ? (
                <Badge variant="secondary">초안</Badge>
              ) : (
                <Badge>발행됨</Badge>
              )}
              {doc.visibility === "private" && (
                <Badge variant="outline">비공개</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold">{doc.title}</h1>
          </div>
          <DocActions id={doc.id} />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {doc.category && (
            <Link
              href={`/docs?category=${doc.categoryId}`}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <FolderTree className="h-4 w-4" />
              {doc.category.name}
            </Link>
          )}
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {doc.author?.name ?? "팀"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDate(doc.updatedAt)}
          </span>
          <span>v{doc.version}</span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <Badge key={t} variant="outline">
                #{t}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <DocumentViewer content={doc.content} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">버전 이력</CardTitle>
        </CardHeader>
        <CardContent>
          <VersionHistory
            currentVersion={doc.version}
            histories={doc.histories.map((h) => ({
              id: h.id,
              version: h.version,
              title: h.title,
              content: h.content,
              createdAt: h.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
