"use client";

import { useState } from "react";
import { ExternalLink, CheckCircle, Clock, AlertTriangle, PlayCircle, Twitter, FileText, Archive } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { useUpdateLink } from "@/hooks/use-links";
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

export function LinkListItem({ link }: LinkListItemProps) {
  const { openDetailPanel, selectedLinkId, selectedLinkIds, toggleLinkSelection, isSelecting } = useUIStore();
  const updateLink = useUpdateLink();
  const [digestedDialogOpen, setDigestedDialogOpen] = useState(false);
  const isSelected = selectedLinkId === link.id;
  const isBulkSelected = selectedLinkIds.has(link.id);
  const domain = getDomain(link.url);
  const faviconUrl = getFaviconUrl(link.url);
  const ContentIcon = CONTENT_ICON[link.content_type] ?? null;

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

  async function handleArchive(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await updateLink.mutateAsync({ id: link.id, status: "archived" });
    } catch {
      toast.error("Failed to archive link");
    }
  }

  function handleClick() {
    if (isSelecting) { toggleLinkSelection(link.id); return; }
    openDetailPanel(link.id);
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 bg-card rounded-xl border cursor-pointer transition-all duration-150 hover:shadow-card-hover",
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
        <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0" title="Link may be broken" />
      )}

      {/* Date */}
      <span className="text-[11px] text-text-muted flex-shrink-0 hidden md:block">
        {new Date(link.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={handleStatusToggle} title={link.status === "unread" ? "Mark digested" : "Mark unread"}>
          {link.status === "unread"
            ? <CheckCircle className="w-3.5 h-3.5 text-text-muted" />
            : <Clock className="w-3.5 h-3.5 text-text-muted" />
          }
        </Button>
        {link.status !== "archived" && (
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={handleArchive} title="Archive (never see again)">
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
    </div>
  );
}
