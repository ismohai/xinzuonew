import { Minus, Square, Copy, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState, useEffect, type MouseEvent } from "react";

const appWindow = getCurrentWindow();

export function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    appWindow.isMaximized().then(setIsMaximized);
    const unlisten = appWindow.onResized(async () => {
      setIsMaximized(await appWindow.isMaximized());
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-no-drag]")) return;
    appWindow.startDragging();
  };

  const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-no-drag]")) return;
    appWindow.toggleMaximize();
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className="flex items-center justify-between h-8 bg-background border-b border-border select-none shrink-0"
    >
      {/* 左侧应用标题 — 可拖拽区域 */}
      <div className="flex items-center gap-2 px-3 flex-1">
        <span className="text-xs text-muted-foreground font-medium pointer-events-none">心作 · XinZuo</span>
      </div>

      {/* 右侧窗口控制按钮 */}
      <div className="flex items-center" data-no-drag>
        <button
          onClick={() => appWindow.minimize()}
          className="flex items-center justify-center w-10 h-8 hover:bg-accent transition-colors"
          title="最小化"
        >
          <Minus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="flex items-center justify-center w-10 h-8 hover:bg-accent transition-colors"
          title={isMaximized ? "还原" : "最大化"}
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 text-muted-foreground" />
          ) : (
            <Square className="w-3 h-3 text-muted-foreground" />
          )}
        </button>
        <button
          onClick={() => appWindow.close()}
          className="flex items-center justify-center w-10 h-8 text-muted-foreground hover:bg-red-600 hover:text-white transition-colors"
          title="关闭"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
