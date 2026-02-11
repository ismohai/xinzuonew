import { BookOpen, MoreHorizontal, Trash2, Pencil, Upload, Download } from "lucide-react";
import { open, save } from "@tauri-apps/plugin-dialog";
import type { Book } from "@/types";
import { useBookStore } from "@/stores/useBookStore";
import { useSettingStore } from "@/stores/useSettingStore";
import * as api from "@/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BOOK_CARD_CLASSES =
  "relative group flex flex-col justify-start items-start bg-card w-full px-4 py-4 gap-3 text-card-foreground rounded-lg border border-border transition-colors hover:border-primary/40 hover:shadow-sm cursor-pointer";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const removeBook = useBookStore((s) => s.removeBook);
  const fetchBooks = useBookStore((s) => s.fetchBooks);
  const setEditingBookId = useSettingStore((s) => s.setEditingBookId);

  const handleOpen = () => {
    setEditingBookId(book.id);
  };

  const handleExport = async () => {
    const path = await save({ filters: [{ name: "Text", extensions: ["txt"] }], defaultPath: `${book.name}.txt` });
    if (!path) return;
    await api.exportTxt(book.storage_path, path);
  };

  const handleImport = async () => {
    const path = await open({ filters: [{ name: "Text", extensions: ["txt"] }] });
    if (!path) return;
    await api.importTxt(book.storage_path, path as string, "导入分卷");
    await fetchBooks();
  };

  return (
    <div className={BOOK_CARD_CLASSES} onClick={handleOpen}>
      {/* 封面占位 */}
      <div className="flex items-center justify-center w-full h-28 rounded-md bg-muted">
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

      {/* 更多操作 */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-md hover:bg-accent transition-colors">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleOpen}>
              <Pencil className="mr-2 h-4 w-4" />
              打开
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleImport}>
              <Upload className="mr-2 h-4 w-4" />
              导入 TXT
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              导出 TXT
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => removeBook(book.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 创建时间 */}
      <p className="text-xs text-muted-foreground">
        {new Date(book.created_at).toLocaleDateString("zh-CN")}
      </p>
    </div>
  );
}
