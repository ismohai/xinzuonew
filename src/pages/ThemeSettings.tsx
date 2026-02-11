import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Type, Ruler, FolderOpen, Loader2 } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { cn } from "@/lib/utils";
import { useSettingStore, type ThemeMode } from "@/stores/useSettingStore";
import * as api from "@/api";

// 复用 Memos Settings/ 结构: SettingSection > SettingGroup > SettingRow

const THEME_OPTIONS: { mode: ThemeMode; icon: React.ElementType; label: string }[] = [
  { mode: "light", icon: Sun, label: "浅色模式" },
  { mode: "dark", icon: Moon, label: "深色模式" },
  { mode: "system", icon: Monitor, label: "跟随系统" },
];

const FONT_SIZES = [14, 15, 16, 17, 18, 20];
const FONT_FAMILIES = [
  { value: "system-ui", label: "系统默认" },
  { value: "'Noto Serif SC', serif", label: "思源宋体" },
  { value: "'LXGW WenKai', cursive", label: "霞鹜文楷" },
  { value: "'Source Han Sans SC', sans-serif", label: "思源黑体" },
];

export function ThemeSettings() {
  const themeMode = useSettingStore((s) => s.themeMode);
  const setThemeMode = useSettingStore((s) => s.setThemeMode);
  const fontSize = useSettingStore((s) => s.fontSize);
  const setFontSize = useSettingStore((s) => s.setFontSize);
  const fontFamily = useSettingStore((s) => s.fontFamily);
  const setFontFamily = useSettingStore((s) => s.setFontFamily);
  const dailyGoal = useSettingStore((s) => s.dailyGoal);
  const setDailyGoal = useSettingStore((s) => s.setDailyGoal);
  const animationDuration = useSettingStore((s) => s.animationDuration);
  const setAnimationDuration = useSettingStore((s) => s.setAnimationDuration);

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
    <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto w-full">
        {/* ---- 数据目录 ---- */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            <FolderOpen className="inline w-4 h-4 mr-1 -mt-0.5" />
            数据目录
          </h2>
          <div className="flex flex-col gap-3 bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground truncate flex-1" title={dataDir}>
                {dataDir || "加载中..."}
              </span>
              <button
                onClick={handleChangeDataDir}
                disabled={moving}
                className={cn(
                  "shrink-0 px-3 py-1.5 text-xs rounded-md border transition-colors",
                  "border-border text-muted-foreground hover:bg-accent",
                  moving && "opacity-50 cursor-not-allowed"
                )}
              >
                {moving ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    迁移中...
                  </span>
                ) : (
                  "更改目录"
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              更改后，已有数据会自动迁移到新目录
            </p>
          </div>
        </section>

        {/* ---- 外观 ---- */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">外观</h2>
          <div className="flex flex-col gap-1 bg-card rounded-lg border border-border p-1">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.mode}
                onClick={() => setThemeMode(opt.mode)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm transition-colors",
                  themeMode === opt.mode
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-foreground hover:bg-accent"
                )}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* ---- 编辑器字体 ---- */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            <Type className="inline w-4 h-4 mr-1 -mt-0.5" />
            编辑器字体
          </h2>
          <div className="flex flex-col gap-3 bg-card rounded-lg border border-border p-4">
            {/* 字体族 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">字体</span>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="border border-border rounded-lg px-2 py-1 text-sm bg-background outline-none focus:ring-1 focus:ring-ring"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            {/* 字号 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">
                <Ruler className="inline w-4 h-4 mr-1 -mt-0.5" />
                字号
              </span>
              <div className="flex items-center gap-1">
                {FONT_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFontSize(s)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-md border transition-colors",
                      fontSize === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---- 写作目标 ---- */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">每日目标</h2>
          <div className="flex items-center gap-3 bg-card rounded-lg border border-border p-4">
            <span className="text-sm text-foreground">每日字数目标</span>
            <input
              type="number"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value) || 0)}
              className="w-24 border border-border rounded-lg px-2 py-1 text-sm bg-background outline-none focus:ring-1 focus:ring-ring"
              min={0}
              step={500}
            />
            <span className="text-sm text-muted-foreground">字</span>
          </div>
        </section>

        {/* ---- 动画速度 ---- */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">动画</h2>
          <div className="flex items-center gap-4 bg-card rounded-lg border border-border p-4">
            <span className="text-sm text-foreground shrink-0">动画速度</span>
            <input
              type="range"
              min={100}
              max={1000}
              step={100}
              value={animationDuration}
              onChange={(e) => setAnimationDuration(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-16 text-right">{animationDuration}ms</span>
          </div>
        </section>
        </div>
    </div>
  );
}
