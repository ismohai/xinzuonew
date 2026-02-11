import { useCallback, useEffect, useRef } from "react";
import { Save } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEditorStore } from "@/stores/useEditorStore";
import { useSettingStore } from "@/stores/useSettingStore";
import { useStatsStore } from "@/stores/useStatsStore";

/**
 * 编辑器主区域 — 基于 Tiptap 的沉浸式写作编辑器
 */
export function EditorArea() {
  const { currentChapter, currentChapterId, dirty, setDirty, saveChapter, setLiveWordCount } = useEditorStore();
  const { fontSize, fontFamily } = useSettingStore();
  const autoSaveInterval = useSettingStore((s) => s.autoSaveInterval ?? 30);
  const recordWords = useStatsStore((s) => s.recordWords);
  const contentRef = useRef<string>("");
  const dirtyRef = useRef(false);
  const lastSavedLenRef = useRef(0);

  // 同步 dirty 到 ref（供定时器内使用）
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        horizontalRule: false,
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "outline-none min-h-full leading-relaxed",
        spellcheck: "false",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const text = ed.getText();
      contentRef.current = text;
      setLiveWordCount(text.length);
      if (!dirtyRef.current) {
        setDirty(true);
      }
    },
  });

  // 同步章节内容到编辑器
  useEffect(() => {
    if (editor && currentChapter) {
      const newContent = currentChapter.content || "";
      // 避免光标重置：仅内容不同时才设置
      if (editor.getText() !== newContent) {
        editor.commands.setContent(
          newContent
            ? `<p>${newContent.split("\n").join("</p><p>")}</p>`
            : "<p></p>"
        );
        contentRef.current = newContent;
        lastSavedLenRef.current = newContent.length;
        setLiveWordCount(newContent.length);
      }
    }
  }, [editor, currentChapter, setLiveWordCount]);

  const handleSave = useCallback(() => {
    const content = contentRef.current;
    const delta = content.length - lastSavedLenRef.current;
    saveChapter(content);
    lastSavedLenRef.current = content.length;
    // 记录写作统计
    if (delta > 0) {
      const today = new Date().toISOString().slice(0, 10);
      recordWords(today, delta, 0);
    }
  }, [saveChapter, recordWords]);

  // Ctrl+S 保存
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (dirtyRef.current) {
          handleSave();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  // 自动保存定时器
  useEffect(() => {
    if (!currentChapterId || autoSaveInterval <= 0) return;
    const timer = setInterval(() => {
      if (dirtyRef.current) {
        handleSave();
      }
    }, autoSaveInterval * 1000);
    return () => clearInterval(timer);
  }, [currentChapterId, autoSaveInterval, handleSave]);

  if (!currentChapterId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-1">选择一个章节开始写作</p>
          <p className="text-sm">从左侧目录中选择或创建章节</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* 编辑器工具栏 */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border shrink-0">
        <span className="text-sm text-foreground font-medium truncate">
          {currentChapter?.name || "未命名"}
        </span>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-amber-500">未保存</span>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors"
          >
            <Save className="w-3 h-3" />
            保存
          </button>
        </div>
      </div>

      {/* Tiptap 编辑区 */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily,
        }}
      >
        <EditorContent
          editor={editor}
          className="xinzuo-editor h-full px-6 py-4 text-foreground [&_.tiptap]:outline-none [&_.tiptap]:min-h-full [&_.tiptap_p]:mb-2 [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground/50 [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none"
        />
      </div>
    </div>
  );
}
