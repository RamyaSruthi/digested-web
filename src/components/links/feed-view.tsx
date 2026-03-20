"use client";

import { useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { LinkGrid } from "./link-grid";
import { StatusTabs } from "./status-tabs";
import { AddLinkDialog } from "./add-link-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Tag, X, LayoutGrid, List } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import type { LinkStatus } from "@/types";

function FeedContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const statusParam = searchParams.get("status") as LinkStatus | null;
  const tagParam = searchParams.get("tag");
  const { viewMode, setViewMode } = useUIStore();

  useKeyboardShortcuts({
    onAddLink: () => setAddLinkOpen(true),
    searchInputRef,
  });

  // Tag view — no status tabs, different header
  if (tagParam) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <Tag className="w-5 h-5 text-brand-purple" />
              <h1 className="text-2xl font-semibold text-text-primary">{tagParam}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-text-muted hover:text-text-primary h-9"
                onClick={() => router.push("/app?status=unread")}
              >
                <X className="w-3.5 h-3.5" />
                Clear tag
              </Button>
              <AddLinkDialog open={addLinkOpen} onOpenChange={setAddLinkOpen}>
                <Button className="bg-brand-purple hover:bg-brand-purple-dark gap-2 h-9">
                  <Plus className="w-4 h-4" />
                  Add Link <kbd className="ml-1 text-xs opacity-60 font-mono">N</kbd>
                </Button>
              </AddLinkDialog>
            </div>
          </div>
          <LinkGrid
            filters={{ tag: tagParam }}
            search={search}
            emptyMessage={`No links tagged "${tagParam}" yet.`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-text-primary">
            {statusParam === "digested" ? "Digested" : "Yet to Digest"}
          </h1>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center gap-0.5 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-card shadow-sm text-text-primary" : "text-text-muted hover:text-text-secondary")}
                title="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-card shadow-sm text-text-primary" : "text-text-muted hover:text-text-secondary")}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                ref={searchInputRef}
                placeholder="Search… (/)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-48 h-9 text-sm bg-card"
              />
            </div>
            <AddLinkDialog open={addLinkOpen} onOpenChange={setAddLinkOpen}>
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
          filters={{ status: statusParam ?? "unread" }}
          search={search}
        />
      </div>
    </div>
  );
}

export function FeedView() {
  return (
    <Suspense>
      <FeedContent />
    </Suspense>
  );
}
