import { useEffect, useRef, type ComponentType } from "react";
import { useSettingStore } from "@/stores/useSettingStore";
import type { PageType } from "@/types";
import { ContentManagement } from "@/pages/ContentManagement";
import { InspirationCenter } from "@/pages/InspirationCenter";
import { WritingStats } from "@/pages/WritingStats";
import { TaskCenter } from "@/pages/TaskCenter";
import { ThemeSettings } from "@/pages/ThemeSettings";
import { EditorPage } from "@/pages/EditorPage";
import { AnimatePresence, motion } from "framer-motion";
import { PAGE_ORDER } from "@/constants/navigation";

const PAGE_COMPONENTS: Record<PageType, ComponentType> = {
  content: ContentManagement,
  inspiration: InspirationCenter,
  stats: WritingStats,
  tasks: TaskCenter,
  themes: ThemeSettings,
};

export function MainContent() {
  const activePage = useSettingStore((s) => s.activePage);
  const extraPanel = useSettingStore((s) => s.extraPanel);
  const setExtraPanel = useSettingStore((s) => s.setExtraPanel);
  const animationDuration = useSettingStore((s) => s.animationDuration);
  const editingBookId = useSettingStore((s) => s.editingBookId);
  const previousPageIndex = useSettingStore((s) => s.previousPageIndex);
  const Component = PAGE_COMPONENTS[activePage];
  const isEditing = editingBookId !== null;
  const pageIndex = PAGE_ORDER.indexOf(activePage);
  const pageDirection = pageIndex === previousPageIndex ? 0 : pageIndex > previousPageIndex ? 1 : -1;
  const prevIsEditingRef = useRef(isEditing);
  const editingChanged = prevIsEditingRef.current !== isEditing;
  const direction = editingChanged ? (isEditing ? 1 : -1) : pageDirection;
  const duration = animationDuration / 1000;

  useEffect(() => {
    prevIsEditingRef.current = isEditing;
  }, [isEditing]);

  const handleClick = () => {
    if (extraPanel !== null) {
      setExtraPanel(null);
    }
  };

  return (
    <main
      className="flex-1 flex flex-col min-h-0 min-w-0 bg-background relative overflow-hidden"
      onClick={handleClick}
    >
      <AnimatePresence mode="sync" initial={false} custom={direction}>
        {isEditing ? (
          <motion.div
            key={`editor-${editingBookId}`}
            className="absolute inset-0 flex flex-col"
            custom={direction}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration, ease: "easeInOut" }}
            variants={{
              enter: (dir: number) => ({
                y: dir === 0 ? 0 : dir > 0 ? 24 : -24,
                opacity: 0,
              }),
              center: { y: 0, opacity: 1 },
              exit: (dir: number) => ({
                y: dir === 0 ? 0 : dir > 0 ? -24 : 24,
                opacity: 0,
              }),
            }}
          >
            {editingBookId && <EditorPage bookId={editingBookId} />}
          </motion.div>
        ) : (
          <motion.div
            key={activePage}
            className="absolute inset-0 flex flex-col"
            custom={direction}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration, ease: "easeInOut" }}
            variants={{
              enter: (dir: number) => ({
                y: dir === 0 ? 0 : dir > 0 ? 24 : -24,
                opacity: 0,
              }),
              center: { y: 0, opacity: 1 },
              exit: (dir: number) => ({
                y: dir === 0 ? 0 : dir > 0 ? -24 : 24,
                opacity: 0,
              }),
            }}
          >
            <Component />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
