import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/useEditorStore";

export function ForeshadowPanel() {
  const { foreshadows, fetchForeshadows, addForeshadow, resolveForeshadow, removeForeshadow } = useEditorStore();
  const storagePath = useEditorStore((s) => s.storagePath);
  const currentChapterId = useEditorStore((s) => s.currentChapterId);
  const [showResolved, setShowResolved] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (storagePath) fetchForeshadows();
  }, [storagePath, fetchForeshadows]);

  useEffect(() => {
    if (adding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [adding]);

  const open = foreshadows.filter((f) => f.status === "open");
  const resolved = foreshadows.filter((f) => f.status === "resolved");
  const display = showResolved ? resolved : open;

  const handleAdd = async () => {
    if (!newDesc.trim()) {
      setAdding(false);
      return;
    }
    await addForeshadow(newDesc.trim(), currentChapterId ?? undefined);
    setNewDesc("");
    setAdding(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 标签切换 + 添加按钮 */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border">
        <button
          onClick={() => setShowResolved(false)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors",
            !showResolved ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
          )}
        >
          <AlertTriangle className="w-3 h-3" />
          待收 ({open.length})
        </button>
        <button
          onClick={() => setShowResolved(true)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors",
            showResolved ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
          )}
        >
          <CheckCircle2 className="w-3 h-3" />
          已收 ({resolved.length})
        </button>
        {!showResolved && (
          <button
            onClick={() => setAdding(true)}
            className="ml-auto p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="埋伏笔"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto py-1">
        {display.length === 0 && !adding && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            {showResolved ? "暂无已收伏笔" : "暂无待收伏笔"}
          </div>
        )}
        {display.map((f) => (
          <div
            key={f.id}
            className="group flex items-start gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md mx-1 transition-colors"
          >
            {f.status === "resolved" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <button
                onClick={() => {
                  if (currentChapterId) resolveForeshadow(f.id, currentChapterId);
                }}
                title="收伏笔"
                className="shrink-0 mt-0.5"
              >
                <Circle className="w-3.5 h-3.5 text-amber-500 hover:text-green-500 transition-colors" />
              </button>
            )}
            <span className={cn("flex-1 text-foreground", f.status === "resolved" && "line-through text-muted-foreground")}>
              {f.description}
            </span>
            <button
              onClick={() => removeForeshadow(f.id)}
              className="p-0.5 rounded-sm text-muted-foreground opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {adding && (
          <div className="px-3 py-1">
            <textarea
              ref={inputRef}
              rows={2}
              className="w-full min-h-[40px] bg-transparent text-sm text-foreground outline-none border-b border-primary resize-none"
              placeholder="描述伏笔..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              onBlur={handleAdd}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); }
                if (e.key === "Escape") { setAdding(false); setNewDesc(""); }
              }}
            />
          </div>
        )}
      </div>

    </div>
  );
}
