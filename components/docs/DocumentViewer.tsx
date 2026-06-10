"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

const lowlight = createLowlight(common);

/** 읽기 전용 Tiptap 렌더러 (코드 하이라이팅 포함) */
export function DocumentViewer({ content }: { content: string }) {
  const editor = useEditor({
    editable: false,
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: false }),
    ],
    content: safeParse(content),
    editorProps: {
      attributes: { class: "tiptap-content focus:outline-none" },
    },
  });

  if (!editor) {
    return <div className="h-24 animate-pulse rounded bg-muted/30" />;
  }
  return <EditorContent editor={editor} />;
}

function safeParse(content: string) {
  if (!content) return undefined;
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}
