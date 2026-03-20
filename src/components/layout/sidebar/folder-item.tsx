"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { RenameFolderInput } from "@/components/folders/rename-folder-input";
import { DeleteFolderDialog } from "@/components/folders/delete-folder-dialog";
import { cn } from "@/lib/utils";
import type { FolderWithCount } from "@/types";

interface FolderItemProps {
  folder: FolderWithCount;
  index: number;
}

export function FolderItem({ folder, index }: FolderItemProps) {
  const pathname = usePathname();
  const isActive = pathname === `/folder/${folder.id}`;
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (isRenaming) {
    return (
      <div className="px-3 py-0.5">
        <RenameFolderInput folder={folder} onDone={() => setIsRenaming(false)} />
      </div>
    );
  }

  return (
    <>
      <div>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Link
              href={`/folder/${folder.id}`}
              onDoubleClick={(e) => { e.preventDefault(); setIsRenaming(true); }}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150",
                isActive
                  ? "bg-brand-purple-light/60 text-brand-purple font-medium"
                  : "text-text-secondary hover:bg-muted hover:text-text-primary"
              )}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: folder.color }}
              />
              <span className="truncate flex-1">{folder.name}</span>
              {folder.link_count > 0 && (
                <span className={cn("text-[11px] tabular-nums flex-shrink-0", isActive ? "text-brand-purple/60" : "text-text-muted")}>
                  {folder.link_count}
                </span>
              )}
            </Link>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-40">
            <ContextMenuItem onClick={() => setIsRenaming(true)}>Rename</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>

      <DeleteFolderDialog
        folder={folder}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  );
}
