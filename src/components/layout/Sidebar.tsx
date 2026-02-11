import { Bell, Info, RefreshCw, Settings, Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingStore, type ThemeMode } from "@/stores/useSettingStore";
import type { ExtraPanelType } from "@/types";
import { UserAvatar } from "@/components/UserAvatar";
import { NAV_ITEMS } from "@/constants/navigation";
import { LeftPanel } from "@/pages/EditorPage/LeftPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";

// ---- 导航配置 (xinzuo Sidebar 的 5 个主导航) ----


// ---- 底部按钮配置 (xinzuo Sidebar 的 4 个 footer buttons) ----

interface FooterBtn {
  id: ExtraPanelType;
  icon: React.ElementType;
  tip: string;
}

const FOOTER_BTNS: FooterBtn[] = [
  { id: "notifications", icon: Bell, tip: "通知" },
  { id: "updates", icon: RefreshCw, tip: "更新" },
  { id: "about", icon: Info, tip: "关于" },
  { id: "settings", icon: Settings, tip: "设置" },
];

// ---- 主题选项 ----

const THEME_OPTIONS: { mode: ThemeMode; icon: React.ElementType; label: string }[] = [
  { mode: "light", icon: Sun, label: "浅色" },
  { mode: "dark", icon: Moon, label: "深色" },
  { mode: "system", icon: Monitor, label: "跟随系统" },
];

// ---- Sidebar 组件 ----

export function Sidebar() {
  const activePage = useSettingStore((s) => s.activePage);
  const setActivePage = useSettingStore((s) => s.setActivePage);
  const extraPanel = useSettingStore((s) => s.extraPanel);
  const setExtraPanel = useSettingStore((s) => s.setExtraPanel);
  const themeMode = useSettingStore((s) => s.themeMode);
  const setThemeMode = useSettingStore((s) => s.setThemeMode);
  const animationDuration = useSettingStore((s) => s.animationDuration);
  const editingBookId = useSettingStore((s) => s.editingBookId);
  const isEditing = editingBookId !== null;
  const duration = animationDuration / 1000;

  return (
    <motion.aside
      className={cn(
        // Memos MainLayout sidebar 样式: 固定左侧, border-r
        "flex flex-col h-full shrink-0 overflow-hidden",
        "bg-background text-sidebar-foreground",
        "border-r border-border"
      )}
      animate={{ width: isEditing ? 224 : 64 }}
      transition={{ duration, ease: "easeInOut" }}
    >
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="explorer"
            className="flex-1 flex flex-col h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
          >
            <LeftPanel />
          </motion.div>
        ) : (
          <motion.div
            key="nav"
            className="flex-1 flex flex-col h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
          >
            {/* ---- Logo + 用户头像 (Memos UserMenu 风格 DropdownMenu) ---- */}
            <div className="flex flex-col items-center gap-2 py-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-xl outline-none"
                    title="用户菜单"
                  >
                    <UserAvatar className="w-9 h-9" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-48">
                  <DropdownMenuItem className="font-medium">心作 · XinZuo</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* 主题子菜单 — Memos UserMenu 风格 */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      {themeMode === "dark" ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                      外观
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {THEME_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                          key={opt.mode}
                          onClick={() => setThemeMode(opt.mode)}
                          className={cn(themeMode === opt.mode && "bg-accent")}
                        >
                          <opt.icon className="mr-2 h-4 w-4" />
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* ---- 5 个主导航 (Memos Navigation.tsx NavLink 样式) ---- */}
            <nav className="flex flex-col items-center gap-1 flex-1 px-2">
              {NAV_ITEMS.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    title={item.label}
                    className={cn(
                      // Memos NavLink: px-2 py-2 rounded-2xl border 样式
                      "flex items-center justify-center w-10 h-10 rounded-2xl border transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-accent"
                        : "border-transparent text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                  </button>
                );
              })}
            </nav>

            {/* ---- 4 个底部按钮 (xinzuo footer buttons) ---- */}
            <div className="flex flex-col items-center gap-1 px-2 pb-3">
              {FOOTER_BTNS.map((btn) => {
                const isActive = extraPanel === btn.id;
                return (
                  <button
                    key={btn.id}
                    onClick={() => setExtraPanel(isActive ? null : btn.id)}
                    title={btn.tip}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-2xl border transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-accent"
                        : "border-transparent text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <btn.icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
