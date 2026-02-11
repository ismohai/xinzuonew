import { useState } from "react";
import { useBookStore } from "@/stores/useBookStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBookDialog({ open, onOpenChange }: Props) {
  const addBook = useBookStore((s) => s.addBook);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await addBook(name.trim(), description.trim() || "佚名");
      setName("");
      setDescription("");
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to create book:", err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none transition-colors focus:border-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新建书籍</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">书名</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入书名"
              className={inputClass}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">
              简介 <span className="text-muted-foreground/50 text-xs">（可选）</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入简介"
              className={`${inputClass} min-h-[100px] resize-none`}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || loading}>
            {loading ? "创建中..." : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
