// ============================================================================
// 页面导航类型
// ============================================================================

/** 主界面 Sidebar 导航页 */
export type PageType = 'content' | 'inspiration' | 'stats' | 'tasks' | 'themes' | 'trash';

/** 右侧滑出面板 */
export type ExtraPanelType = 'updates' | 'about' | 'notifications' | 'settings' | null;

export interface PageConfig {
  id: PageType;
  name: string;
  description: string;
  icon: string; // lucide icon name
}

export interface ExtraPanelConfig {
  id: Exclude<ExtraPanelType, null>;
  title: string;
  subtitle: string;
  index: number;
}

// ============================================================================
// 数据模型（与 Rust 后端对齐）
// ============================================================================

export interface Book {
  id: string;
  name: string;
  author_name: string;
  cover_path: string | null;
  storage_path: string;
  created_at: string;
  updated_at: string;
}

export interface Volume {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Chapter {
  id: string;
  volume_id: string;
  name: string;
  content: string;
  l2_summary: string | null;
  l3_title: string | null;
  status: 'draft' | 'complete' | 'dirty';
  word_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Entity {
  id: string;
  name: string;
  entity_type: 'character' | 'item' | 'location' | 'faction';
  attributes_json: string;
  status: 'alive' | 'dead';
  inbox: boolean;
  first_chapter_id: string | null;
  last_chapter_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Foreshadow {
  id: string;
  description: string;
  plant_chapter_id: string | null;
  reap_chapter_id: string | null;
  status: 'open' | 'resolved';
  created_at: string;
  updated_at: string;
}

export interface DailyStat {
  id: string;
  date: string;
  word_count: number;
  duration_seconds: number;
  daily_goal: number;
}

export interface Snapshot {
  id: string;
  chapter_id: string;
  snapshot_content: string;
  created_at: string;
}

export interface TrashItem {
  id: string;
  original_table: string;
  original_id: string;
  data_json: string;
  deleted_at: string;
  deleted_by: 'user' | 'ai';
}

export interface Setting {
  key: string;
  value: string;
}

/** 编辑器标签页 */
export interface EditorTab {
  chapterId: string;
  chapterName: string;
  volumeId: string;
  dirty: boolean;
}
