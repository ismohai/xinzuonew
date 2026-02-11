import { useEffect, useState } from "react";
import { ChevronRight, Plus, FileText, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/useEditorStore";

/**
 * 章节导航树 — 复用 Memos 的视觉模式:
 * - MemoExplorer: bg-background border-r, SearchBar, 列表
 * - TagTree: ChevronRight 展开/折叠 + border-l-2 缩进 + text-muted-foreground/text-primary 高亮
 */
interface ChapterExplorerProps {
  embedded?: boolean;
  className?: string;
}

export function ChapterExplorer({ embedded = false, className }: ChapterExplorerProps) {
  const {
    volumes,
    chaptersMap,
    currentChapterId,
    fetchChapters,
    openChapter,
    addVolume,
    addChapter,
  } = useEditorStore();

  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());

  // 默认展开所有分卷
  useEffect(() => {
    if (volumes.length > 0) {
      setExpandedVolumes(new Set(volumes.map((v) => v.id)));
      volumes.forEach((v) => fetchChapters(v.id));
    }
  }, [volumes, fetchChapters]);

  const toggleVolume = (volumeId: string) => {
    setExpandedVolumes((prev) => {
      const next = new Set(prev);
      if (next.has(volumeId)) {
        next.delete(volumeId);
      } else {
        next.add(volumeId);
        fetchChapters(volumeId);
      }
      return next;
    });
  };

  const handleAddVolume = async () => {
    const name = `第${volumes.length + 1}卷`;
    await addVolume(name);
  };

  const handleAddChapter = async (volumeId: string) => {
    const chapters = chaptersMap[volumeId] || [];
    const name = `第${chapters.length + 1}章`;
    await addChapter(volumeId, name);
  };

  return (
    <aside
      className={cn(
        // Memos MemoExplorer 样式: 左侧固定, border-r, bg-background
        "flex flex-col h-full bg-background",
        embedded ? "w-full" : "w-56 shrink-0 border-r border-border",
        className
      )}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">目录</span>
        <button
          onClick={handleAddVolume}
          className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title="新建分卷"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 分卷/章节树 */}
      <nav className="flex-1 overflow-y-auto py-1">
        {volumes.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            暂无分卷，点击 + 创建
          </div>
        ) : (
          volumes.map((volume) => {
            const isExpanded = expandedVolumes.has(volume.id);
            const chapters = chaptersMap[volume.id] || [];

            return (
              <div key={volume.id}>
                {/* 分卷行 — TagTree 展开样式 */}
                <div className="flex items-center group">
                  <button
                    onClick={() => toggleVolume(volume.id)}
                    className="flex items-center gap-1 flex-1 px-3 py-1.5 text-sm text-foreground hover:bg-accent rounded-md mx-1 transition-colors"
                  >
                    <ChevronRight
                      className={cn(
                        "w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0",
                        isExpanded && "rotate-90"
                      )}
                    />
                    <FolderOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{volume.name}</span>
                  </button>
                  <button
                    onClick={() => handleAddChapter(volume.id)}
                    className="p-1 mr-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
                    title="新建章节"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* 章节列表 — TagTree 缩进样式: border-l-2 */}
                {isExpanded && (
                  <div className="ml-5 border-l-2 border-l-border">
                    {chapters.length === 0 ? (
                      <div className="pl-3 py-1 text-xs text-muted-foreground">空</div>
                    ) : (
                      chapters.map((ch) => {
                        const isActive = currentChapterId === ch.id;
                        return (
                          <button
                            key={ch.id}
                            onClick={() => openChapter(ch.id)}
                            className={cn(
                              "flex items-center gap-1.5 w-full pl-3 pr-2 py-1.5 text-sm rounded-r-md transition-colors",
                              isActive
                                ? "text-primary bg-primary/5 font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{ch.name}</span>
                            {ch.word_count > 0 && (
                              <span className="ml-auto text-xs text-muted-foreground shrink-0">
                                {ch.word_count}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>
    </aside>
  );
}
