"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, List, ListOrdered, Quote, Minus, Undo2, Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  content: JSONContent | null;
  onChange: (json: JSONContent, html: string) => void;
  placeholder?: string;
}

/**
 * RichTextEditor — Tiptap-baserad WYSIWYG för krönikörer. H1–H3, fetstil,
 * kursiv, listor, citat, avdelare — det en skribent behöver för en artikel,
 * inget mer (ingen bildhantering/embed i v1, se ponytail-kommentar nedan).
 */
export function RichTextEditor({ content, onChange, placeholder }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Börja skriva din krönika…",
      }),
    ],
    content: content ?? "",
    editorProps: {
      attributes: {
        // ponytail: native browser spellcheck (gratis, ingen latens) istället för
        // en LLM-baserad korrekturläsare — värdet av att fånga stavfel inline
        // motiverar inte kostnaden/komplexiteten för en liten inbjuden grupp.
        spellcheck: "true",
        autocorrect: "on",
        autocapitalize: "sentences",
        class: [
          "min-h-[50vh] max-w-none text-[15px] leading-relaxed text-foreground focus:outline-none",
          "[&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight",
          "[&_h2]:mt-5 [&_h2]:mb-2.5 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-tight",
          "[&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold",
          "[&_p]:my-3 [&_p.is-editor-empty:first-child]:before:text-muted-foreground",
          "[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:pointer-events-none",
          "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1",
          "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-pitch [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
          "[&_hr]:my-6 [&_hr]:border-border",
        ].join(" "),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON(), editor.getHTML()),
  });

  if (!editor) {
    return <div className="min-h-[50vh] rounded-xl skeleton-wave bg-muted/40" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  const items: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }[] = [
    { icon: Undo2, label: "Ångra", active: false, onClick: () => editor.chain().focus().undo().run() },
    { icon: Redo2, label: "Gör om", active: false, onClick: () => editor.chain().focus().redo().run() },
  ];

  const headingBtn = (level: 1 | 2 | 3) => ({
    label: `H${level}`,
    active: editor.isActive("heading", { level }),
    onClick: () => editor.chain().focus().toggleHeading({ level }).run(),
  });

  return (
    <div className="sticky top-16 z-10 flex flex-wrap items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950/95 px-2 py-1.5 backdrop-blur">
      {[1, 2, 3].map((level) => {
        const b = headingBtn(level as 1 | 2 | 3);
        return (
          <ToolbarButton key={b.label} label={b.label} active={b.active} onClick={b.onClick}>
            {b.label}
          </ToolbarButton>
        );
      })}
      <Divider />
      <ToolbarButton label="Fetstil" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Kursiv" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton label="Punktlista" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Numrerad lista" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Citat" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Avdelare" active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="h-4 w-4" />
      </ToolbarButton>
      <Divider />
      {items.map((it) => (
        <ToolbarButton key={it.label} label={it.label} active={it.active} onClick={it.onClick}>
          <it.icon className="h-4 w-4" />
        </ToolbarButton>
      ))}
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-zinc-800" aria-hidden />;
}

function ToolbarButton({
  children, label, active, onClick,
}: { children: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors",
        active ? "bg-pitch/20 text-pitch" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      )}
    >
      {children}
    </button>
  );
}
