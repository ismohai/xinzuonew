import type { ComponentType } from "react";
import { useSettingStore } from "@/stores/useSettingStore";
import type { PageType } from "@/types";
import { ContentManagement } from "@/pages/ContentManagement";
import { InspirationCenter } from "@/pages/InspirationCenter";
import { WritingStats } from "@/pages/WritingStats";
import { TaskCenter } from "@/pages/TaskCenter";
import { ThemeSettings } from "@/pages/ThemeSettings";
import { EditorPage } from "@/pages/EditorPage";
import { AnimatePresence, motion } from "framer-motion";

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
  const Component = PAGE_COMPONENTS[activePage];
  const isEditing = editingBookId !== null;
  const duration = animationDuration / 1000;

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
      <AnimatePresence mode="wait" initial={false}>
        {isEditing ? (
          <motion.div
            key={`editor-${editingBookId}`}
            className="absolute inset-0 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration, ease: "easeInOut" }}
          >
            {editingBookId && <EditorPage bookId={editingBookId} />}
          </motion.div>
        ) : (
          <motion.div
            key={activePage}
            className="absolute inset-0 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration, ease: "easeInOut" }}
          >
            <Component />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
