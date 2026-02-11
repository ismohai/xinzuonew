import { ListTodo } from "lucide-react";

/**
 * 任务中心 — MVP 骨架
 * 后续版本将支持创建写作任务、截止日期、AI 自动分解等
 */
export function TaskCenter() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 shrink-0 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">任务中心</h1>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <ListTodo className="w-16 h-16 opacity-20 mb-4" />
        <p className="text-lg mb-1">还没有任务</p>
        <p className="text-sm">任务管理功能将在后续版本中推出</p>
      </div>
    </div>
  );
}
