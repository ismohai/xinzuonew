import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, MousePointerClick } from "lucide-react";
import * as api from "@/api";
import { useBookStore } from "@/stores/useBookStore";
import { useSettingStore } from "@/stores/useSettingStore";
import { useEditorStore } from "@/stores/useEditorStore";

interface TutorialOverlayProps {
  onDone: () => void;
  onRestart?: () => void;
}

const TUTORIAL_BOOK_NAME = "大圣归来";
const TUTORIAL_AUTHOR = "教程助手";

interface TutorialStep {
  title: string;
  instruction: string;
  /** 步骤类型: auto=自动执行, click=用户点击下一步, wait=等待用户在 UI 操作 */
  type: "auto" | "click";
  /** 指示框位置: top/center/bottom */
  position?: "top" | "center" | "bottom";
}

const STEPS: TutorialStep[] = [
  {
    title: "欢迎来到心作 ✨",
    instruction: "心作是专为网络小说作家打造的写作 IDE。\n接下来我们将通过创建一本示范书籍来体验核心功能。",
    type: "click",
    position: "center",
  },
  {
    title: "创建示范书籍",
    instruction: "正在为你创建示范书籍《大圣归来》...",
    type: "auto",
    position: "center",
  },
  {
    title: "书架",
    instruction: "书籍已创建！这里是「内容管理」页面，你的所有书籍都会显示在这里。\n现在我们打开这本书进入编辑模式。",
    type: "auto",
    position: "center",
  },
  {
    title: "编辑器 — 左侧目录",
    instruction: "这是编辑模式。左侧是目录面板，已自动创建了分卷和章节。\n你可以在「目录」标签下新建分卷、添加章节，右键可重命名/删除。",
    type: "click",
    position: "bottom",
  },
  {
    title: "编辑器 — 设定集",
    instruction: "切换到「设定」标签，可以管理人物、道具、地点、势力。\n点击右上角 + 新建条目，点击条目可打开详情卡片填写资料。",
    type: "click",
    position: "bottom",
  },
  {
    title: "编辑器 — 伏笔",
    instruction: "切换到「伏笔」标签，可以埋设和追踪伏笔。\n点击 + 埋伏笔，点击圆圈图标可收伏笔，确保故事线索不遗漏。",
    type: "click",
    position: "bottom",
  },
  {
    title: "写作区",
    instruction: "中间是沉浸式编辑器。支持 Ctrl+S 保存、自动保存、多标签页。\n底部状态栏显示实时字数。尽情写作吧！",
    type: "click",
    position: "center",
  },
  {
    title: "其他功能",
    instruction: "左侧导航栏还有灵感中心、写作统计、任务中心、主题设置、回收站。\n底部四个按钮可打开通知、更新、关于和设置面板。",
    type: "click",
    position: "center",
  },
  {
    title: "教程完成 🎉",
    instruction: "恭喜你完成了新手教程！\n示范书籍《大圣归来》将被清理，你可以开始创建自己的作品了。\n在设置中可以随时重新查看教程。",
    type: "click",
    position: "center",
  },
];

/**
 * 大圣归来交互式教程 — 创建示范书籍，一步步引导用户操作
 */
export function TutorialOverlay({ onDone }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const [tutorialBookId, setTutorialBookId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fetchBooks = useBookStore((s) => s.fetchBooks);
  const setActivePage = useSettingStore((s) => s.setActivePage);
  const setEditingBookId = useSettingStore((s) => s.setEditingBookId);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // 步骤 1: 自动创建示范书籍
  useEffect(() => {
    if (step === 1 && !tutorialBookId) {
      (async () => {
        setBusy(true);
        try {
          const book = await api.createBook(TUTORIAL_BOOK_NAME, TUTORIAL_AUTHOR);
          setTutorialBookId(book.id);
          // 创建示范分卷和章节
          const vol = await api.createVolume(book.storage_path, "第一卷 初入江湖");
          const ch = await api.createChapter(book.storage_path, vol.id, "第一章 大梦初醒");
          await api.updateChapter(book.storage_path, ch.id, "夜色深沉，少年缓缓睡开双眼，发现自己身处一片陌生的世界...");
          await api.createChapter(book.storage_path, vol.id, "第二章 神秘的传承");
          await fetchBooks();
          // 小延迟后自动进入下一步
          setTimeout(() => setStep(2), 800);
        } catch (err) {
          console.error("创建教程书籍失败:", err);
        } finally {
          setBusy(false);
        }
      })();
    }
  }, [step, tutorialBookId, fetchBooks]);

  // 步骤 2: 自动打开书籍进入编辑
  useEffect(() => {
    if (step === 2 && tutorialBookId) {
      setActivePage("content");
      const timer = setTimeout(() => {
        setStep(3);
        setEditingBookId(tutorialBookId);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, tutorialBookId, setActivePage, setEditingBookId]);

  // 完成教程: 清理示范书籍
  const handleDone = useCallback(async () => {
    if (tutorialBookId) {
      setEditingBookId(null);
      try {
        // 先软删除再永久删除
        await api.deleteBook(tutorialBookId);
        await api.permanentlyDeleteBook(tutorialBookId);
      } catch { /* 忽略清理错误 */ }
      await fetchBooks();
    }
    onDone();
  }, [tutorialBookId, onDone, setEditingBookId, fetchBooks]);

  // 跳过教程: 同样清理
  const handleSkip = handleDone;

  const handleNext = () => {
    if (isLast) {
      handleDone();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 半透明背景 */}
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" />

      {/* 指引卡片 */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 pointer-events-auto ${
          current.position === "top"
            ? "top-20"
            : current.position === "bottom"
            ? "bottom-20"
            : "top-1/2 -translate-y-1/2"
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="w-[380px] bg-card rounded-xl border border-border shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {step + 1}/{STEPS.length}
                </span>
                <h3 className="text-sm font-semibold text-foreground">{current.title}</h3>
              </div>
              <button
                onClick={handleSkip}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="跳过教程"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 内容 */}
            <div className="px-5 pb-4">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {current.instruction}
              </p>
            </div>

            {/* 操作栏 */}
            {current.type === "click" && (
              <div className="flex items-center justify-between px-5 pb-4">
                {/* 步骤圆点 */}
                <div className="flex items-center gap-1">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        i === step ? "bg-primary" : i < step ? "bg-primary/40" : "bg-muted-foreground/20"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-4 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {isLast ? "完成教程" : "下一步"}
                  {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* 自动步骤加载指示 */}
            {current.type === "auto" && (
              <div className="flex items-center justify-center px-5 pb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MousePointerClick className="w-3.5 h-3.5 animate-pulse" />
                  请稍候...
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
