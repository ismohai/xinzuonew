import { X } from "lucide-react";
import { useEditorStore } from "@/stores/useEditorStore";
import { cn } from "@/lib/utils";

/**
 * 编辑器多标签栏
 */
export function TabBar() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const switchTab = useEditorStore((s) => s.switchTab);
  const closeTab = useEditorStore((s) => s.closeTab);

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 px-1 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => {
        const isActive = tab.chapterId === activeTabId;
        return (
          <div
            key={tab.chapterId}
            className={cn(
              "group flex items-center gap-1 px-3 py-1 rounded-md text-xs cursor-pointer transition-colors select-none max-w-[180px] shrink-0",
              isActive
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
            onClick={() => switchTab(tab.chapterId)}
          >
            <span className="truncate">
              {tab.chapterName}
            </span>
            {tab.dirty && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.chapterId);
              }}
              className={cn(
                "p-0.5 rounded-sm shrink-0 transition-colors",
                isActive
                  ? "opacity-60 hover:opacity-100 hover:bg-muted"
                  : "opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-muted"
              )}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
