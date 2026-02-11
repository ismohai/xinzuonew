import { Search, Plus } from "lucide-react";
import { useBookStore } from "@/stores/useBookStore";
import type { PageType } from "@/types";

const SIMPLE_TITLES: Partial<Record<PageType, string>> = {
  stats: "写作统计",
  tasks: "任务中心",
  themes: "主题设置",
  trash: "回收站",
};

export function PageHeader({ page }: { page: PageType }) {
  if (page === "content") return <ContentHeader />;
  if (page === "inspiration") return <InspirationHeader />;

  return (
    <div className="flex items-center px-6 h-full">
      <h1 className="text-lg font-semibold text-foreground">
        {SIMPLE_TITLES[page]}
      </h1>
    </div>
  );
}

function ContentHeader() {
  const searchQuery = useBookStore((s) => s.searchQuery);
  const setSearchQuery = useBookStore((s) => s.setSearchQuery);
  const setShowCreateDialog = useBookStore((s) => s.setShowCreateDialog);

  return (
    <div className="flex items-center justify-between px-6 h-full">
      <h1 className="text-lg font-semibold text-foreground">内容管理</h1>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索书籍..."
            className="bg-sidebar border border-border text-sm rounded-lg p-1.5 pl-8 w-56 outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建书籍
        </button>
      </div>
    </div>
  );
}

function InspirationHeader() {
  return (
    <div className="flex items-center justify-between px-6 h-full">
      <h1 className="text-lg font-semibold text-foreground">灵感中心</h1>
      <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
        <Plus className="w-4 h-4" />
        记录灵感
      </button>
    </div>
  );
}
