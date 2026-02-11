import { invoke } from "@tauri-apps/api/core";
import type { Book, Volume, Chapter, Entity, Foreshadow, DailyStat, Snapshot, TrashItem, Setting } from "@/types";

// ============================================================================
// 书籍管理
// ============================================================================

export const createBook = (name: string, authorName: string) =>
  invoke<Book>("create_book", { name, authorName });

export const listBooks = () =>
  invoke<Book[]>("list_books");

export const updateBook = (id: string, opts: { name?: string; authorName?: string; coverPath?: string }) =>
  invoke<void>("update_book", { id, ...opts });

export const deleteBook = (id: string) =>
  invoke<void>("delete_book", { id });

// ============================================================================
// 分卷管理
// ============================================================================

export const createVolume = (storagePath: string, name: string) =>
  invoke<Volume>("create_volume", { storagePath, name });

export const listVolumes = (storagePath: string) =>
  invoke<Volume[]>("list_volumes", { storagePath });

export const renameVolume = (storagePath: string, id: string, name: string) =>
  invoke<void>("rename_volume", { storagePath, id, name });

export const reorderVolumes = (storagePath: string, ids: string[]) =>
  invoke<void>("reorder_volumes", { storagePath, ids });

export const deleteVolume = (storagePath: string, id: string) =>
  invoke<void>("delete_volume", { storagePath, id });

// ============================================================================
// 章节管理
// ============================================================================

export const createChapter = (storagePath: string, volumeId: string, name: string) =>
  invoke<Chapter>("create_chapter", { storagePath, volumeId, name });

export const listChapters = (storagePath: string, volumeId: string) =>
  invoke<Chapter[]>("list_chapters", { storagePath, volumeId });

export const getChapter = (storagePath: string, id: string) =>
  invoke<Chapter>("get_chapter", { storagePath, id });

export const updateChapter = (storagePath: string, id: string, content: string) =>
  invoke<void>("update_chapter", { storagePath, id, content });

export const renameChapter = (storagePath: string, id: string, name: string) =>
  invoke<void>("rename_chapter", { storagePath, id, name });

export const reorderChapters = (storagePath: string, ids: string[]) =>
  invoke<void>("reorder_chapters", { storagePath, ids });

export const moveChapter = (storagePath: string, id: string, targetVolumeId: string) =>
  invoke<void>("move_chapter", { storagePath, id, targetVolumeId });

export const deleteChapter = (storagePath: string, id: string) =>
  invoke<void>("delete_chapter", { storagePath, id });

export const setChapterStatus = (storagePath: string, id: string, status: string) =>
  invoke<void>("set_chapter_status", { storagePath, id, status });

// ============================================================================
// 设定集管理
// ============================================================================

export const createEntity = (storagePath: string, name: string, entityType: string, attributesJson: string, inbox: boolean) =>
  invoke<Entity>("create_entity", { storagePath, name, entityType, attributesJson, inbox });

export const listEntities = (storagePath: string, entityType?: string, inboxOnly?: boolean) =>
  invoke<Entity[]>("list_entities", { storagePath, entityType, inboxOnly });

export const getEntity = (storagePath: string, id: string) =>
  invoke<Entity>("get_entity", { storagePath, id });

export const updateEntity = (storagePath: string, id: string, opts: { name?: string; attributesJson?: string; status?: string; inbox?: boolean }) =>
  invoke<void>("update_entity", { storagePath, id, ...opts });

export const deleteEntity = (storagePath: string, id: string) =>
  invoke<void>("delete_entity", { storagePath, id });

// ============================================================================
// 伏笔管理
// ============================================================================

export const createForeshadow = (storagePath: string, description: string, plantChapterId?: string) =>
  invoke<Foreshadow>("create_foreshadow", { storagePath, description, plantChapterId });

export const listForeshadows = (storagePath: string) =>
  invoke<Foreshadow[]>("list_foreshadows", { storagePath });

export const resolveForeshadow = (storagePath: string, id: string, reapChapterId: string) =>
  invoke<void>("resolve_foreshadow", { storagePath, id, reapChapterId });

export const deleteForeshadow = (storagePath: string, id: string) =>
  invoke<void>("delete_foreshadow", { storagePath, id });

// ============================================================================
// 写作统计
// ============================================================================

export const getDailyStats = (startDate: string, endDate: string) =>
  invoke<DailyStat[]>("get_daily_stats", { startDate, endDate });

export const updateDailyStats = (date: string, wordCountDelta: number, durationDelta: number) =>
  invoke<void>("update_daily_stats", { date, wordCountDelta, durationDelta });

export const setDailyGoal = (goal: number) =>
  invoke<void>("set_daily_goal", { goal });

// ============================================================================
// 快照 & 回收站
// ============================================================================

export const listSnapshots = (storagePath: string, chapterId: string) =>
  invoke<Snapshot[]>("list_snapshots", { storagePath, chapterId });

export const restoreSnapshot = (storagePath: string, snapshotId: string) =>
  invoke<void>("restore_snapshot", { storagePath, snapshotId });

export const createMilestone = (storagePath: string, name: string) =>
  invoke<string>("create_milestone", { storagePath, name });

export const listTrash = (storagePath: string) =>
  invoke<TrashItem[]>("list_trash", { storagePath });

export const restoreFromTrash = (storagePath: string, trashId: string) =>
  invoke<void>("restore_from_trash", { storagePath, trashId });

export const cleanExpiredTrash = (storagePath: string, retentionDays: number) =>
  invoke<number>("clean_expired_trash", { storagePath, retentionDays });

// ============================================================================
// 设置
// ============================================================================

export const getSettings = () =>
  invoke<Setting[]>("get_settings");

export const getSetting = (key: string) =>
  invoke<string | null>("get_setting", { key });

export const updateSetting = (key: string, value: string) =>
  invoke<void>("update_setting", { key, value });

export const getDataDir = () =>
  invoke<string>("get_data_dir");

export const setDataDir = (newDir: string) =>
  invoke<void>("set_data_dir", { newDir });

// ============================================================================
// 窗口管理
// ============================================================================

export const minimizeWindow = () => invoke<void>("minimize_window");
export const toggleMaximizeWindow = () => invoke<void>("toggle_maximize_window");
export const closeWindow = () => invoke<void>("close_window");
