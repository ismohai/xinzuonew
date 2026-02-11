import { Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { MouseEvent } from "react";
import * as api from "@/api";

export function Titlebar() {
  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-no-drag]")) return;
    void getCurrentWindow().startDragging();
  };
  return (
    <div
      data-tauri-drag-region
      onMouseDown={handleMouseDown}
      className="flex items-center justify-between h-8 bg-background border-b border-border select-none shrink-0"
    >
      {/* 左侧应用标题 — 可拖拽区域 */}
      <div data-tauri-drag-region className="flex items-center gap-2 px-3 flex-1">
        <span className="text-xs text-muted-foreground font-medium pointer-events-none">心作 · XinZuo</span>
      </div>

      {/* 右侧窗口控制按钮 */}
      <div className="flex items-center" data-no-drag>
        <button
          onClick={() => api.minimizeWindow()}
          className="flex items-center justify-center w-10 h-8 hover:bg-accent transition-colors"
          title="最小化"
        >
          <Minus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={() => api.toggleMaximizeWindow()}
          className="flex items-center justify-center w-10 h-8 hover:bg-accent transition-colors"
          title="最大化"
        >
          <Square className="w-3 h-3 text-muted-foreground" />
        </button>
        <button
          onClick={() => api.closeWindow()}
          className="flex items-center justify-center w-10 h-8 hover:bg-destructive hover:text-destructive-foreground transition-colors"
          title="关闭"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
