import { useEffect, useMemo } from "react";
import { Target, Clock, FileText, TrendingUp, BookOpen } from "lucide-react";
import { useStatsStore } from "@/stores/useStatsStore";
import { useSettingStore } from "@/stores/useSettingStore";

/**
 * 写作统计页 — 展示今日字数、目标进度、写作时长、本周总计、日均
 */
export function WritingStats() {
  const { stats, todayWords, todayDuration, fetchStats } = useStatsStore();
  const dailyGoal = useSettingStore((s) => s.dailyGoal);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    fetchStats(weekAgo, today);
  }, [fetchStats]);

  const progress = dailyGoal > 0 ? Math.min(100, Math.round((todayWords / dailyGoal) * 100)) : 0;
  const durationMin = Math.round(todayDuration / 60);

  // 本周统计
  const { weekTotal, dailyAvg, chartData } = useMemo(() => {
    const total = stats.reduce((sum, s) => sum + s.word_count, 0);
    const avg = stats.length > 0 ? Math.round(total / stats.length) : 0;
    // 近7天柱状图数据
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const stat = stats.find((s) => s.date === dateStr);
      days.push({ label, count: stat?.word_count ?? 0 });
    }
    return { weekTotal: total, dailyAvg: avg, chartData: days };
  }, [stats]);

  const chartMax = Math.max(...chartData.map((d) => d.count), dailyGoal, 1);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* 统计卡片网格 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={FileText} label="今日字数" value={todayWords.toLocaleString()} />
        <StatCard icon={TrendingUp} label="日均字数" value={dailyAvg.toLocaleString()} />
        <StatCard icon={BookOpen} label="本周总计" value={weekTotal.toLocaleString()} />
        <StatCard icon={Clock} label="今日时长" value={`${durationMin} 分钟`} />
        {/* 目标进度 */}
        <div className="relative flex flex-col bg-card px-4 py-4 gap-2 text-card-foreground rounded-lg border border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="w-4 h-4" />
            <span className="text-sm">日更目标</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{progress}%</p>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: progress >= 100 ? "var(--color-green-500, #22c55e)" : "hsl(var(--primary))",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {todayWords} / {dailyGoal} 字
          </p>
        </div>
      </div>

      {/* 7天柱状图 */}
      <div className="mt-6 bg-card rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">近 7 天写作量</h3>
        <div className="flex items-end gap-2 h-32">
          {chartData.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {d.count > 0 ? d.count : ""}
              </span>
              <div
                className="w-full rounded-t-sm transition-all duration-300"
                style={{
                  height: `${Math.max(2, (d.count / chartMax) * 100)}%`,
                  backgroundColor:
                    d.count >= dailyGoal
                      ? "var(--color-green-500, #22c55e)"
                      : "hsl(var(--primary) / 0.6)",
                }}
              />
              <span className="text-xs text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
        {dailyGoal > 0 && (
          <div className="relative mt-2">
            <div
              className="absolute left-0 right-0 border-t border-dashed border-amber-500/50"
              style={{ bottom: `${(dailyGoal / chartMax) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col bg-card px-4 py-4 gap-2 text-card-foreground rounded-lg border border-border">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
