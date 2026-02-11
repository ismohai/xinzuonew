import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, User, MapPin, Swords, Box, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/useEditorStore";
import type { Entity } from "@/types";

const ENTITY_TYPES = [
  { type: "character", label: "人物", icon: User },
  { type: "item", label: "道具", icon: Box },
  { type: "location", label: "地点", icon: MapPin },
  { type: "faction", label: "势力", icon: Swords },
] as const;

type TabType = (typeof ENTITY_TYPES)[number]["type"] | "inbox";

export function EntityPanel() {
  const { entities, fetchEntities, addEntity, removeEntity } = useEditorStore();
  const storagePath = useEditorStore((s) => s.storagePath);
  const [activeTab, setActiveTab] = useState<TabType>("character");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (storagePath) fetchEntities();
  }, [storagePath, fetchEntities]);

  useEffect(() => {
    if (adding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [adding]);

  const filtered =
    activeTab === "inbox"
      ? entities.filter((e) => e.inbox)
      : entities.filter((e) => e.entity_type === activeTab && !e.inbox);

  const handleAdd = async () => {
    if (!newName.trim()) {
      setAdding(false);
      return;
    }
    const isInbox = activeTab === "inbox";
    const type = isInbox ? "character" : activeTab;
    await addEntity(newName.trim(), type, "{}", isInbox);
    setNewName("");
    setAdding(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 分类标签 */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border">
        {ENTITY_TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors",
              activeTab === type
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50"
            )}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
        <button
          onClick={() => setActiveTab("inbox")}
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors",
            activeTab === "inbox"
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/50"
          )}
        >
          <Inbox className="w-3 h-3" />
          收集
        </button>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto py-1">
        {filtered.length === 0 && !adding && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            暂无条目
          </div>
        )}
        {filtered.map((entity) => (
          <EntityRow key={entity.id} entity={entity} onDelete={removeEntity} />
        ))}
        {adding && (
          <div className="flex items-center gap-1 px-3 py-1">
            <input
              ref={inputRef}
              className="flex-1 min-w-0 bg-transparent text-sm text-foreground outline-none border-b border-primary"
              placeholder="输入名称..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleAdd}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") { setAdding(false); setNewName(""); }
              }}
            />
          </div>
        )}
      </div>

      {/* 底部添加按钮 */}
      <div className="px-3 py-2 border-t border-border">
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          新建{activeTab === "inbox" ? "收集" : ENTITY_TYPES.find((t) => t.type === activeTab)?.label}
        </button>
      </div>
    </div>
  );
}

function EntityRow({ entity, onDelete }: { entity: Entity; onDelete: (id: string) => void }) {
  const updateEntity = useEditorStore((s) => s.updateEntity);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(entity.name);
  const editRef = useRef<HTMLInputElement>(null);
  const typeInfo = ENTITY_TYPES.find((t) => t.type === entity.entity_type);
  const Icon = typeInfo?.icon ?? Box;

  useEffect(() => {
    if (editing && editRef.current) editRef.current.focus();
  }, [editing]);

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== entity.name) {
      updateEntity(entity.id, { name: trimmed });
    }
    setEditing(false);
    setEditName(trimmed || entity.name);
  };

  return (
    <div
      className="group flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent rounded-md mx-1 transition-colors"
      onDoubleClick={() => { setEditing(true); setEditName(entity.name); }}
    >
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      {editing ? (
        <input
          ref={editRef}
          className="flex-1 min-w-0 bg-transparent text-sm text-foreground outline-none border-b border-primary"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") { setEditing(false); setEditName(entity.name); }
          }}
        />
      ) : (
        <span className="truncate text-foreground cursor-default">{entity.name}</span>
      )}
      {entity.status === "dead" && (
        <span className="text-xs text-destructive shrink-0">已故</span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(entity.id); }}
        className="ml-auto p-0.5 rounded-sm text-muted-foreground opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}
