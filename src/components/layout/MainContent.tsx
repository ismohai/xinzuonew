import type { ComponentType } from "react";
import { useSettingStore } from "@/stores/useSettingStore";
import type { PageType } from "@/types";
import { ContentManagement } from "@/pages/ContentManagement";
import { InspirationCenter } from "@/pages/InspirationCenter";
import { WritingStats } from "@/pages/WritingStats";
import { TaskCenter } from "@/pages/TaskCenter";
import { ThemeSettings } from "@/pages/ThemeSettings";
import { EditorPage } from "@/pages/EditorPage";
import { PageHeader } from "@/components/layout/PageHeader";
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
  const duration = animationDuration / 1000;

  const pageIndex = PAGE_ORDER.indexOf(activePage);
  const direction =
    pageIndex === previousPageIndex ? 0 : pageIndex > previousPageIndex ? 1 : -1;

  // Header animation variants
  // dir > 0 (going down): new header drops from above, covers old
  // dir < 0 (going up):   old header slides up, reveals new underneath
  const headerVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? "-100%" : "0%",
      zIndex: dir > 0 ? 20 : 0,
    }),
    center: (dir: number) => ({
      y: "0%",
      zIndex: 10,
      transition:
        dir > 0
          ? { type: "spring", stiffness: 400, damping: 28 }
          : { duration: 0 },
    }),
    exit: (dir: number) => ({
      y: dir > 0 ? "0%" : "-100%",
      zIndex: dir > 0 ? 0 : 20,
      transition:
        dir > 0 ? { duration: 0 } : { duration, ease: "easeOut" },
    }),
  };

  const handleClick = () => {
    if (extraPanel !== null) {
      setExtraPanel(null);
    }
  };

  return (
    <main
      className="flex-1 flex flex-col min-h-0 min-w-0 bg-background overflow-hidden"
      onClick={handleClick}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isEditing ? (
          <motion.div
            key="editor"
            className="flex-1 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration, ease: "easeInOut" }}
          >
            {editingBookId && <EditorPage bookId={editingBookId} />}
          </motion.div>
        ) : (
          <motion.div
            key="pages"
            className="flex-1 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration, ease: "easeInOut" }}
          >
            {/* 标题栏动画区域 — 落下/收起 */}
            <div className="relative h-14 shrink-0 border-b border-border overflow-hidden">
              <AnimatePresence mode="sync" initial={false} custom={direction}>
                <motion.div
                  key={activePage}
                  className="absolute inset-0 bg-background"
                  custom={direction}
                  variants={headerVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <PageHeader page={activePage} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 内容渐变区域 */}
            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
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
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
