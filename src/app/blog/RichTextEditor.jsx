"use client";

import { useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({
        placeholder: placeholder || "დაწერეთ ტექსტი...",
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rte-content",
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("ლინკის მისამართი (URL)", previousUrl || "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }, [editor]);

  if (!editor) return null;

  const btn = (active) => "rte-btn" + (active ? " active" : "");

  return (
    <div className="rte-wrap">
      <div className="rte-toolbar">
        <button type="button" title="გასქელება" className={btn(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <b>B</b>
        </button>
        <button type="button" title="დახრილი" className={btn(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <i>I</i>
        </button>

        <span className="rte-sep" />

        <button type="button" title="აბზაცი" className={btn(editor.isActive("paragraph"))}
          onClick={() => editor.chain().focus().setParagraph().run()}>
          ¶
        </button>
        <button type="button" title="სათაური H2" className={btn(editor.isActive("heading", { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </button>
        <button type="button" title="სათაური H3" className={btn(editor.isActive("heading", { level: 3 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </button>

        <span className="rte-sep" />

        <button type="button" title="ბულეტ სია" className={btn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • ᠆᠆
        </button>
        <button type="button" title="ნუმერირებული სია" className={btn(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. ᠆᠆
        </button>

        <span className="rte-sep" />

        <button type="button" title="ლინკის დამატება" className={btn(editor.isActive("link"))}
          onClick={setLink}>
          🔗
        </button>
        <button type="button" title="ლინკის მოცილება" className="rte-btn"
          disabled={!editor.isActive("link")}
          onClick={() => editor.chain().focus().unsetLink().run()}>
          🔗⊘
        </button>

        <span className="rte-sep" />

        <button type="button" title="გაუქმება" className="rte-btn"
          onClick={() => editor.chain().focus().undo().run()}>
          ↺
        </button>
        <button type="button" title="გამეორება" className="rte-btn"
          onClick={() => editor.chain().focus().redo().run()}>
          ↻
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}