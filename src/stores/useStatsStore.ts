import { create } from "zustand";
import type { DailyStat } from "@/types";
import * as api from "@/api";

interface StatsState {
  stats: DailyStat[];
  loading: boolean;
  todayWords: number;
  todayDuration: number;

  fetchStats: (startDate: string, endDate: string) => Promise<void>;
  recordWords: (date: string, wordCountDelta: number, durationDelta: number) => Promise<void>;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: [],
  loading: false,
  todayWords: 0,
  todayDuration: 0,

  fetchStats: async (startDate, endDate) => {
    set({ loading: true });
    try {
      const stats = await api.getDailyStats(startDate, endDate);
      // 计算今日数据
      const today = new Date().toISOString().slice(0, 10);
      const todayStat = stats.find((s) => s.date === today);
      set({
        stats,
        todayWords: todayStat?.word_count ?? 0,
        todayDuration: todayStat?.duration_seconds ?? 0,
      });
    } finally {
      set({ loading: false });
    }
  },

  recordWords: async (date, wordCountDelta, durationDelta) => {
    await api.updateDailyStats(date, wordCountDelta, durationDelta);
    const today = new Date().toISOString().slice(0, 10);
    if (date === today) {
      set((s) => ({
        todayWords: s.todayWords + wordCountDelta,
        todayDuration: s.todayDuration + durationDelta,
      }));
    }
  },
}));
