import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, parseTags } from "@/lib/utils";
import { extractText } from "@/lib/tiptap";

export type DocCardData = {
  id: string;
  title: string;
  content: string;
  status: string;
  tags: string;
  updatedAt: Date | string;
  category?: { name: string } | null;
  author?: { name: string } | null;
};

export function DocumentCard({ doc }: { doc: DocCardData }) {
  const preview = extractText(doc.content).slice(0, 140);
  const tags = parseTags(doc.tags);

  return (
    <Link href={`/docs/${doc.id}`} className="group block h-full">
      <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-indigo-200 group-hover:shadow-lift">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 font-semibold">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 transition-colors group-hover:bg-indigo-100">
                <FileText className="h-4 w-4" />
              </span>
              <span className="line-clamp-1">{doc.title}</span>
            </div>
          </div>

          {preview && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {preview}
            </p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 4).map((t) => (
                <Badge key={t} variant="outline" className="text-xs">
                  #{t}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {doc.category && <span>{doc.category.name}</span>}
            {doc.category && <span>·</span>}
            <span>{doc.author?.name ?? "팀"}</span>
            <span>·</span>
            <span>{formatDate(doc.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
