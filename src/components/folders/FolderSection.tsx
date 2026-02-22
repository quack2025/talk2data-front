import { useState, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus, Folder, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DroppableFolderItem } from "./DroppableFolderItem";

const FOLDER_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#64748b",
];

export interface ProjectFolder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface FolderSectionProps {
  collapsed: boolean;
  selectedFolderId: string | null; // null = "All", "unorganized" = no folder
  onSelectFolder: (folderId: string | null) => void;
  projectCounts: Record<string, number>; // folder_id -> count, "unorganized" -> count without folder
  totalCount: number;
}

export function FolderSection({
  collapsed,
  selectedFolderId,
  onSelectFolder,
  projectCounts,
  totalCount,
}: FolderSectionProps) {
  const { t } = useLanguage();
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<ProjectFolder | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState(FOLDER_COLORS[0]);

  // Fetch folders
  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from("project_folders")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setFolders((data as ProjectFolder[]) ?? []);
    } catch (err) {
      console.error("Error fetching folders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!folderName.trim()) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return;

      const { error } = await supabase.from("project_folders").insert({
        user_id: session.session.user.id,
        name: folderName.trim(),
        color: folderColor,
        sort_order: folders.length,
      });

      if (error) throw error;

      toast.success(t.folders?.create ?? "Folder created");
      setCreateDialogOpen(false);
      setFolderName("");
      setFolderColor(FOLDER_COLORS[0]);
      fetchFolders();
    } catch (err) {
      console.error("Error creating folder:", err);
      toast.error("Error");
    }
  };

  const handleRename = async () => {
    if (!selectedFolder || !folderName.trim()) return;

    try {
      const { error } = await supabase
        .from("project_folders")
        .update({ name: folderName.trim(), color: folderColor })
        .eq("id", selectedFolder.id);

      if (error) throw error;

      toast.success(t.folders?.rename ?? "Folder renamed");
      setEditDialogOpen(false);
      setSelectedFolder(null);
      setFolderName("");
      fetchFolders();
    } catch (err) {
      console.error("Error renaming folder:", err);
      toast.error("Error");
    }
  };

  const handleDelete = async () => {
    if (!selectedFolder) return;

    try {
      const { error } = await supabase
        .from("project_folders")
        .delete()
        .eq("id", selectedFolder.id);

      if (error) throw error;

      toast.success(t.common?.delete ?? "Deleted");
      setDeleteDialogOpen(false);
      setSelectedFolder(null);

      // If the deleted folder was selected, reset to "All"
      if (selectedFolderId === selectedFolder.id) {
        onSelectFolder(null);
      }

      fetchFolders();
    } catch (err) {
      console.error("Error deleting folder:", err);
      toast.error("Error");
    }
  };

  const openEdit = (folder: ProjectFolder) => {
    setSelectedFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
    setEditDialogOpen(true);
  };

  const openDelete = (folder: ProjectFolder) => {
    setSelectedFolder(folder);
    setDeleteDialogOpen(true);
  };

  const unorganizedCount = projectCounts["unorganized"] ?? 0;

  // Collapsed mode
  if (collapsed) {
    return (
      <div className="space-y-1 py-1">
        {/* All */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onSelectFolder(null)}
              className={cn(
                "flex items-center justify-center w-full rounded-lg px-3 py-2 transition-smooth",
                selectedFolderId === null
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Folder className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {t.folders?.all ?? "All"} ({totalCount})
          </TooltipContent>
        </Tooltip>

        {/* User folders */}
        {folders.map((folder) => (
          <Tooltip key={folder.id} delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelectFolder(folder.id)}
                className={cn(
                  "flex items-center justify-center w-full rounded-lg px-3 py-2 transition-smooth",
                  selectedFolderId === folder.id
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: folder.color }}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {folder.name} ({projectCounts[folder.id] ?? 0})
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Unorganized */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onSelectFolder("unorganized")}
              className={cn(
                "flex items-center justify-center w-full rounded-lg px-3 py-2 transition-smooth",
                selectedFolderId === "unorganized"
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {t.folders?.unorganized ?? "No folder"} ({unorganizedCount})
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  // Expanded mode
  return (
    <>
      <div className="space-y-1">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            {t.folders?.title ?? "Folders"}
          </span>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-sidebar-foreground/50 hover:text-sidebar-foreground"
                onClick={() => {
                  setFolderName("");
                  setFolderColor(FOLDER_COLORS[0]);
                  setCreateDialogOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {t.folders?.create ?? "New Folder"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* All */}
        <DroppableFolderItem id="all" isOver={false}>
          <button
            onClick={() => onSelectFolder(null)}
            className={cn(
              "flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-smooth",
              selectedFolderId === null
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Folder className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left truncate">
              {t.folders?.all ?? "All"}
            </span>
            <Badge
              variant="secondary"
              className="h-5 min-w-[20px] px-1.5 text-[10px] font-medium"
            >
              {totalCount}
            </Badge>
          </button>
        </DroppableFolderItem>

        {/* User folders */}
        {folders.map((folder) => (
          <DroppableFolderItem key={folder.id} id={folder.id} isOver={false}>
            <div className="group flex items-center">
              <button
                onClick={() => onSelectFolder(folder.id)}
                className={cn(
                  "flex items-center gap-3 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-smooth min-w-0",
                  selectedFolderId === folder.id
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: folder.color }}
                />
                <span className="flex-1 text-left truncate">{folder.name}</span>
                <Badge
                  variant="secondary"
                  className="h-5 min-w-[20px] px-1.5 text-[10px] font-medium"
                >
                  {projectCounts[folder.id] ?? 0}
                </Badge>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-sidebar-foreground/50 hover:text-sidebar-foreground"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => openEdit(folder)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    {t.folders?.rename ?? "Rename Folder"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => openDelete(folder)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    {t.common?.delete ?? "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DroppableFolderItem>
        ))}

        {/* Unorganized */}
        <button
          onClick={() => onSelectFolder("unorganized")}
          className={cn(
            "flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-smooth",
            selectedFolderId === "unorganized"
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
        >
          <div className="w-3 h-3 rounded-full bg-muted-foreground/30 shrink-0" />
          <span className="flex-1 text-left truncate">
            {t.folders?.unorganized ?? "No folder"}
          </span>
          <Badge
            variant="secondary"
            className="h-5 min-w-[20px] px-1.5 text-[10px] font-medium"
          >
            {unorganizedCount}
          </Badge>
        </button>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t.folders?.create ?? "New Folder"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t.folders?.namePlaceholder ?? "Folder name"}</Label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder={t.folders?.namePlaceholder ?? "Folder name"}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.folders?.color ?? "Color"}</Label>
              <div className="flex gap-2 flex-wrap">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFolderColor(color)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all",
                      folderColor === color
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t.common?.cancel ?? "Cancel"}
            </Button>
            <Button onClick={handleCreate} disabled={!folderName.trim()}>
              {t.common?.create ?? "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t.folders?.rename ?? "Rename Folder"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t.folders?.namePlaceholder ?? "Folder name"}</Label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder={t.folders?.namePlaceholder ?? "Folder name"}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.folders?.color ?? "Color"}</Label>
              <div className="flex gap-2 flex-wrap">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFolderColor(color)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all",
                      folderColor === color
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t.common?.cancel ?? "Cancel"}
            </Button>
            <Button onClick={handleRename} disabled={!folderName.trim()}>
              {t.common?.save ?? "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {(t.folders?.deleteTitle ?? 'Delete "{name}"?').replace(
                "{name}",
                selectedFolder?.name ?? ""
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.folders?.deleteDescription ??
                "Projects in this folder will not be deleted, just ungrouped."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common?.cancel ?? "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common?.delete ?? "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
