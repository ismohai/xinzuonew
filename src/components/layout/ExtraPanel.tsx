import { X, Bell, Info, RefreshCw, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingStore } from "@/stores/useSettingStore";
import type { ExtraPanelType } from "@/types";
import { motion } from "framer-motion";

// ---- 面板内容配置 ----

interface PanelConfig {
  id: Exclude<ExtraPanelType, null>;
  title: string;
  icon: React.ElementType;
}

const PANELS: PanelConfig[] = [
  { id: "notifications", title: "通知中心", icon: Bell },
  { id: "updates", title: "检查更新", icon: RefreshCw },
  { id: "about", title: "关于心作", icon: Info },
  { id: "settings", title: "快捷设置", icon: Settings },
];

// ---- 面板内容组件 (各面板的骨架) ----

function NotificationsContent() {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
      暂无通知
    </div>
  );
}

function UpdatesContent() {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground text-sm">
      <RefreshCw className="w-8 h-8 opacity-40" />
      <span>当前已是最新版本</span>
    </div>
  );
}

function AboutContent() {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="font-semibold text-foreground">心作 · XinZuo</p>
      <p className="text-muted-foreground">版本: 0.1.0-alpha</p>
      <p className="text-muted-foreground">
        一款专为网络小说作家打造的写作 IDE，集智能辅助、世界观管理与写作分析于一体。
      </p>
    </div>
  );
}

function SettingsQuickContent() {
  return (
    <div className="text-sm text-muted-foreground">
      请前往「主题设置」页面进行完整配置。
    </div>
  );
}

const PANEL_CONTENT: Record<Exclude<ExtraPanelType, null>, React.ComponentType> = {
  notifications: NotificationsContent,
  updates: UpdatesContent,
  about: AboutContent,
  settings: SettingsQuickContent,
};

// ---- ExtraPanel 组件 ----

export function ExtraPanel() {
  const extraPanel = useSettingStore((s) => s.extraPanel);
  const setExtraPanel = useSettingStore((s) => s.setExtraPanel);
  const animationDuration = useSettingStore((s) => s.animationDuration);
  const editingBookId = useSettingStore((s) => s.editingBookId);

  const isOpen = extraPanel !== null && editingBookId === null;
  const config = PANELS.find((p) => p.id === extraPanel);
  const Content = extraPanel ? PANEL_CONTENT[extraPanel] : null;
  const duration = animationDuration / 1000;

  return (
    <motion.div
      className={cn(
        // xinzuo ExtraPanel 滑出动画
        "h-full shrink-0 border-l border-border bg-background overflow-y-auto"
      )}
      animate={{ width: isOpen ? 288 : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ duration, ease: "easeInOut" }}
    >
      {config && Content && (
        <div className="flex flex-col h-full">
          {/* 面板头部 */}
          <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-border">
            <div className="flex items-center gap-2">
              <config.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{config.title}</span>
            </div>
            <button
              onClick={() => setExtraPanel(null)}
              className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* 面板内容 */}
          <div className="flex-1 px-4 py-3">
            <Content />
          </div>
        </div>
      )}
    </motion.div>
  );
}
