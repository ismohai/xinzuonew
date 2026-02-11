import { create } from "zustand";
import * as api from "@/api";
import { loadTheme } from "@/utils/theme";
import type { PageType, ExtraPanelType } from "@/types";
import { PAGE_ORDER } from "@/constants/navigation";

export type ThemeMode = "light" | "dark" | "system";

/** 将 store 的 ThemeMode 映射为 utils/theme.ts 的 Theme 名称 */
const THEME_MAP: Record<ThemeMode, string> = {
  light: "default",
  dark: "default-dark",
  system: "system",
};

interface SettingState {
  themeMode: ThemeMode;
  fontSize: number;
  fontFamily: string;
  dailyGoal: number;
  animationDuration: number;

  // 主界面导航状态 (xinzuo 风格)
  activePage: PageType;
  previousPageIndex: number;
  extraPanel: ExtraPanelType | null;
  editingBookId: string | null;

  // actions
  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setDailyGoal: (goal: number) => void;
  setAnimationDuration: (duration: number) => void;
  setActivePage: (page: PageType) => void;
  setExtraPanel: (panel: ExtraPanelType | null) => void;
  setEditingBookId: (bookId: string | null) => void;
  loadSettings: () => Promise<void>;
  saveSetting: (key: string, value: string) => Promise<void>;
}

export const useSettingStore = create<SettingState>((set) => ({
  themeMode: "light",
  fontSize: 16,
  fontFamily: "system-ui",
  dailyGoal: 2000,
  animationDuration: 200,
  activePage: "content",
  previousPageIndex: 0,
  extraPanel: null,
  editingBookId: null,

  setThemeMode: (mode) => {
    loadTheme(THEME_MAP[mode]);
    set({ themeMode: mode });
    api.updateSetting("theme_mode", mode).catch(console.error);
  },

  setFontSize: (size) => {
    set({ fontSize: size });
    api.updateSetting("font_size", String(size)).catch(console.error);
  },

  setFontFamily: (family) => {
    set({ fontFamily: family });
    api.updateSetting("font_family", family).catch(console.error);
  },

  setDailyGoal: (goal) => {
    set({ dailyGoal: goal });
    api.setDailyGoal(goal).catch(console.error);
  },
  setAnimationDuration: (duration) => {
    const rounded = Math.round(duration / 100) * 100;
    const next = Math.min(1000, Math.max(100, rounded));
    set({ animationDuration: next });
    api.updateSetting("animation_duration", String(next)).catch(console.error);
  },

  setActivePage: (page) =>
    set((state) => {
      if (state.activePage === page) return state;
      const previousPageIndex = PAGE_ORDER.indexOf(state.activePage);
      return {
        activePage: page,
        previousPageIndex: previousPageIndex === -1 ? 0 : previousPageIndex,
      };
    }),
  setExtraPanel: (panel) => set({ extraPanel: panel }),
  setEditingBookId: (bookId) =>
    set((state) => ({
      editingBookId: bookId,
      extraPanel: bookId ? null : state.extraPanel,
    })),

  loadSettings: async () => {
    try {
      const settings = await api.getSettings();
      const map: Record<string, string> = {};
      for (const s of settings) {
        map[s.key] = s.value;
      }
      const mode = (map["theme_mode"] as ThemeMode) || "light";
      const durationRaw = map["animation_duration"];
      const durationNum = durationRaw ? Number(durationRaw) : 200;
      const durationRounded = Math.round(durationNum / 100) * 100;
      const animationDuration = Math.min(1000, Math.max(100, durationRounded || 200));
      loadTheme(THEME_MAP[mode]);
      set({
        themeMode: mode,
        fontSize: map["font_size"] ? Number(map["font_size"]) : 16,
        fontFamily: map["font_family"] || "system-ui",
        dailyGoal: map["daily_goal"] ? Number(map["daily_goal"]) : 2000,
        animationDuration,
      });
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  },

  saveSetting: async (key, value) => {
    await api.updateSetting(key, value);
  },
}));
