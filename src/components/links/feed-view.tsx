"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LinkGrid } from "./link-grid";
import { StatusTabs } from "./status-tabs";
import { AddLinkDialog } from "./add-link-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Tag, X } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useRouter } from "next/navigation";
import type { LinkStatus } from "@/types";

function FeedContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const statusParam = searchParams.get("status") as LinkStatus | null;
  const tagParam = searchParams.get("tag");
  const shareUrl = searchParams.get("shareUrl");

  // Auto-open AddLinkDialog when arriving from Web Share Target
  useEffect(() => {
    if (shareUrl) setAddLinkOpen(true);
  }, [shareUrl]);

  useKeyboardShortcuts({
    onAddLink: () => setAddLinkOpen(true),
    searchInputRef,
  });

  // Tag view — no status tabs, different header
  if (tagParam) {
    return (
      <div className="h-full overflow-auto px-5 py-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand-purple" />
            <h1 className="text-lg font-semibold text-text-primary tracking-tight">{tagParam}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-text-muted hover:text-text-primary h-8 text-xs"
            onClick={() => router.push("/app?status=unread")}
          >
            <X className="w-3 h-3" />
            Clear tag
          </Button>
        </div>
        <LinkGrid
          filters={{ tag: tagParam }}
          search={search}
          emptyMessage={`No links tagged "${tagParam}" yet.`}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto px-5 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          {statusParam === "digested" ? "Digested" : "Yet to Digest"}
        </h1>
        <div className="flex items-center gap-2">
          {/* Search — desktop only */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <Input
              ref={searchInputRef}
              placeholder="Search… (/)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-52 h-8 text-sm bg-card border-border"
            />
          </div>
          {/* Add Link — desktop only (mobile uses bottom nav FAB) */}
          <div className="hidden lg:block">
            <AddLinkDialog open={addLinkOpen} onOpenChange={setAddLinkOpen} defaultUrl={shareUrl ?? undefined}>
              <Button className="bg-brand-purple hover:bg-brand-purple-dark gap-1.5 h-8 text-sm font-medium">
                <Plus className="w-3.5 h-3.5" />
                Add Link
                <kbd className="ml-0.5 text-[10px] opacity-60 font-mono">N</kbd>
              </Button>
            </AddLinkDialog>
          </div>
        </div>
      </div>

      {/* Status tabs */}
      <StatusTabs />

      {/* Link list */}
      <LinkGrid
        filters={{ status: statusParam ?? "unread" }}
        search={search}
      />
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
