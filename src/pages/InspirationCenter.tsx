import { Lightbulb } from "lucide-react";

export function InspirationCenter() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
      <Lightbulb className="w-16 h-16 opacity-20 mb-4" />
      <p className="text-lg mb-1">灵感稍纵即逝</p>
      <p className="text-sm">随时记录你的想法，它们将在这里等你回来</p>
    </div>
  );
}
