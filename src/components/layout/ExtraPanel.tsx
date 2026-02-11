import { useState, useEffect } from "react";
import { X, Bell, Info, RefreshCw, Settings, FolderOpen, Loader2 } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { cn } from "@/lib/utils";
import { useSettingStore } from "@/stores/useSettingStore";
import type { ExtraPanelType } from "@/types";
import { motion } from "framer-motion";
import * as api from "@/api";

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
  { id: "settings", title: "系统设置", icon: Settings },
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

function SystemSettingsContent() {
  const [dataDir, setDataDir] = useState("");
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    api.getDataDir().then(setDataDir).catch(console.error);
  }, []);

  const handleChangeDataDir = async () => {
    const selected = await open({ directory: true, title: "选择数据存储目录" });
    if (!selected) return;

    setMoving(true);
    try {
      await api.setDataDir(selected);
      const newDir = await api.getDataDir();
      setDataDir(newDir);
    } catch (err) {
      console.error("迁移数据目录失败:", err);
    } finally {
      setMoving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 数据目录 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <FolderOpen className="w-3.5 h-3.5" />
          数据目录
        </div>
        <div className="flex flex-col gap-2 bg-card rounded-lg border border-border p-3">
          <span className="text-xs text-foreground break-all" title={dataDir}>
            {dataDir || "加载中..."}
          </span>
          <button
            onClick={handleChangeDataDir}
            disabled={moving}
            className={cn(
              "w-full px-3 py-1.5 text-xs rounded-md border transition-colors text-center",
              "border-border text-muted-foreground hover:bg-accent",
              moving && "opacity-50 cursor-not-allowed"
            )}
          >
            {moving ? (
              <span className="flex items-center justify-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                迁移中...
              </span>
            ) : (
              "更改目录"
            )}
          </button>
          <p className="text-[11px] text-muted-foreground/70">
            更改后，已有数据会自动迁移到新目录
          </p>
        </div>
      </div>
    </div>
  );
}

const PANEL_CONTENT: Record<Exclude<ExtraPanelType, null>, React.ComponentType> = {
  notifications: NotificationsContent,
  updates: UpdatesContent,
  about: AboutContent,
  settings: SystemSettingsContent,
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
