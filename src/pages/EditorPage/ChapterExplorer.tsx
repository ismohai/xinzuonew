import { useEffect, useState, useRef, useCallback } from "react";
import {
  ChevronRight,
  Plus,
  FileText,
  FolderOpen,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/useEditorStore";
import type { Chapter, Volume } from "@/types";

// ---- Context Menu ----
interface ContextMenuState {
  type: "volume" | "chapter";
  id: string;
  volumeId?: string;
  x: number;
  y: number;
  status?: string;
}

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
    renameVolume,
    renameChapter,
    setChapterStatus,
    removeVolume,
    removeChapter,
  } = useEditorStore();

  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);
  const [renaming, setRenaming] = useState<{ type: "volume" | "chapter"; id: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  // 默认展开所有分卷
  useEffect(() => {
    if (volumes.length > 0) {
      setExpandedVolumes(new Set(volumes.map((v) => v.id)));
      volumes.forEach((v) => fetchChapters(v.id));
    }
  }, [volumes, fetchChapters]);

  // 点击其他地方关闭右键菜单
  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [ctxMenu]);

  // 重命名时自动聚焦
  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renaming]);

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

  // 右键分卷
  const handleVolumeContext = (e: React.MouseEvent, vol: Volume) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ type: "volume", id: vol.id, x: e.clientX, y: e.clientY });
  };

  // 右键章节
  const handleChapterContext = (e: React.MouseEvent, ch: Chapter) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ type: "chapter", id: ch.id, volumeId: ch.volume_id, x: e.clientX, y: e.clientY, status: ch.status });
  };

  // 开始重命名
  const startRename = useCallback((type: "volume" | "chapter", id: string, currentName: string) => {
    setCtxMenu(null);
    setRenaming({ type, id });
    setRenameValue(currentName);
  }, []);

  // 提交重命名
  const commitRename = useCallback(async () => {
    if (!renaming || !renameValue.trim()) {
      setRenaming(null);
      return;
    }
    if (renaming.type === "volume") {
      await renameVolume(renaming.id, renameValue.trim());
    } else {
      await renameChapter(renaming.id, renameValue.trim());
    }
    setRenaming(null);
  }, [renaming, renameValue, renameVolume, renameChapter]);

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-background",
        embedded ? "w-full" : "w-56 shrink-0 border-r border-border",
        className
      )}
    >
      {/* 头部（独立模式显示完整标题，嵌入模式显示精简操作栏） */}
      {!embedded ? (
        <div className="flex items-center justify-between px-3 h-10 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">目录</span>
          <button
            onClick={handleAddVolume}
            className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title="新建分卷"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end px-2 py-1 border-b border-border shrink-0">
          <button
            onClick={handleAddVolume}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            title="新建分卷"
          >
            <Plus className="w-3.5 h-3.5" />
            新建分卷
          </button>
        </div>
      )}

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
            const isRenamingVolume = renaming?.type === "volume" && renaming.id === volume.id;

            return (
              <div key={volume.id}>
                {/* 分卷行 */}
                <div className="flex items-center group">
                  <button
                    onClick={() => toggleVolume(volume.id)}
                    onContextMenu={(e) => handleVolumeContext(e, volume)}
                    className="flex items-center gap-1 flex-1 px-3 py-1.5 text-sm text-foreground hover:bg-accent rounded-md mx-1 transition-colors"
                  >
                    <ChevronRight
                      className={cn(
                        "w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0",
                        isExpanded && "rotate-90"
                      )}
                    />
                    <FolderOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {isRenamingVolume ? (
                      <input
                        ref={renameInputRef}
                        className="flex-1 min-w-0 bg-transparent text-foreground text-sm outline-none border-b border-primary px-0"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setRenaming(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate">{volume.name}</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleAddChapter(volume.id)}
                    className="p-1 mr-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
                    title="新建章节"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* 章节列表 */}
                {isExpanded && (
                  <div className="ml-5 border-l-2 border-l-border">
                    {chapters.length === 0 ? (
                      <div className="pl-3 py-1 text-xs text-muted-foreground">空</div>
                    ) : (
                      chapters.map((ch) => {
                        const isActive = currentChapterId === ch.id;
                        const isRenamingCh = renaming?.type === "chapter" && renaming.id === ch.id;
                        return (
                          <button
                            key={ch.id}
                            onClick={() => openChapter(ch.id)}
                            onContextMenu={(e) => handleChapterContext(e, ch)}
                            className={cn(
                              "flex items-center gap-1.5 w-full pl-3 pr-2 py-1.5 text-sm rounded-r-md transition-colors",
                              isActive
                                ? "text-primary bg-primary/5 font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                          >
                            {ch.status === "complete" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                            )}
                            {isRenamingCh ? (
                              <input
                                ref={renameInputRef}
                                className="flex-1 min-w-0 bg-transparent text-foreground text-sm outline-none border-b border-primary px-0"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={commitRename}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitRename();
                                  if (e.key === "Escape") setRenaming(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span className="truncate">{ch.name}</span>
                            )}
                            {ch.word_count > 0 && !isRenamingCh && (
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

      {/* 右键菜单 */}
      {ctxMenu && (
        <div
          className="fixed z-50 min-w-[140px] rounded-md border border-border bg-popover text-popover-foreground shadow-md p-1 animate-in fade-in-0 zoom-in-95"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {ctxMenu.type === "volume" ? (
            <>
              <CtxItem
                icon={<Pencil className="w-3.5 h-3.5" />}
                label="重命名"
                onClick={() => {
                  const vol = volumes.find((v) => v.id === ctxMenu.id);
                  if (vol) startRename("volume", vol.id, vol.name);
                }}
              />
              <CtxItem
                icon={<Plus className="w-3.5 h-3.5" />}
                label="新建章节"
                onClick={() => {
                  setCtxMenu(null);
                  handleAddChapter(ctxMenu.id);
                }}
              />
              <div className="h-px bg-border my-1 -mx-1" />
              <CtxItem
                icon={<Trash2 className="w-3.5 h-3.5" />}
                label="删除分卷"
                danger
                onClick={() => {
                  setCtxMenu(null);
                  removeVolume(ctxMenu.id);
                }}
              />
            </>
          ) : (
            <>
              <CtxItem
                icon={<Pencil className="w-3.5 h-3.5" />}
                label="重命名"
                onClick={() => {
                  const ch = findChapter(chaptersMap, ctxMenu.id);
                  if (ch) startRename("chapter", ch.id, ch.name);
                }}
              />
              {ctxMenu.status !== "complete" ? (
                <CtxItem
                  icon={<CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                  label="标记完成"
                  onClick={() => {
                    setCtxMenu(null);
                    setChapterStatus(ctxMenu.id, "complete");
                  }}
                />
              ) : (
                <CtxItem
                  icon={<Circle className="w-3.5 h-3.5" />}
                  label="标记草稿"
                  onClick={() => {
                    setCtxMenu(null);
                    setChapterStatus(ctxMenu.id, "draft");
                  }}
                />
              )}
              <div className="h-px bg-border my-1 -mx-1" />
              <CtxItem
                icon={<Trash2 className="w-3.5 h-3.5" />}
                label="删除章节"
                danger
                onClick={() => {
                  setCtxMenu(null);
                  removeChapter(ctxMenu.id);
                }}
              />
            </>
          )}
        </div>
      )}
    </aside>
  );
}

// 小型菜单项
function CtxItem({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm transition-colors",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-popover-foreground hover:bg-accent"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function findChapter(map: Record<string, Chapter[]>, id: string): Chapter | undefined {
  for (const chs of Object.values(map)) {
    const found = chs.find((c) => c.id === id);
    if (found) return found;
  }
}
