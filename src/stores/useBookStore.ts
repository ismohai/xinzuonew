import { create } from "zustand";
import type { Book } from "@/types";
import * as api from "@/api";

interface BookState {
  books: Book[];
  loading: boolean;
  currentBookId: string | null;
  searchQuery: string;
  showCreateDialog: boolean;

  fetchBooks: () => Promise<void>;
  addBook: (name: string, authorName: string) => Promise<Book>;
  removeBook: (id: string) => Promise<void>;
  updateBook: (id: string, opts: { name?: string; authorName?: string; coverPath?: string }) => Promise<void>;
  setCurrentBook: (id: string | null) => void;
  getCurrentBook: () => Book | undefined;
  setSearchQuery: (q: string) => void;
  setShowCreateDialog: (show: boolean) => void;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  loading: false,
  currentBookId: null,
  searchQuery: "",
  showCreateDialog: false,

  fetchBooks: async () => {
    set({ loading: true });
    try {
      const books = await api.listBooks();
      set({ books });
    } finally {
      set({ loading: false });
    }
  },

  addBook: async (name, authorName) => {
    const book = await api.createBook(name, authorName);
    set((s) => ({ books: [...s.books, book] }));
    return book;
  },

  removeBook: async (id) => {
    await api.deleteBook(id);
    set((s) => ({
      books: s.books.filter((b) => b.id !== id),
      currentBookId: s.currentBookId === id ? null : s.currentBookId,
    }));
  },

  updateBook: async (id, opts) => {
    await api.updateBook(id, opts);
    set((s) => ({
      books: s.books.map((b) => (b.id === id ? { ...b, ...opts } : b)),
    }));
  },

  setCurrentBook: (id) => set({ currentBookId: id }),

  getCurrentBook: () => {
    const { books, currentBookId } = get();
    return books.find((b) => b.id === currentBookId);
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setShowCreateDialog: (show) => set({ showCreateDialog: show }),
}));
