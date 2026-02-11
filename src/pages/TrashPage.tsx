import { useEffect, useState } from "react";
import { Trash2, RotateCcw, BookOpen, AlertTriangle } from "lucide-react";
import * as api from "@/api";
import type { DeletedBook } from "@/api";

/**
 * 回收站页面 — 显示所有被软删除的书籍，支持恢复和永久删除
 */
export function TrashPage() {
  const [books, setBooks] = useState<DeletedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.listDeletedBooks();
      setBooks(data);
    } catch (err) {
      console.error("加载回收站失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRestore = async (id: string) => {
    await api.restoreBook(id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const handlePermanentDelete = async (id: string) => {
    await api.permanentlyDeleteBook(id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setConfirmId(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Trash2 className="w-12 h-12 opacity-30" />
        <p className="text-lg">回收站是空的</p>
        <p className="text-sm">删除的书籍会出现在这里</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {books.map((book) => (
          <div
            key={book.id}
            className="relative group flex flex-col justify-start items-start bg-card w-full px-4 py-4 gap-3 text-card-foreground rounded-lg border border-border transition-colors"
          >
            {/* 封面占位 */}
            <div className="flex items-center justify-center w-full h-28 rounded-md bg-muted opacity-60">
              {book.cover_path ? (
                <img
                  src={book.cover_path}
                  alt={book.name}
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <BookOpen className="w-10 h-10 text-muted-foreground/40" />
              )}
            </div>

            {/* 书名 & 作者 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{book.name}</p>
              <p className="text-xs text-muted-foreground truncate">{book.author_name}</p>
            </div>

            {/* 删除时间 */}
            <p className="text-xs text-muted-foreground">
              删除于 {new Date(book.deleted_at).toLocaleDateString("zh-CN")}
            </p>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => handleRestore(book.id)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md border border-border text-foreground hover:bg-accent transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                恢复
              </button>
              {confirmId === book.id ? (
                <button
                  onClick={() => handlePermanentDelete(book.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  确认删除
                </button>
              ) : (
                <button
                  onClick={() => setConfirmId(book.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  永久删除
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
