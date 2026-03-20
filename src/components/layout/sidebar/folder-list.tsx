"use client";

import { FolderItem } from "./folder-item";
import { CreateFolderDialog } from "@/components/folders/create-folder-dialog";
import { useFolders } from "@/hooks/use-folders";
import { Plus } from "lucide-react";

export function FolderList() {
  const { data: folders, isLoading } = useFolders();

  return (
    <div className="px-3">
      <div className="flex items-center justify-between px-3 py-1 mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          Folders
        </span>
        <CreateFolderDialog>
          <button
            className="w-5 h-5 flex items-center justify-center rounded text-text-muted transition-colors hover:bg-muted hover:text-text-secondary"
            aria-label="Create folder"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </CreateFolderDialog>
      </div>

      {isLoading && (
        <div className="space-y-1 px-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && folders?.length === 0 && (
        <p className="text-xs px-3 py-2 italic text-text-muted">
          No folders yet
        </p>
      )}

      <div className="space-y-0.5">
        {!isLoading && folders?.map((folder, i) => (
          <FolderItem key={folder.id} folder={folder} index={i} />
        ))}
      </div>
    </div>
  );
}
