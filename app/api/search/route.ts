import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { searchDocuments } from "@/lib/search";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const hits = searchDocuments(q);
  if (hits.length === 0) return NextResponse.json([]);

  const docs = await prisma.document.findMany({
    where: { id: { in: hits.map((h) => h.docId) } },
    include: { category: true, author: true },
  });
  const byId = new Map(docs.map((d) => [d.id, d]));

  const results = hits
    .map((h) => {
      const doc = byId.get(h.docId);
      if (!doc) return null;
      return {
        id: doc.id,
        title: doc.title,
        snippet: h.snippet,
        category: doc.category?.name ?? null,
        updatedAt: doc.updatedAt,
      };
    })
    .filter(Boolean);

  return NextResponse.json(results);
}
