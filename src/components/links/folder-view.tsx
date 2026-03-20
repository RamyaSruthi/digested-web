"use client";

import { useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { LinkGrid } from "./link-grid";
import { StatusTabs } from "./status-tabs";
import { AddLinkDialog } from "./add-link-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { LinkStatus, FolderWithCount } from "@/types";

interface FolderViewProps {
  folder: FolderWithCount;
}

function FolderContent({ folder }: FolderViewProps) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const statusParam = searchParams.get("status") as LinkStatus | null;

  useKeyboardShortcuts({
    onAddLink: () => setAddLinkOpen(true),
    searchInputRef,
  });

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: folder.color }}
            />
            <h1 className="text-2xl font-semibold text-text-primary">
              {folder.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                ref={searchInputRef}
                placeholder="Search… (/)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-48 h-9 text-sm bg-white"
              />
            </div>
            <AddLinkDialog defaultFolderId={folder.id} open={addLinkOpen} onOpenChange={setAddLinkOpen}>
              <Button className="bg-brand-purple hover:bg-brand-purple-dark gap-2 h-9">
                <Plus className="w-4 h-4" />
                Add Link <kbd className="ml-1 text-xs opacity-60 font-mono">N</kbd>
              </Button>
            </AddLinkDialog>
          </div>
        </div>

        {/* Status tabs */}
        <StatusTabs />

        {/* Grid */}
        <LinkGrid
          filters={{
            folder_id: folder.id,
            status: statusParam ?? "unread",
          }}
          search={search}
          emptyMessage="No links in this folder yet."
        />
      </div>
    </div>
  );
}

export function FolderView({ folder }: FolderViewProps) {
  return (
    <Suspense>
      <FolderContent folder={folder} />
    </Suspense>
  );
}
