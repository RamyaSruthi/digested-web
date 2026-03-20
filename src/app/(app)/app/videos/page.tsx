"use client";

import { useState, Suspense, useRef } from "react";
import { PlayCircle, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddLinkDialog } from "@/components/links/add-link-dialog";
import { LinkGrid } from "@/components/links/link-grid";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LinkStatus } from "@/types";

const TABS: { label: string; value: LinkStatus }[] = [
  { label: "Yet to Digest", value: "unread" },
  { label: "Digested",     value: "digested" },
];

function VideosContent() {
  const [search, setSearch] = useState("");
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState<LinkStatus>("unread");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcuts({ onAddLink: () => setAddLinkOpen(true), searchInputRef });

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <PlayCircle className="w-5 h-5 text-brand-purple" />
            <h1 className="text-2xl font-semibold text-text-primary">Videos</h1>
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
            <AddLinkDialog open={addLinkOpen} onOpenChange={setAddLinkOpen}>
              <Button className="bg-brand-purple hover:bg-brand-purple-dark gap-2 h-9">
                <Plus className="w-4 h-4" />
                Add Link <kbd className="ml-1 text-xs opacity-60 font-mono">N</kbd>
              </Button>
            </AddLinkDialog>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
          {TABS.map(({ label, value }) => {
            const isActive = activeStatus === value;
            return (
              <button
                key={value}
                onClick={() => setActiveStatus(value)}
                className={cn(
                  "relative px-4 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 outline-none",
                  isActive ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="video-tab-pill"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <LinkGrid
          filters={{ content_type: "video", status: activeStatus }}
          search={search}
          emptyMessage={
            activeStatus === "unread"
              ? "No videos yet to digest. Add a YouTube, Vimeo, or TikTok link to get started."
              : "No digested videos yet. Mark a video as digested to see it here."
          }
        />
      </div>
    </div>
  );
}

export default function VideosPage() {
  return (
    <Suspense>
      <VideosContent />
    </Suspense>
  );
}
