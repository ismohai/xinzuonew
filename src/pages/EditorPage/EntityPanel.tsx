import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, User, MapPin, Swords, Box, Inbox, ArrowLeft, X } from "lucide-react";
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
  const [detailEntity, setDetailEntity] = useState<Entity | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (storagePath) fetchEntities();
  }, [storagePath, fetchEntities]);

  useEffect(() => {
    if (adding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [adding]);

  // 同步 detailEntity 与 store
  useEffect(() => {
    if (detailEntity) {
      const updated = entities.find((e) => e.id === detailEntity.id);
      if (updated) setDetailEntity(updated);
      else setDetailEntity(null);
    }
  }, [entities, detailEntity?.id]);

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

  // 详情卡片视图
  if (detailEntity) {
    return <EntityDetailCard entity={detailEntity} onBack={() => setDetailEntity(null)} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* 分类标签（仅图标）+ 添加按钮 */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border">
        {ENTITY_TYPES.map(({ type, icon: Icon }) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              activeTab === type
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50"
            )}
            title={ENTITY_TYPES.find((t) => t.type === type)?.label}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
        <button
          onClick={() => setActiveTab("inbox")}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            activeTab === "inbox"
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/50"
          )}
          title="收集"
        >
          <Inbox className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setAdding(true)}
          className="ml-auto p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="新建"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto py-1">
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
        {filtered.length === 0 && !adding && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            暂无条目
          </div>
        )}
        {filtered.map((entity) => (
          <EntityRow
            key={entity.id}
            entity={entity}
            onDelete={removeEntity}
            onOpen={setDetailEntity}
          />
        ))}
      </div>
    </div>
  );
}

/* ---- 实体行 ---- */
function EntityRow({
  entity,
  onDelete,
  onOpen,
}: {
  entity: Entity;
  onDelete: (id: string) => void;
  onOpen: (e: Entity) => void;
}) {
  const typeInfo = ENTITY_TYPES.find((t) => t.type === entity.entity_type);
  const Icon = typeInfo?.icon ?? Box;

  return (
    <div
      className="group flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent rounded-md mx-1 transition-colors cursor-pointer"
      onClick={() => onOpen(entity)}
    >
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="truncate text-foreground">{entity.name}</span>
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

/* ---- 实体详情卡片 ---- */
const ATTRIBUTE_TEMPLATES: Record<string, string[]> = {
  character: ["性别", "年龄", "外貌", "性格", "背景", "技能", "备注"],
  item: ["类型", "等级", "描述", "效果", "来源", "备注"],
  location: ["地区", "描述", "特色", "危险等级", "备注"],
  faction: ["领袖", "宗旨", "势力范围", "描述", "备注"],
};

function EntityDetailCard({ entity, onBack }: { entity: Entity; onBack: () => void }) {
  const updateEntity = useEditorStore((s) => s.updateEntity);
  const [name, setName] = useState(entity.name);
  const [attrs, setAttrs] = useState<Record<string, string>>(() => {
    try { return JSON.parse(entity.attributes_json || "{}"); } catch { return {}; }
  });

  const fields = ATTRIBUTE_TEMPLATES[entity.entity_type] || ["描述", "备注"];

  const handleSave = () => {
    const updates: { name?: string; attributesJson?: string } = {};
    if (name.trim() && name.trim() !== entity.name) updates.name = name.trim();
    const json = JSON.stringify(attrs);
    if (json !== entity.attributes_json) updates.attributesJson = json;
    if (Object.keys(updates).length > 0) updateEntity(entity.id, updates);
  };

  // 自动保存（失焦时）
  const autoSave = () => handleSave();

  const typeInfo = ENTITY_TYPES.find((t) => t.type === entity.entity_type);

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
        <button
          onClick={() => { handleSave(); onBack(); }}
          className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs text-muted-foreground">{typeInfo?.label || "设定"}</span>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
        {/* 名称 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">名称</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={autoSave}
            className="w-full px-2 py-1.5 text-sm bg-card border border-border rounded-md text-foreground outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* 属性字段 */}
        {fields.map((field) => (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">{field}</label>
            <textarea
              rows={field === "背景" || field === "描述" ? 3 : 1}
              value={attrs[field] || ""}
              onChange={(e) => setAttrs((prev) => ({ ...prev, [field]: e.target.value }))}
              onBlur={autoSave}
              className="w-full px-2 py-1.5 text-sm bg-card border border-border rounded-md text-foreground outline-none focus:ring-1 focus:ring-primary/30 resize-none"
              placeholder={`输入${field}...`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
