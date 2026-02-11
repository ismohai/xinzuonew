import { create } from "zustand";
import type { Volume, Chapter, Entity, Foreshadow, EditorTab } from "@/types";
import * as api from "@/api";

interface EditorState {
  // 当前书籍数据路径
  storagePath: string | null;

  // 结构树
  volumes: Volume[];
  chaptersMap: Record<string, Chapter[]>; // volumeId -> chapters

  // 多标签页
  tabs: EditorTab[];
  activeTabId: string | null; // chapterId of active tab

  // 当前编辑
  currentChapterId: string | null;
  currentChapter: Chapter | null;
  dirty: boolean;
  liveWordCount: number; // 实时字数（编辑中）

  // 设定集 & 伏笔
  entities: Entity[];
  foreshadows: Foreshadow[];

  // ---- actions ----
  setStoragePath: (path: string) => void;

  // 分卷
  fetchVolumes: () => Promise<void>;
  addVolume: (name: string) => Promise<Volume>;
  renameVolume: (id: string, name: string) => Promise<void>;
  removeVolume: (id: string) => Promise<void>;

  // 章节
  fetchChapters: (volumeId: string) => Promise<void>;
  openChapter: (id: string) => Promise<void>;
  saveChapter: (content: string) => Promise<void>;
  addChapter: (volumeId: string, name: string) => Promise<Chapter>;
  renameChapter: (id: string, name: string) => Promise<void>;
  setChapterStatus: (id: string, status: string) => Promise<void>;
  removeChapter: (id: string) => Promise<void>;
  setDirty: (dirty: boolean) => void;
  setLiveWordCount: (count: number) => void;

  // 标签页
  switchTab: (chapterId: string, currentContent?: string) => Promise<void>;
  closeTab: (chapterId: string, currentContent?: string) => Promise<void>;
  closeOtherTabs: (chapterId: string) => void;
  markTabDirty: (chapterId: string, dirty: boolean) => void;

  // 设定集
  fetchEntities: (entityType?: string) => Promise<void>;
  addEntity: (name: string, entityType: string, attributesJson: string, inbox: boolean) => Promise<Entity>;
  updateEntity: (id: string, opts: { name?: string; attributesJson?: string; status?: string; inbox?: boolean }) => Promise<void>;
  removeEntity: (id: string) => Promise<void>;

  // 伏笔
  fetchForeshadows: () => Promise<void>;
  addForeshadow: (description: string, plantChapterId?: string) => Promise<Foreshadow>;
  resolveForeshadow: (id: string, reapChapterId: string) => Promise<void>;
  removeForeshadow: (id: string) => Promise<void>;

  // 重置
  reset: () => void;
}

const initialState = {
  storagePath: null as string | null,
  volumes: [] as Volume[],
  chaptersMap: {} as Record<string, Chapter[]>,
  tabs: [] as EditorTab[],
  activeTabId: null as string | null,
  currentChapterId: null as string | null,
  currentChapter: null as Chapter | null,
  dirty: false,
  liveWordCount: 0,
  entities: [] as Entity[],
  foreshadows: [] as Foreshadow[],
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,

  setStoragePath: (path) => set({ storagePath: path }),

  // ---- 分卷 ----
  fetchVolumes: async () => {
    const { storagePath } = get();
    if (!storagePath) return;
    const volumes = await api.listVolumes(storagePath);
    set({ volumes });
  },

  addVolume: async (name) => {
    const { storagePath } = get();
    if (!storagePath) throw new Error("No storage path");
    const vol = await api.createVolume(storagePath, name);
    set((s) => ({ volumes: [...s.volumes, vol] }));
    return vol;
  },

  renameVolume: async (id, name) => {
    const { storagePath } = get();
    if (!storagePath) return;
    await api.renameVolume(storagePath, id, name);
    set((s) => ({
      volumes: s.volumes.map((v) => (v.id === id ? { ...v, name } : v)),
    }));
  },

  removeVolume: async (id) => {
    const { storagePath } = get();
    if (!storagePath) return;
    await api.deleteVolume(storagePath, id);
    set((s) => ({
      volumes: s.volumes.filter((v) => v.id !== id),
      chaptersMap: { ...s.chaptersMap, [id]: [] },
    }));
  },

  // ---- 章节 ----
  fetchChapters: async (volumeId) => {
    const { storagePath } = get();
    if (!storagePath) return;
    const chapters = await api.listChapters(storagePath, volumeId);
    set((s) => ({ chaptersMap: { ...s.chaptersMap, [volumeId]: chapters } }));
  },

  openChapter: async (id) => {
    const { storagePath, tabs } = get();
    if (!storagePath) return;
    const chapter = await api.getChapter(storagePath, id);
    // 如果标签页不存在则新增
    const exists = tabs.find((t) => t.chapterId === id);
    const newTabs = exists
      ? tabs
      : [
          ...tabs,
          {
            chapterId: id,
            chapterName: chapter.name,
            volumeId: chapter.volume_id,
            dirty: false,
          },
        ];
    set({
      tabs: newTabs,
      activeTabId: id,
      currentChapterId: id,
      currentChapter: chapter,
      dirty: false,
    });
  },

  saveChapter: async (content) => {
    const { storagePath, currentChapterId } = get();
    if (!storagePath || !currentChapterId) return;
    const wordCount = content.length;
    await api.updateChapter(storagePath, currentChapterId, content);
    set((s) => ({
      dirty: false,
      tabs: s.tabs.map((t) =>
        t.chapterId === currentChapterId ? { ...t, dirty: false } : t
      ),
      currentChapter: s.currentChapter
        ? { ...s.currentChapter, content, word_count: wordCount }
        : null,
      liveWordCount: wordCount,
    }));
  },

  addChapter: async (volumeId, name) => {
    const { storagePath } = get();
    if (!storagePath) throw new Error("No storage path");
    const ch = await api.createChapter(storagePath, volumeId, name);
    set((s) => ({
      chaptersMap: {
        ...s.chaptersMap,
        [volumeId]: [...(s.chaptersMap[volumeId] || []), ch],
      },
    }));
    return ch;
  },

  renameChapter: async (id, name) => {
    const { storagePath } = get();
    if (!storagePath) return;
    await api.renameChapter(storagePath, id, name);
    set((s) => {
      const newMap = { ...s.chaptersMap };
      for (const vid of Object.keys(newMap)) {
        newMap[vid] = newMap[vid].map((c) => (c.id === id ? { ...c, name } : c));
      }
      return {
        chaptersMap: newMap,
        tabs: s.tabs.map((t) => (t.chapterId === id ? { ...t, chapterName: name } : t)),
        currentChapter: s.currentChapter?.id === id ? { ...s.currentChapter, name } : s.currentChapter,
      };
    });
  },

  setChapterStatus: async (id, status) => {
    const { storagePath } = get();
    if (!storagePath) return;
    await api.setChapterStatus(storagePath, id, status);
    set((s) => {
      const newMap = { ...s.chaptersMap };
      for (const vid of Object.keys(newMap)) {
        newMap[vid] = newMap[vid].map((c) => (c.id === id ? { ...c, status: status as Chapter['status'] } : c));
      }
      return {
        chaptersMap: newMap,
        currentChapter: s.currentChapter?.id === id ? { ...s.currentChapter, status: status as Chapter['status'] } : s.currentChapter,
      };
    });
  },

  removeChapter: async (id) => {
    const { storagePath } = get();
    if (!storagePath) return;
    await api.deleteChapter(storagePath, id);
    set((s) => {
      const newMap = { ...s.chaptersMap };
      for (const vid of Object.keys(newMap)) {
        newMap[vid] = newMap[vid].filter((c) => c.id !== id);
      }
      return {
        chaptersMap: newMap,
        currentChapterId: s.currentChapterId === id ? null : s.currentChapterId,
        currentChapter: s.currentChapterId === id ? null : s.currentChapter,
      };
    });
  },

  setDirty: (dirty) =>
    set((s) => ({
      dirty,
      tabs: s.tabs.map((t) =>
        t.chapterId === s.currentChapterId ? { ...t, dirty } : t
      ),
    })),

  setLiveWordCount: (count) => set({ liveWordCount: count }),

  // ---- 标签页 ----
  switchTab: async (chapterId, currentContent) => {
    const { storagePath, activeTabId, dirty } = get();
    if (!storagePath || chapterId === activeTabId) return;
    // 切换前自动保存
    if (dirty && currentContent !== undefined) {
      await get().saveChapter(currentContent);
    }
    const chapter = await api.getChapter(storagePath, chapterId);
    set({
      activeTabId: chapterId,
      currentChapterId: chapterId,
      currentChapter: chapter,
      dirty: false,
      liveWordCount: chapter.content?.length ?? 0,
    });
  },

  closeTab: async (chapterId, currentContent) => {
    const { storagePath, dirty, activeTabId, tabs } = get();
    // 如果关闭的是当前标签且有未保存内容，先保存
    if (activeTabId === chapterId && dirty && currentContent !== undefined && storagePath) {
      await get().saveChapter(currentContent);
    }
    const newTabs = tabs.filter((t) => t.chapterId !== chapterId);
    if (activeTabId === chapterId) {
      const idx = tabs.findIndex((t) => t.chapterId === chapterId);
      const next = newTabs[Math.min(idx, newTabs.length - 1)];
      if (next && storagePath) {
        // 自动加载下一个标签的章节
        const chapter = await api.getChapter(storagePath, next.chapterId);
        set({
          tabs: newTabs,
          activeTabId: next.chapterId,
          currentChapterId: next.chapterId,
          currentChapter: chapter,
          dirty: false,
          liveWordCount: chapter.content?.length ?? 0,
        });
      } else {
        set({
          tabs: newTabs,
          activeTabId: null,
          currentChapterId: null,
          currentChapter: null,
          dirty: false,
          liveWordCount: 0,
        });
      }
    } else {
      set({ tabs: newTabs });
    }
  },

  closeOtherTabs: (chapterId) =>
    set((s) => ({
      tabs: s.tabs.filter((t) => t.chapterId === chapterId),
    })),

  markTabDirty: (chapterId, dirty) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.chapterId === chapterId ? { ...t, dirty } : t
      ),
    })),

  // ---- 设定集 ----
  fetchEntities: async (entityType) => {
    const { storagePath } = get();
    if (!storagePath) return;
    const entities = await api.listEntities(storagePath, entityType);
    set({ entities });
  },

  addEntity: async (name, entityType, attributesJson, inbox) => {
    const { storagePath } = get();
    if (!storagePath) throw new Error("No storage path");
    const entity = await api.createEntity(storagePath, name, entityType, attributesJson, inbox);
    set((s) => ({ entities: [...s.entities, entity] }));
    return entity;
  },

  updateEntity: async (id, opts) => {
    const { storagePath } = get();
    if (!storagePath) return;
    await api.updateEntity(storagePath, id, opts);
    set((s) => ({
      entities: s.entities.map((e) =>
        e.id === id
          ? {
              ...e,
              ...(opts.name !== undefined && { name: opts.name }),
              ...(opts.attributesJson !== undefined && { attributes_json: opts.attributesJson }),
              ...(opts.status !== undefined && { status: opts.status as Entity['status'] }),
              ...(opts.inbox !== undefined && { inbox: opts.inbox }),
            }
          : e
      ),
    }));
  },

  removeEntity: async (id) => {
    const { storagePath } = get();
    if (!storagePath) return;
    await api.deleteEntity(storagePath, id);
    set((s) => ({ entities: s.entities.filter((e) => e.id !== id) }));
  },

  // ---- 伏笔 ----
  fetchForeshadows: async () => {
    const { storagePath } = get();
    if (!storagePath) return;
    const foreshadows = await api.listForeshadows(storagePath);
    set({ foreshadows });
  },

  addForeshadow: async (description, plantChapterId) => {
    const { storagePath } = get();
    if (!storagePath) throw new Error("No storage path");
    const f = await api.createForeshadow(storagePath, description, plantChapterId);
    set((s) => ({ foreshadows: [...s.foreshadows, f] }));
    return f;
  },

  resolveForeshadow: async (id, reapChapterId) => {
    const { storagePath } = get();
    if (!storagePath) return;
    await api.resolveForeshadow(storagePath, id, reapChapterId);
    set((s) => ({
      foreshadows: s.foreshadows.map((f) =>
        f.id === id ? { ...f, status: 'resolved' as const, reap_chapter_id: reapChapterId } : f
      ),
    }));
  },

  removeForeshadow: async (id) => {
    const { storagePath } = get();
    if (!storagePath) return;
    await api.deleteForeshadow(storagePath, id);
    set((s) => ({ foreshadows: s.foreshadows.filter((f) => f.id !== id) }));
  },

  reset: () => set(initialState),
}));
