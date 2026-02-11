import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useBookStore } from "@/stores/useBookStore";
import { useEditorStore } from "@/stores/useEditorStore";
import { useSettingStore } from "@/stores/useSettingStore";
import { EditorArea } from "./EditorArea";
import { StatusBar } from "./StatusBar";

/**
 * 编辑器页面 — 中央编辑区
 * 左侧章节树与右侧 AI 面板由外层布局控制
 */
interface EditorPageProps {
  bookId: string;
}

export function EditorPage({ bookId }: EditorPageProps) {
  const { books, fetchBooks, loading } = useBookStore();
  const { setStoragePath, fetchVolumes, reset } = useEditorStore();
  const currentChapter = useEditorStore((s) => s.currentChapter);
  const setEditingBookId = useSettingStore((s) => s.setEditingBookId);

  const book = books.find((b) => b.id === bookId);

  useEffect(() => {
    if (books.length === 0) {
      fetchBooks();
    }
  }, [books.length, fetchBooks]);

  useEffect(() => {
    if (book) {
      setStoragePath(book.storage_path);
      fetchVolumes();
    }
    return () => {
      reset();
    };
  }, [book, setStoragePath, fetchVolumes, reset]);

  if (!book) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        {loading ? (
          <div className="text-center">
            <p className="text-lg mb-2">加载中...</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg mb-2">书籍未找到</p>
            <button
              onClick={() => setEditingBookId(null)}
              className="text-sm text-primary hover:underline"
            >
              返回书架
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 顶部标签栏 */}
      <div className="flex items-center gap-2 px-3 h-14 border-b border-border shrink-0">
        <button
          onClick={() => setEditingBookId(null)}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title="返回书架"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-muted-foreground truncate">{book.name}</span>
          <div className="px-3 py-1 rounded-md bg-accent text-xs text-foreground truncate max-w-[240px]">
            {currentChapter ? currentChapter.name : "暂无打开的章节"}
          </div>
        </div>
      </div>

      {/* 编辑主体 */}
      <div className="flex flex-1 overflow-hidden">
        <EditorArea />
      </div>

      {/* 底部状态栏 */}
      <StatusBar />
    </div>
  );
}
