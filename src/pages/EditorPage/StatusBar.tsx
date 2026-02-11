import { useEditorStore } from "@/stores/useEditorStore";
import { useStatsStore } from "@/stores/useStatsStore";
import { useSettingStore } from "@/stores/useSettingStore";

export function StatusBar() {
  const currentChapter = useEditorStore((s) => s.currentChapter);
  const dirty = useEditorStore((s) => s.dirty);
  const liveWordCount = useEditorStore((s) => s.liveWordCount);
  const todayWords = useStatsStore((s) => s.todayWords);
  const dailyGoal = useSettingStore((s) => s.dailyGoal);
  const autoSaveInterval = useSettingStore((s) => s.autoSaveInterval);

  return (
    <div className="flex items-center justify-between px-4 py-1 border-t border-border bg-background text-xs text-muted-foreground shrink-0">
      <div className="flex items-center gap-4">
        {currentChapter && (
          <>
            <span>字数: {liveWordCount.toLocaleString()}</span>
            <span>状态: {currentChapter.status === "draft" ? "草稿" : currentChapter.status === "complete" ? "完成" : "待修"}</span>
            {dirty && <span className="text-amber-500">● 未保存</span>}
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span>今日: {todayWords.toLocaleString()} / {dailyGoal.toLocaleString()} 字</span>
        {autoSaveInterval > 0 && <span>自动保存: {autoSaveInterval}s</span>}
      </div>
    </div>
  );
}
