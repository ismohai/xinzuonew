import { useEffect } from "react";
import { useBookStore } from "@/stores/useBookStore";
import { BookCard } from "./BookCard";
import { CreateBookDialog } from "./CreateBookDialog";

export function ContentManagement() {
  const { books, loading, fetchBooks } = useBookStore();
  const searchQuery = useBookStore((s) => s.searchQuery);
  const showCreate = useBookStore((s) => s.showCreateDialog);
  const setShowCreate = useBookStore((s) => s.setShowCreateDialog);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const filtered = searchQuery
    ? books.filter(
        (b) =>
          b.name.includes(searchQuery) || b.author_name.includes(searchQuery)
      )
    : books;

  return (
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
      <CreateBookDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
