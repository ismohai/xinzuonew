import { useEffect } from "react";
import { BarChart3, Target, Clock, FileText } from "lucide-react";
import { useStatsStore } from "@/stores/useStatsStore";
import { useSettingStore } from "@/stores/useSettingStore";

/**
 * 写作统计页 — 展示今日字数、目标进度、写作时长
 * MVP 阶段为卡片式统计摘要，后续版本加入折线图/日历热力图
 */
export function WritingStats() {
  const { todayWords, todayDuration, fetchStats } = useStatsStore();
  const dailyGoal = useSettingStore((s) => s.dailyGoal);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    fetchStats(weekAgo, today);
  }, [fetchStats]);

  const progress = dailyGoal > 0 ? Math.min(100, Math.round((todayWords / dailyGoal) * 100)) : 0;
  const durationMin = Math.round(todayDuration / 60);

  return (
    <div className="flex-1 overflow-y-auto p-6">
        {/* 统计卡片网格 — Memos card 风格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 今日字数 */}
          <div className="relative flex flex-col bg-card px-4 py-4 gap-2 text-card-foreground rounded-lg border border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span className="text-sm">今日字数</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{todayWords.toLocaleString()}</p>
          </div>

          {/* 目标进度 */}
          <div className="relative flex flex-col bg-card px-4 py-4 gap-2 text-card-foreground rounded-lg border border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="w-4 h-4" />
              <span className="text-sm">目标进度</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{progress}%</p>
            {/* 进度条 */}
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {todayWords} / {dailyGoal} 字
            </p>
          </div>

          {/* 写作时长 */}
          <div className="relative flex flex-col bg-card px-4 py-4 gap-2 text-card-foreground rounded-lg border border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">今日时长</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{durationMin} 分钟</p>
          </div>
        </div>

        {/* 图表区域占位 */}
        <div className="mt-8 flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed border-border rounded-lg">
          <BarChart3 className="w-12 h-12 opacity-20 mb-3" />
          <p className="text-sm">趋势图表将在后续版本中推出</p>
        </div>
    </div>
  );
}
