import { Bot, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSettingStore } from "@/stores/useSettingStore";

/**
 * AI 辅助面板 — MVP 骨架
 * 后续版本将集成 AI 对话、续写、检查等功能
 */
export function AiPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const animationDuration = useSettingStore((s) => s.animationDuration);
  const width = collapsed ? 40 : 256;
  const duration = animationDuration / 1000;

  return (
    <motion.aside
      className={cn(
        "flex flex-col h-full shrink-0 border-l border-border bg-background overflow-hidden"
      )}
      initial={{ width: 0, opacity: 0 }}
      animate={{ width, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration, ease: "easeInOut" }}
    >
      {/* 折叠/展开按钮 */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Bot className="w-4 h-4" />
            <span className="text-xs font-medium">AI 助手</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-muted-foreground hover:bg-accent transition-colors"
        >
          {collapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 内容 */}
      {!collapsed && (
        <div className="flex-1 flex flex-col items-center justify-center px-3 text-center text-muted-foreground">
          <Bot className="w-10 h-10 opacity-20 mb-3" />
          <p className="text-sm mb-1">AI 辅助功能</p>
          <p className="text-xs">将在后续版本中推出</p>
        </div>
      )}
    </motion.aside>
  );
}
