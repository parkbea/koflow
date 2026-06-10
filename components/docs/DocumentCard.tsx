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
    <Link href={`/docs/${doc.id}`}>
      <Card className="h-full transition-colors hover:bg-accent">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 font-medium">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="line-clamp-1">{doc.title}</span>
            </div>
            {doc.status === "draft" && (
              <Badge variant="secondary" className="shrink-0">
                초안
              </Badge>
            )}
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
