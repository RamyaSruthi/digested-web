"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ExternalLink, CheckCircle, Clock, AlertTriangle, PlayCircle, Twitter, FileText, Archive, Trash2 } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { useUpdateLink, useDeleteLink } from "@/hooks/use-links";
import { DigestedDialog } from "./digested-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Link } from "@/types";

interface LinkListItemProps {
  link: Link;
}

function getFaviconUrl(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).origin}&sz=32`; } catch { return null; }
}

function getDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

const CONTENT_ICON = {
  video: PlayCircle,
  tweet: Twitter,
  pdf: FileText,
  article: null,
} as const;

const SWIPE_THRESHOLD = -72;
const BUTTON_WIDTH = 64;

export function LinkListItem({ link }: LinkListItemProps) {
  const { openDetailPanel, selectedLinkId, selectedLinkIds, toggleLinkSelection, isSelecting } = useUIStore();
  const updateLink = useUpdateLink();
  const deleteLink = useDeleteLink();
  const [digestedDialogOpen, setDigestedDialogOpen] = useState(false);
  const isSelected = selectedLinkId === link.id;
  const isBulkSelected = selectedLinkIds.has(link.id);
  const domain = getDomain(link.url);
  const faviconUrl = getFaviconUrl(link.url);
  const ContentIcon = CONTENT_ICON[link.content_type] ?? null;

  const x = useMotionValue(0);
  const archiveOpacity = useTransform(x, [-BUTTON_WIDTH * 2, -BUTTON_WIDTH, 0], [1, 1, 0]);
  const deleteOpacity  = useTransform(x, [-BUTTON_WIDTH * 2, -BUTTON_WIDTH * 1.5, -BUTTON_WIDTH], [1, 1, 0]);

  function snapBack() {
    animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
  }

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < SWIPE_THRESHOLD) {
      animate(x, -BUTTON_WIDTH * 2, { type: "spring", stiffness: 400, damping: 30 });
    } else {
      snapBack();
    }
  }

  async function handleStatusToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (link.status === "unread") {
      setDigestedDialogOpen(true);
    } else {
      try {
        await updateLink.mutateAsync({ id: link.id, status: "unread" });
      } catch {
        toast.error("Failed to update status");
      }
    }
  }

  async function handleArchive(e?: React.MouseEvent) {
    e?.stopPropagation();
    snapBack();
    try {
      await updateLink.mutateAsync({ id: link.id, status: "archived" });
    } catch {
      toast.error("Failed to archive link");
    }
  }

  async function handleDelete(e?: React.MouseEvent) {
    e?.stopPropagation();
    snapBack();
    try {
      await deleteLink.mutateAsync(link.id);
      toast.success("Link deleted");
    } catch {
      toast.error("Failed to delete link");
    }
  }

  function handleClick() {
    if (x.get() !== 0) { snapBack(); return; }
    if (isSelecting) { toggleLinkSelection(link.id); return; }
    openDetailPanel(link.id);
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe action buttons behind the item */}
      <div className="absolute inset-0 flex items-stretch justify-end rounded-xl">
        <motion.button
          style={{ opacity: archiveOpacity }}
          className="w-16 bg-amber-500 flex flex-col items-center justify-center gap-1 flex-shrink-0"
          onClick={(e) => handleArchive(e)}
        >
          <Archive className="w-4 h-4 text-white" />
          <span className="text-[10px] text-white font-medium">Archive</span>
        </motion.button>
        <motion.button
          style={{ opacity: deleteOpacity }}
          className="w-16 bg-red-500 flex flex-col items-center justify-center gap-1 rounded-r-xl flex-shrink-0"
          onClick={(e) => handleDelete(e)}
        >
          <Trash2 className="w-4 h-4 text-white" />
          <span className="text-[10px] text-white font-medium">Delete</span>
        </motion.button>
      </div>

      {/* Draggable item */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -BUTTON_WIDTH * 2, right: 0 }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        style={{ x }}
        onClick={handleClick}
        className={cn(
          "group relative flex items-center gap-3 px-4 py-3 bg-card rounded-xl border cursor-pointer transition-colors",
          isBulkSelected ? "border-brand-purple/40 bg-brand-purple-light/20"
          : isSelected   ? "border-brand-purple/30"
          : "border-border"
        )}
      >
        {/* Checkbox (bulk select) */}
        {isSelecting && (
          <div
            className={cn(
              "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
              isBulkSelected ? "bg-brand-purple border-brand-purple" : "border-slate-300"
            )}
            onClick={(e) => { e.stopPropagation(); toggleLinkSelection(link.id); }}
          >
            {isBulkSelected && (
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        )}

        {/* Favicon */}
        {faviconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={faviconUrl} alt="" width={16} height={16} className="rounded-sm flex-shrink-0 opacity-70"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="w-4 h-4 rounded-sm bg-muted flex-shrink-0" />
        )}

        {/* Content type icon */}
        {ContentIcon && <ContentIcon className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />}

        {/* Title + domain */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", link.is_dead ? "text-text-muted line-through" : "text-text-primary")}>
            {link.title || domain}
          </p>
          <p className="text-[11px] text-text-muted truncate">{domain}</p>
        </div>

        {/* Reading time */}
        {link.reading_time_minutes && (
          <span className="text-[11px] text-text-muted flex-shrink-0 hidden sm:flex items-center gap-1">
            <Clock className="w-3 h-3" />{link.reading_time_minutes}m
          </span>
        )}

        {/* Dead link warning */}
        {link.is_dead && (
          <span title="Link may be broken"><AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0" /></span>
        )}

        {/* Date */}
        <span className="text-[11px] text-text-muted flex-shrink-0 hidden md:block">
          {new Date(link.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>

        {/* Desktop hover actions */}
        <div className="hidden lg:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={handleStatusToggle} title={link.status === "unread" ? "Mark digested" : "Mark unread"}>
            {link.status === "unread"
              ? <CheckCircle className="w-3.5 h-3.5 text-text-muted" />
              : <Clock className="w-3.5 h-3.5 text-text-muted" />
            }
          </Button>
          {link.status !== "archived" && (
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={(e) => handleArchive(e)} title="Archive">
              <Archive className="w-3.5 h-3.5 text-text-muted" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" asChild>
            <a href={link.url} target="_blank" rel="noopener noreferrer" title="Open link">
              <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
            </a>
          </Button>
        </div>

        <DigestedDialog
          open={digestedDialogOpen}
          onOpenChange={setDigestedDialogOpen}
          onKeep={() => updateLink.mutate({ id: link.id, status: "digested" })}
          onArchive={() => updateLink.mutate({ id: link.id, status: "archived" })}
        />
      </motion.div>
    </div>
  );
}
