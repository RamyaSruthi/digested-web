"use client";

import Link from "next/link";
import { useFolders } from "@/hooks/use-folders";
import { CreateFolderDialog } from "@/components/folders/create-folder-dialog";
import { Plus, FolderOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FoldersPage() {
  const { data: folders, isLoading } = useFolders();

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-text-primary">Folders</h1>
          <CreateFolderDialog>
            <Button size="sm" className="bg-brand-purple hover:bg-brand-purple-dark gap-1.5 h-9">
              <Plus className="w-4 h-4" />
              New Folder
            </Button>
          </CreateFolderDialog>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && folders?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-purple-light flex items-center justify-center mb-4">
              <FolderOpen className="w-6 h-6 text-brand-purple" />
            </div>
            <p className="text-sm font-semibold text-text-primary">No folders yet</p>
            <p className="text-xs text-text-muted mt-1.5">Create a folder to organise your links</p>
          </div>
        )}

        {/* Folder list */}
        {!isLoading && folders && folders.length > 0 && (
          <div className="space-y-2">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                href={`/folder/${folder.id}`}
                className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border active:bg-muted transition-colors"
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: folder.color }}
                />
                <span className="flex-1 text-sm font-medium text-text-primary">{folder.name}</span>
                <span className="text-xs text-text-muted tabular-nums">
                  {folder.link_count} {folder.link_count === 1 ? "link" : "links"}
                </span>
                <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
