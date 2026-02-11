import { useState } from "react";
import { List, BookOpen, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChapterExplorer } from "./ChapterExplorer";
import { EntityPanel } from "./EntityPanel";
import { ForeshadowPanel } from "./ForeshadowPanel";

type LeftTab = "chapters" | "entities" | "foreshadows";

const TABS: { id: LeftTab; label: string; icon: React.ElementType }[] = [
  { id: "chapters", label: "目录", icon: List },
  { id: "entities", label: "设定", icon: BookOpen },
  { id: "foreshadows", label: "伏笔", icon: Eye },
];

export function LeftPanel() {
  const [activeTab, setActiveTab] = useState<LeftTab>("chapters");

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* 顶部 Tab 栏 */}
      <div className="flex items-center gap-0.5 px-2 h-10 border-b border-border shrink-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors",
              activeTab === id
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chapters" && <ChapterExplorer embedded />}
        {activeTab === "entities" && <EntityPanel />}
        {activeTab === "foreshadows" && <ForeshadowPanel />}
      </div>
    </div>
  );
}
