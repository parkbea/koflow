import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import prisma from "@/lib/prisma";
import { searchDocuments } from "@/lib/search";
import { Card, CardContent } from "@/components/ui/card";
import { Highlight } from "@/components/docs/Highlight";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const hits = q ? searchDocuments(q) : [];

  const docs = hits.length
    ? await prisma.document.findMany({
        where: { id: { in: hits.map((h) => h.docId) } },
        include: { category: true },
      })
    : [];
  const byId = new Map(docs.map((d) => [d.id, d]));
  const results = hits
    .map((h) => ({ hit: h, doc: byId.get(h.docId) }))
    .filter((r) => r.doc);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <SearchIcon className="h-6 w-6" />
          검색
        </h1>
        {q && (
          <p className="text-sm text-muted-foreground">
            “{q}” 검색 결과 {results.length}건
          </p>
        )}
      </div>

      {!q && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            상단 검색창에 키워드를 입력하세요.
            <br />
            <span className="text-xs">
              제목·본문·태그를 SQLite FTS5 전문검색으로 찾습니다.
            </span>
          </CardContent>
        </Card>
      )}

      {q && results.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            검색 결과가 없습니다.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {results.map(({ hit, doc }) => (
          <Link key={hit.docId} href={`/docs/${hit.docId}`}>
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="space-y-1 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{doc!.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {doc!.category?.name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <Highlight text={hit.snippet} />
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(doc!.updatedAt)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
