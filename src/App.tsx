import { useEffect } from "react";
import { Titlebar, Sidebar, MainContent, ExtraPanel } from "@/components/layout";
import { useSettingStore } from "@/stores/useSettingStore";
import { AiPanel } from "@/pages/EditorPage/AiPanel";
import { AnimatePresence } from "framer-motion";


export default function App() {
  const loadSettings = useSettingStore((s) => s.loadSettings);
  const isEditing = useSettingStore((s) => s.editingBookId !== null);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // F11 全屏切换 (xinzuo App.tsx)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault();
        document.documentElement.requestFullscreen?.() ??
          document.exitFullscreen?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <Titlebar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent />
        <ExtraPanel />
        <AnimatePresence>{isEditing && <AiPanel />}</AnimatePresence>
      </div>
    </div>
  );
}
