"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import {
  Bold, Italic, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotesEditorProps {
  initialContent: string;
  onChange: (html: string) => void;
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        isActive
          ? "bg-brand-purple-light text-brand-purple"
          : "text-text-muted hover:text-text-primary hover:bg-slate-100"
      )}
    >
      {children}
    </button>
  );
}

export function NotesEditor({ initialContent, onChange }: NotesEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({
        placeholder: "Start taking notes…",
      }),
      Typography,
    ],
    content: initialContent || "",
    editorProps: {
      attributes: { class: "min-h-full focus:outline-none" },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? "" : editor.getHTML());
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Compact toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-slate-100 flex-shrink-0 flex-wrap">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Bold (⌘B)">
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Italic (⌘I)">
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} title="Heading">
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} title="Subheading">
          <Heading3 className="w-3.5 h-3.5" />
        </ToolbarButton>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="Bullet list">
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="Numbered list">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title="Quote">
          <Quote className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive("code")} title="Inline code">
          <Code className="w-3.5 h-3.5" />
        </ToolbarButton>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="w-3.5 h-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto tiptap-notes px-5 py-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
