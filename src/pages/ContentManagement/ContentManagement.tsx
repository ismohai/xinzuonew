import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useBookStore } from "@/stores/useBookStore";
import { BookCard } from "./BookCard";
import { CreateBookDialog } from "./CreateBookDialog";

export function ContentManagement() {
  const { books, loading, fetchBooks } = useBookStore();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const filtered = search
    ? books.filter(
        (b) =>
          b.name.includes(search) || b.author_name.includes(search)
      )
    : books;

  return (
    <div className="flex flex-col h-full">
      {/* 页面头部 — Memos SearchBar 风格 */}
      <header className="flex items-center justify-between px-6 h-14 shrink-0 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">内容管理</h1>
        <div className="flex items-center gap-3">
          {/* 搜索框 — 复用 Memos SearchBar 样式 */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索书籍..."
              className="bg-sidebar border border-border text-sm rounded-lg p-1.5 pl-8 w-56 outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
          {/* 新建按钮 */}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建书籍
          </button>
        </div>
      </header>

      {/* 书籍网格 */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center text-muted-foreground py-12">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-lg mb-2">还没有书籍</p>
            <p className="text-sm">点击「新建书籍」开始你的创作之旅</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>

      {/* 创建对话框 */}
      <CreateBookDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
