"use client";

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
import { useDeleteFolder } from "@/hooks/use-folders";
import { toast } from "sonner";
import type { Folder } from "@/types";

interface DeleteFolderDialogProps {
  folder: Folder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteFolderDialog({
  folder,
  open,
  onOpenChange,
}: DeleteFolderDialogProps) {
  const deleteFolder = useDeleteFolder();

  async function handleDelete() {
    try {
      await deleteFolder.mutateAsync(folder.id);
      toast.success(`Folder "${folder.name}" deleted`);
    } catch {
      toast.error("Failed to delete folder");
    }
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{folder.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This folder will be permanently deleted. Links will become
            unorganized but will not be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
            disabled={deleteFolder.isPending}
          >
            {deleteFolder.isPending ? "Deleting..." : "Delete folder"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
