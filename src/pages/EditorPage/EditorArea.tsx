import { useCallback, useEffect, useRef } from "react";
import { Save } from "lucide-react";
import { useEditorStore } from "@/stores/useEditorStore";
import { useSettingStore } from "@/stores/useSettingStore";

/**
 * 编辑器主区域 — MVP 阶段使用 textarea
 * 后续版本替换为 Tiptap 富文本编辑器
 */
export function EditorArea() {
  const { currentChapter, currentChapterId, dirty, setDirty, saveChapter } = useEditorStore();
  const { fontSize, fontFamily } = useSettingStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ctrl+S 保存
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (textareaRef.current && dirty) {
          saveChapter(textareaRef.current.value);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dirty, saveChapter]);

  // 同步内容到 textarea
  useEffect(() => {
    if (textareaRef.current && currentChapter) {
      textareaRef.current.value = currentChapter.content || "";
    }
  }, [currentChapter]);

  const handleChange = useCallback(() => {
    if (!dirty) setDirty(true);
  }, [dirty, setDirty]);

  const handleSave = useCallback(() => {
    if (textareaRef.current) {
      saveChapter(textareaRef.current.value);
    }
  }, [saveChapter]);

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

      {/* 编辑区 */}
      <textarea
        ref={textareaRef}
        onChange={handleChange}
        placeholder="开始书写..."
        className="flex-1 w-full p-6 bg-background text-foreground resize-none outline-none placeholder:text-muted-foreground/50 leading-relaxed"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily,
        }}
        spellCheck={false}
      />
    </div>
  );
}
