use serde::{Deserialize, Serialize};

// ============================================================================
// global.db models
// ============================================================================

/// 书籍元数据（存储在 global.db 的 books 表）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Book {
    pub id: String,
    pub name: String,
    /// 作者笔名
    pub author_name: String,
    /// 封面图片路径（相对于书籍目录）
    pub cover_path: Option<String>,
    /// 书籍数据目录名（相对于 XinZuoData/Books/）
    pub storage_path: String,
    pub created_at: String,
    pub updated_at: String,
}

/// 全局设置（key-value 存储）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Setting {
    pub key: String,
    pub value: String,
}

/// 每日写作统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyStat {
    pub id: String,
    /// 日期格式：YYYY-MM-DD
    pub date: String,
    pub word_count: i64,
    pub duration_seconds: i64,
    pub daily_goal: i64,
}

/// 跨书实体暂存架（从一本书复制角色/道具到另一本书的中转站）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityShelfItem {
    pub id: String,
    pub name: String,
    /// character / item / location / faction
    pub entity_type: String,
    /// 实体属性 JSON
    pub attributes_json: String,
    /// 来源书籍名称
    pub source_book_name: String,
    pub created_at: String,
}

// ============================================================================
// book.db models
// ============================================================================

/// 分卷
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Volume {
    pub id: String,
    pub name: String,
    pub sort_order: i64,
    pub created_at: String,
}

/// 章节
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chapter {
    pub id: String,
    pub volume_id: String,
    pub name: String,
    /// 章节正文（L1 原文层）
    pub content: String,
    /// L2 章节摘要（AI 生成，200-300字）
    pub l2_summary: Option<String>,
    /// L3 章节标题（AI 生成，≤20字）
    pub l3_title: Option<String>,
    /// draft / complete / dirty
    pub status: String,
    pub word_count: i64,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

/// 设定集实体（人物/道具/地点/势力）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entity {
    pub id: String,
    pub name: String,
    /// character / item / location / faction
    pub entity_type: String,
    /// 自由格式属性 JSON（姓名、外貌、性格、背景等）
    pub attributes_json: String,
    /// alive / dead
    pub status: String,
    /// 是否在 Inbox 中待确认
    pub inbox: bool,
    pub first_chapter_id: Option<String>,
    pub last_chapter_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// 时间线节点（角色在某章的行为标签）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineNode {
    pub id: String,
    pub entity_id: String,
    pub chapter_id: String,
    /// 行为标签（≤10字，如"秘境获神兵"）
    pub event: String,
    /// 状态变更（如 "dead"），无变更则为 None
    pub status_change: Option<String>,
    pub created_at: String,
}

/// 伏笔
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Foreshadow {
    pub id: String,
    pub description: String,
    /// 埋设章节 ID
    pub plant_chapter_id: Option<String>,
    /// 回收章节 ID
    pub reap_chapter_id: Option<String>,
    /// open / resolved
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

/// L4 剧情弧（每 10 章一段概要）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RagArc {
    pub id: String,
    pub start_chapter_id: String,
    pub end_chapter_id: String,
    /// 剧情概要（80-100字）
    pub summary: String,
    pub created_at: String,
    pub updated_at: String,
}

/// 章节快照（自动保存时创建，滚动保留）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Snapshot {
    pub id: String,
    pub chapter_id: String,
    pub snapshot_content: String,
    pub created_at: String,
}

/// 回收站条目（软删除，30 天后清理）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrashItem {
    pub id: String,
    /// 原始表名（volumes / chapters / entities 等）
    pub original_table: String,
    /// 原始记录 ID
    pub original_id: String,
    /// 完整记录数据 JSON
    pub data_json: String,
    pub deleted_at: String,
    /// user / ai
    pub deleted_by: String,
}
