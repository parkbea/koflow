"use client";

import { useRef, useCallback } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code2,
  ImagePlus,
  Undo2,
  Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const lowlight = createLowlight(common);

export function TiptapEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (json: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false, // Next.js SSR 하이드레이션 안정화
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: false }),
    ],
    content: safeParse(content),
    editorProps: {
      attributes: {
        class:
          "tiptap-content min-h-[400px] rounded-b-md border border-t-0 bg-background px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
  });

  const handleImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "업로드 실패" }));
        alert(error ?? "업로드 실패");
        return;
      }
      const { url } = await res.json();
      editor.chain().focus().setImage({ src: url }).run();
    },
    [editor]
  );

  if (!editor) {
    return (
      <div className="min-h-[460px] animate-pulse rounded-md border bg-muted/30" />
    );
  }

  return (
    <div>
      <Toolbar
        editor={editor}
        onPickImage={() => fileInputRef.current?.click()}
      />
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImage(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function safeParse(content: string) {
  if (!content) return undefined;
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

function Toolbar({
  editor,
  onPickImage,
}: {
  editor: Editor;
  onPickImage: () => void;
}) {
  const Btn = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-accent",
        active && "bg-accent text-primary"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border bg-muted/40 p-1">
      <Btn
        title="굵게"
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
      >
        <Bold className="h-4 w-4" />
      </Btn>
      <Btn
        title="기울임"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
      >
        <Italic className="h-4 w-4" />
      </Btn>
      <Btn
        title="취소선"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
      >
        <Strikethrough className="h-4 w-4" />
      </Btn>
      <Divider />
      <Btn
        title="제목 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
      >
        <Heading1 className="h-4 w-4" />
      </Btn>
      <Btn
        title="제목 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
      >
        <Heading2 className="h-4 w-4" />
      </Btn>
      <Divider />
      <Btn
        title="글머리 목록"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
      >
        <List className="h-4 w-4" />
      </Btn>
      <Btn
        title="번호 목록"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
      >
        <ListOrdered className="h-4 w-4" />
      </Btn>
      <Btn
        title="인용"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
      >
        <Quote className="h-4 w-4" />
      </Btn>
      <Btn
        title="코드 블록"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
      >
        <Code2 className="h-4 w-4" />
      </Btn>
      <Divider />
      <Btn title="이미지 업로드" onClick={onPickImage}>
        <ImagePlus className="h-4 w-4" />
      </Btn>
      <Divider />
      <Btn title="실행 취소" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="h-4 w-4" />
      </Btn>
      <Btn title="다시 실행" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="h-4 w-4" />
      </Btn>
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}
