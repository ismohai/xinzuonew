import { useEditorStore } from "@/stores/useEditorStore";
import { useStatsStore } from "@/stores/useStatsStore";
import { useSettingStore } from "@/stores/useSettingStore";

export function StatusBar() {
  const currentChapter = useEditorStore((s) => s.currentChapter);
  const dirty = useEditorStore((s) => s.dirty);
  const todayWords = useStatsStore((s) => s.todayWords);
  const dailyGoal = useSettingStore((s) => s.dailyGoal);

  return (
    <div className="flex items-center justify-between px-4 py-1 border-t border-border bg-background text-xs text-muted-foreground shrink-0">
      <div className="flex items-center gap-4">
        {currentChapter && (
          <>
            <span>字数: {currentChapter.word_count}</span>
            <span>状态: {currentChapter.status === "draft" ? "草稿" : currentChapter.status === "complete" ? "完成" : "待修"}</span>
            {dirty && <span className="text-amber-500">● 未保存</span>}
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span>今日: {todayWords} / {dailyGoal} 字</span>
      </div>
    </div>
  );
}
