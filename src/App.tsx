import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Titlebar, Sidebar, MainContent, ExtraPanel } from "@/components/layout";
import { useSettingStore } from "@/stores/useSettingStore";
import { AiPanel } from "@/pages/EditorPage/AiPanel";
import { LaunchPage } from "@/pages/LaunchPage";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { AnimatePresence } from "framer-motion";

const appWindow = getCurrentWindow();

const SKIP_LOGIN_KEY = "xinzuo_skip_login";
const TUTORIAL_DONE_KEY = "xinzuo_tutorial_done";

export default function App() {
  const loadSettings = useSettingStore((s) => s.loadSettings);
  const isEditing = useSettingStore((s) => s.editingBookId !== null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [launched, setLaunched] = useState(() => localStorage.getItem(SKIP_LOGIN_KEY) === "1");
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 监听重新查看教程事件
  useEffect(() => {
    const handler = () => setShowTutorial(true);
    window.addEventListener("xinzuo:show-tutorial", handler);
    return () => window.removeEventListener("xinzuo:show-tutorial", handler);
  }, []);

  // F11 全屏切换 / ESC 退出全屏
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault();
        const fs = await appWindow.isFullscreen();
        await appWindow.setFullscreen(!fs);
        setIsFullscreen(!fs);
      }
      if (e.key === "Escape" && isFullscreen) {
        e.preventDefault();
        await appWindow.setFullscreen(false);
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFullscreen]);

  const handleEnter = () => {
    localStorage.setItem(SKIP_LOGIN_KEY, "1");
    setLaunched(true);
    // 首次进入显示教程
    if (localStorage.getItem(TUTORIAL_DONE_KEY) !== "1") {
      setShowTutorial(true);
    }
  };

  const handleTutorialDone = () => {
    localStorage.setItem(TUTORIAL_DONE_KEY, "1");
    setShowTutorial(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {!isFullscreen && <Titlebar />}
      {!launched ? (
        <LaunchPage onEnter={handleEnter} />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <MainContent />
          <ExtraPanel />
          <AnimatePresence>{isEditing && <AiPanel />}</AnimatePresence>
        </div>
      )}
      {showTutorial && <TutorialOverlay onDone={handleTutorialDone} onRestart={() => setShowTutorial(true)} />}
    </div>
  );
}
