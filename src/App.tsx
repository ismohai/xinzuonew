import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Titlebar, Sidebar, MainContent, ExtraPanel } from "@/components/layout";
import { useSettingStore } from "@/stores/useSettingStore";
import { AiPanel } from "@/pages/EditorPage/AiPanel";
import { AnimatePresence } from "framer-motion";

const appWindow = getCurrentWindow();

export default function App() {
  const loadSettings = useSettingStore((s) => s.loadSettings);
  const isEditing = useSettingStore((s) => s.editingBookId !== null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {!isFullscreen && <Titlebar />}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent />
        <ExtraPanel />
        <AnimatePresence>{isEditing && <AiPanel />}</AnimatePresence>
      </div>
    </div>
  );
}
