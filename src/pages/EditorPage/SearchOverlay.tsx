import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/useEditorStore";
import * as api from "@/api";
import type { SearchHit } from "@/api";

export function SearchOverlay() {
  const storagePath = useEditorStore((s) => s.storagePath);
  const openChapter = useEditorStore((s) => s.openChapter);
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Ctrl+F 打开搜索
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setVisible(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape" && visible) {
        setVisible(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible]);

  // 防抖搜索
  const doSearch = useCallback(
    (q: string) => {
      if (!storagePath || !q.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      api
        .searchChapters(storagePath, q.trim())
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    },
    [storagePath]
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, doSearch]);

  const handleSelect = (hit: SearchHit) => {
    openChapter(hit.chapter_id);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={() => setVisible(false)}
      />
      {/* 搜索面板 */}
      <div className="relative w-full max-w-lg bg-popover border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        {/* 搜索框 */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground/50"
            placeholder="搜索章节内容..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={() => setVisible(false)}
            className="p-1 rounded-md text-muted-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 结果列表 */}
        <div className="max-h-[40vh] overflow-y-auto">
          {searching && (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">搜索中...</div>
          )}
          {!searching && query.trim() && results.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">未找到匹配内容</div>
          )}
          {results.map((hit, i) => (
            <button
              key={`${hit.chapter_id}-${i}`}
              onClick={() => handleSelect(hit)}
              className="w-full flex flex-col gap-0.5 px-4 py-2.5 text-left hover:bg-accent transition-colors border-b border-border last:border-0"
            >
              <span className="text-sm font-medium text-foreground">{hit.chapter_name}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">
                {hit.snippet}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
