"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ExternalLink, MoreHorizontal, Trash2, CheckCircle, Clock, PlayCircle, Twitter, FileText, AlertTriangle, Archive } from "lucide-react";
import { StatusBadge, getStatusLabel } from "./status-badge";
import { DigestedDialog } from "./digested-dialog";
import { useUIStore } from "@/store/ui-store";
import { useUpdateLink, useDeleteLink } from "@/hooks/use-links";
import { useTags } from "@/hooks/use-tags";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Link } from "@/types";

interface LinkCardProps {
  link: Link;
  index?: number;
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string) {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).origin}&sz=64`;
  } catch {
    return null;
  }
}

// Deterministic gradient based on domain name
const PLACEHOLDER_GRADIENTS = [
  ["#7F77DD", "#A855F7"],   // purple → violet
  ["#1D9E75", "#059669"],   // teal → emerald
  ["#3B82F6", "#06B6D4"],   // blue → cyan
  ["#F59E0B", "#EF4444"],   // amber → red
  ["#EC4899", "#8B5CF6"],   // pink → purple
  ["#10B981", "#3B82F6"],   // emerald → blue
  ["#F97316", "#EAB308"],   // orange → yellow
  ["#6366F1", "#EC4899"],   // indigo → pink
];

function getPlaceholderGradient(domain: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash |= 0;
  }
  return PLACEHOLDER_GRADIENTS[Math.abs(hash) % PLACEHOLDER_GRADIENTS.length] as [string, string];
}

export function LinkCard({ link, index = 0 }: LinkCardProps) {
  const { openDetailPanel, selectedLinkId, selectedLinkIds, toggleLinkSelection, isSelecting } = useUIStore();
  const updateLink = useUpdateLink();
  const deleteLink = useDeleteLink();
  const { data: tags = [] } = useTags(link.id);
  const isSelected = selectedLinkId === link.id;
  const isBulkSelected = selectedLinkIds.has(link.id);
  const [imageError, setImageError] = useState(false);
  const [digestedDialogOpen, setDigestedDialogOpen] = useState(false);

  async function handleStatusChange(status: Link["status"]) {
    try {
      await updateLink.mutateAsync({ id: link.id, status });
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleDelete() {
    try {
      await deleteLink.mutateAsync(link.id);
      toast.success("Link deleted");
    } catch {
      toast.error("Failed to delete link");
    }
  }

  const domain = getDomain(link.url);
  const faviconUrl = getFaviconUrl(link.url);
  const [gradFrom, gradTo] = getPlaceholderGradient(domain);
  const proxiedImage = link.image_url
    ? `/api/image-proxy?url=${encodeURIComponent(link.image_url)}`
    : null;

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={!isSelecting ? { y: -3, transition: { duration: 0.2 } } : {}}
      onClick={(e) => {
        if (isSelecting) { toggleLinkSelection(link.id); return; }
        openDetailPanel(link.id);
      }}
      className={cn(
        "group relative bg-card rounded-xl cursor-pointer overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-200",
        isBulkSelected ? "ring-2 ring-brand-purple/50"
        : isSelected    ? "ring-2 ring-brand-purple/30"
        : "border border-border"
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          layoutId="card-selected"
          className="absolute top-0 left-0 right-0 h-0.5 bg-brand-purple z-10"
        />
      )}

      {/* Bulk-select checkbox — top-left, visible on hover or when selecting */}
      <div
        className={cn(
          "absolute top-2 left-2 z-20 transition-opacity duration-150",
          isSelecting ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => { e.stopPropagation(); toggleLinkSelection(link.id); }}
      >
        <div className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
          isBulkSelected
            ? "bg-brand-purple border-brand-purple"
            : "bg-white/90 border-slate-300 hover:border-brand-purple"
        )}>
          {isBulkSelected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>

      {/* Thumbnail — OG image or gradient placeholder */}
      <div className="relative w-full h-40 overflow-hidden flex-shrink-0">
        {proxiedImage && !imageError ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proxiedImage}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </>
        ) : (
          /* Gradient placeholder */
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}
          >
            <div className="flex flex-col items-center gap-2 opacity-90">
              {faviconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={faviconUrl}
                  alt=""
                  width={36}
                  height={36}
                  className="rounded-lg shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).replaceWith(
                      Object.assign(document.createElement("span"), {
                        textContent: domain[0]?.toUpperCase() ?? "?",
                        className: "text-white text-3xl font-bold",
                      })
                    );
                  }}
                />
              ) : (
                <span className="text-white text-3xl font-bold drop-shadow">
                  {domain[0]?.toUpperCase() ?? "?"}
                </span>
              )}
              <span className="text-white/80 text-xs font-medium tracking-wide">{domain}</span>
            </div>
          </div>
        )}

        {/* Content type badge — top-left */}
        {link.content_type === "video" && (
          <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm rounded-lg p-1.5">
            <PlayCircle className="w-4 h-4 text-white" />
          </div>
        )}
        {link.content_type === "tweet" && (
          <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm rounded-lg p-1.5">
            <Twitter className="w-4 h-4 text-white" />
          </div>
        )}
        {link.content_type === "pdf" && (
          <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm rounded-lg p-1.5">
            <FileText className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Status badge overlaid top-right */}
        <div className="absolute top-2.5 right-2.5">
          <StatusBadge status={link.status} contentType={link.content_type} className="shadow-sm backdrop-blur-sm" />
        </div>

        {/* Reading progress bar */}
        {link.status === "unread" && link.scroll_progress > 0 && link.scroll_progress < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div
              className="h-full bg-brand-purple"
              style={{ width: `${link.scroll_progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="p-3.5">
        {/* Domain row */}
        <div className="flex items-center gap-1.5 mb-1.5">
          {faviconUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={faviconUrl}
              alt=""
              width={12}
              height={12}
              className="rounded-sm flex-shrink-0 opacity-70"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <span className="text-[11px] text-text-muted truncate">{domain}</span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug mb-1">
          {link.title || domain}
        </h3>

        {/* Description */}
        {link.description && (
          <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-2.5">
            {link.description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag.name}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: "rgba(127,119,221,0.1)", color: "#7F77DD" }}
              >
                {tag.name}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: "rgba(0,0,0,0.05)", color: "#94A3B8" }}>
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-muted">
              {new Date(link.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            {link.reading_time_minutes && (
              <span className="text-[11px] text-text-muted flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {link.reading_time_minutes} min
              </span>
            )}
            {link.is_dead && (
              <span className="text-[11px] text-destructive flex items-center gap-1" title="This link may be broken">
                <AlertTriangle className="w-2.5 h-2.5" />
                Dead link
              </span>
            )}
          </div>
          <div
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" asChild>
              <a href={link.url} target="_blank" rel="noopener noreferrer" title="Open link">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {link.status !== "digested" && (
                  <DropdownMenuItem onClick={() => setDigestedDialogOpen(true)}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as {getStatusLabel("digested", link.content_type)}
                  </DropdownMenuItem>
                )}
                {link.status !== "unread" && (
                  <DropdownMenuItem onClick={() => handleStatusChange("unread")}>
                    <Clock className="w-4 h-4 mr-2" />
                    Mark as {getStatusLabel("unread", link.content_type)}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.div>

    <DigestedDialog
      open={digestedDialogOpen}
      onOpenChange={setDigestedDialogOpen}
      onKeep={() => handleStatusChange("digested")}
      onArchive={() => handleStatusChange("archived")}
    />
    </>
  );
}
