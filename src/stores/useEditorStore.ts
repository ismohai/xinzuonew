import { create } from "zustand";
import type { Volume, Chapter, Entity, Foreshadow } from "@/types";
import * as api from "@/api";

interface EditorState {
  // 当前书籍数据路径
  storagePath: string | null;

  // 结构树
  volumes: Volume[];
  chaptersMap: Record<string, Chapter[]>; // volumeId -> chapters

  // 当前编辑
  currentChapterId: string | null;
  currentChapter: Chapter | null;
  dirty: boolean;

  // 设定集 & 伏笔
  entities: Entity[];
  foreshadows: Foreshadow[];

  // ---- actions ----
  setStoragePath: (path: string) => void;

  // 分卷
  fetchVolumes: () => Promise<void>;
  addVolume: (name: string) => Promise<Volume>;
  removeVolume: (id: string) => Promise<void>;

  // 章节
  fetchChapters: (volumeId: string) => Promise<void>;
  openChapter: (id: string) => Promise<void>;
  saveChapter: (content: string) => Promise<void>;
  addChapter: (volumeId: string, name: string) => Promise<Chapter>;
  removeChapter: (id: string) => Promise<void>;
  setDirty: (dirty: boolean) => void;

  // 设定集
  fetchEntities: (entityType?: string) => Promise<void>;
  addEntity: (name: string, entityType: string, attributesJson: string, inbox: boolean) => Promise<Entity>;
  removeEntity: (id: string) => Promise<void>;

  // 伏笔
  fetchForeshadows: () => Promise<void>;
  addForeshadow: (description: string, plantChapterId?: string) => Promise<Foreshadow>;
  removeForeshadow: (id: string) => Promise<void>;

  // 重置
  reset: () => void;
}

const initialState = {
  storagePath: null as string | null,
  volumes: [] as Volume[],
  chaptersMap: {} as Record<string, Chapter[]>,
  currentChapterId: null as string | null,
  currentChapter: null as Chapter | null,
  dirty: false,
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
    const { storagePath } = get();
    if (!storagePath) return;
    const chapter = await api.getChapter(storagePath, id);
    set({ currentChapterId: id, currentChapter: chapter, dirty: false });
  },

  saveChapter: async (content) => {
    const { storagePath, currentChapterId } = get();
    if (!storagePath || !currentChapterId) return;
    await api.updateChapter(storagePath, currentChapterId, content);
    set((s) => ({
      dirty: false,
      currentChapter: s.currentChapter ? { ...s.currentChapter, content } : null,
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

  setDirty: (dirty) => set({ dirty }),

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

  removeForeshadow: async (id) => {
    const { storagePath } = get();
    if (!storagePath) return;
    await api.deleteForeshadow(storagePath, id);
    set((s) => ({ foreshadows: s.foreshadows.filter((f) => f.id !== id) }));
  },

  reset: () => set(initialState),
}));
