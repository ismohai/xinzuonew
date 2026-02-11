import { Lightbulb, Plus } from "lucide-react";

/**
 * 灵感中心 — MVP 骨架页面
 * 后续版本将集成快速记录、语音转文字、图片收集等功能
 */
export function InspirationCenter() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 h-14 shrink-0 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">灵感中心</h1>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          记录灵感
        </button>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <Lightbulb className="w-16 h-16 opacity-20 mb-4" />
        <p className="text-lg mb-1">灵感稍纵即逝</p>
        <p className="text-sm">随时记录你的想法，它们将在这里等你回来</p>
      </div>
    </div>
  );
}
