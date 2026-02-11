import { ListTodo } from "lucide-react";

export function TaskCenter() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
      <ListTodo className="w-16 h-16 opacity-20 mb-4" />
      <p className="text-lg mb-1">还没有任务</p>
      <p className="text-sm">任务管理功能将在后续版本中推出</p>
    </div>
  );
}
