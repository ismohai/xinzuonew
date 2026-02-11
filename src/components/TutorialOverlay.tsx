import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  PenTool,
  Eye,
  BarChart3,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";

interface TutorialOverlayProps {
  onDone: () => void;
  onRestart?: () => void;
}

const STEPS = [
  {
    icon: PenTool,
    title: "欢迎来到心作",
    description:
      "心作是一款专为网络小说作家打造的写作 IDE。让我们快速了解核心功能，助你开始创作之旅。",
  },
  {
    icon: BookOpen,
    title: "内容管理",
    description:
      "在「内容管理」页面创建和管理你的书籍。每本书拥有独立的分卷和章节结构，支持多层级目录管理。",
  },
  {
    icon: PenTool,
    title: "沉浸式编辑器",
    description:
      "点击书籍进入编辑模式，左侧面板包含目录、设定集和伏笔管理。支持多标签页、自动保存、Ctrl+S 快捷保存。",
  },
  {
    icon: Eye,
    title: "设定集 & 伏笔",
    description:
      "在设定集中管理人物、道具、地点和势力。使用伏笔面板埋设和追踪剧情线索，确保故事完整性。",
  },
  {
    icon: BarChart3,
    title: "写作统计",
    description:
      "实时追踪你的写作进度。查看每日字数、连续写作天数、总字数等统计数据，让创作有据可依。",
  },
  {
    icon: Lightbulb,
    title: "开始创作吧！",
    description:
      "前往「内容管理」创建你的第一本书。你随时可以在设置中重新查看本教程。祝你创作愉快！",
  },
];

/**
 * 大圣归来新手教程 — 全屏 overlay，分步引导，可跳过
 */
export function TutorialOverlay({ onDone }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-md mx-4 bg-card rounded-2xl border border-border shadow-xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* 关闭/跳过按钮 */}
        <button
          onClick={onDone}
          className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors z-10"
          title="跳过教程"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 内容区 */}
        <div className="px-8 pt-10 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              className="flex flex-col items-center text-center gap-4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{current.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {current.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 步骤指示器 + 按钮 */}
        <div className="flex items-center justify-between px-8 pb-6">
          {/* 步骤圆点 */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? "bg-primary" : "bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>

          {/* 导航按钮 */}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                上一步
              </button>
            )}
            <button
              onClick={isLast ? onDone : () => setStep((s) => s + 1)}
              className="flex items-center gap-1 px-4 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {isLast ? "开始创作" : "下一步"}
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
