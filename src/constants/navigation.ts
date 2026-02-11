import { BookOpen, Lightbulb, BarChart3, ListTodo, Palette, Trash2 } from "lucide-react";
import type { ElementType } from "react";
import type { PageType } from "@/types";

export const PAGE_ORDER: PageType[] = [
  "content",
  "inspiration",
  "stats",
  "tasks",
  "themes",
  "trash",
];

export const NAV_ITEMS: {
  id: PageType;
  label: string;
  icon: ElementType;
}[] = [
  { id: "content", label: "内容管理", icon: BookOpen },
  { id: "inspiration", label: "灵感中心", icon: Lightbulb },
  { id: "stats", label: "写作统计", icon: BarChart3 },
  { id: "tasks", label: "任务中心", icon: ListTodo },
  { id: "themes", label: "主题设置", icon: Palette },
  { id: "trash", label: "回收站", icon: Trash2 },
];
