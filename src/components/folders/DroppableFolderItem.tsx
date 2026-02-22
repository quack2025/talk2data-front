import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableFolderItemProps {
  id: string;
  isOver?: boolean;
  children: React.ReactNode;
}

export function DroppableFolderItem({
  id,
  children,
}: DroppableFolderItemProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${id}`,
    data: { folderId: id === "all" ? null : id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg transition-all duration-150",
        isOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      {children}
    </div>
  );
}
