"use client";

import { AnimatePresence, motion } from "framer-motion";
import { DigestedDialog } from "@/components/links/digested-dialog";
import { X, ExternalLink, Trash2, BookOpen, CheckCircle, Clock, ChevronDown, Check, FolderOpen, PlayCircle, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUIStore } from "@/store/ui-store";
import { useLinks, useUpdateLink, useDeleteLink } from "@/hooks/use-links";
import { StatusBadge, getStatusLabel } from "@/components/links/status-badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useFolders } from "@/hooks/use-folders";
import { TagEditor } from "@/components/links/tag-editor";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import type { Link, LinkStatus } from "@/types";

function getDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

interface PanelContentProps {
  link: Link;
}

function PanelContent({ link }: PanelContentProps) {
  const { closeDetailPanel } = useUIStore();
  const updateLink = useUpdateLink();
  const deleteLink = useDeleteLink();
  const { data: folders } = useFolders();
  const [folderPopoverOpen, setFolderPopoverOpen] = useState(false);
  const [digestedDialogOpen, setDigestedDialogOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setScrollProgress(max > 0 ? (el.scrollTop / max) * 100 : 0);
  }

  const folder = folders?.find((f) => f.id === link.folder_id);
  const isVideo = link.content_type === "video";

  const statusActions: { status: LinkStatus; icon: React.ElementType; label?: string }[] = [
    { status: "unread",   icon: Clock        },
    { status: "digested", icon: CheckCircle  },
  ];

  async function handleFolderChange(folderId: string | null) {
    setFolderPopoverOpen(false);
    try {
      await updateLink.mutateAsync({ id: link.id, folder_id: folderId });
    } catch {
      toast.error("Failed to move link");
    }
  }

  async function handleStatusChange(status: LinkStatus) {
    try {
      await updateLink.mutateAsync({
        id: link.id,
        status,
        // Only set digested_at when marking as digested — don't clear it
        // when archiving so the historical count is preserved in stats
        ...(status === "digested" ? { digested_at: new Date().toISOString() } : {}),
      });
      if (status === "archived" || status === "digested") closeDetailPanel();
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleDelete() {
    try {
      await deleteLink.mutateAsync(link.id);
      toast.success("Link deleted");
      closeDetailPanel();
    } catch {
      toast.error("Failed to delete link");
    }
  }

  return (
    <>
      {/* YouTube-style scroll progress bar */}
      <div className="h-[3px] w-full bg-transparent flex-shrink-0">
        <div
          className="h-full bg-red-500 transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary">
          {isVideo ? "Video Details" : "Link Details"}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg hover:bg-muted"
          onClick={closeDetailPanel}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-auto">
        {/* OG Image */}
        {link.image_url && (
          <div className="w-full h-44 overflow-hidden bg-muted relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/image-proxy?url=${encodeURIComponent(link.image_url)}`}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = "none";
              }}
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <PlayCircle className="w-6 h-6 text-brand-purple" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* Title + domain */}
          <div>
            <h3 className="font-semibold text-text-primary text-base leading-snug mb-1">
              {link.title || getDomain(link.url)}
            </h3>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-brand-purple hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              {getDomain(link.url)}
            </a>
          </div>

          {link.description && (
            <p className="text-sm text-text-secondary leading-relaxed">
              {link.description}
            </p>
          )}

          {/* Primary CTA */}
          {isVideo ? (
            <Button
              className="w-full bg-brand-purple hover:bg-brand-purple-dark gap-2"
              onClick={() => { window.open(link.url, "_blank"); }}
            >
              <PlayCircle className="w-4 h-4" />
              Watch Video
            </Button>
          ) : (
            <Button
              className="w-full bg-brand-purple hover:bg-brand-purple-dark gap-2"
              onClick={() => router.push(`/read/${link.id}`)}
            >
              <BookOpen className="w-4 h-4" />
              Read in Digested
            </Button>
          )}

          <Separator />

          {/* Status selector */}
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Digest Status
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {statusActions.map(({ status, icon: Icon }) => (
                <button
                  key={status}
                  onClick={() => {
                    if (status === "digested" && link.status !== "digested") {
                      setDigestedDialogOpen(true);
                    } else {
                      handleStatusChange(status);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-colors ${
                    link.status === status
                      ? "border-brand-purple bg-brand-purple-light text-brand-purple font-medium"
                      : "border-border text-text-secondary hover:border-brand-purple/40 hover:bg-brand-purple-light/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-2 text-sm">
            {/* Folder selector */}
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Folder</span>
              <Popover open={folderPopoverOpen} onOpenChange={setFolderPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors rounded px-1 -mr-1">
                    {folder ? (
                      <>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: folder.color }} />
                        <span>{folder.name}</span>
                      </>
                    ) : (
                      <>
                        <FolderOpen className="w-3.5 h-3.5 text-text-muted" />
                        <span className="text-text-muted">None</span>
                      </>
                    )}
                    <ChevronDown className="w-3 h-3 text-text-muted ml-0.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="end">
                  <button
                    onClick={() => handleFolderChange(null)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-accent text-text-secondary"
                  >
                    No folder
                    {!link.folder_id && <Check className="w-4 h-4 text-brand-purple" />}
                  </button>
                  {folders && folders.length > 0 && (
                    <div className="border-t border-border mt-1 pt-1">
                      {folders.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => handleFolderChange(f.id)}
                          className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-accent"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
                            {f.name}
                          </span>
                          {link.folder_id === f.id && <Check className="w-4 h-4 text-brand-purple" />}
                        </button>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-text-muted">Saved</span>
              <span className="text-text-secondary">
                {new Date(link.created_at).toLocaleDateString()}
              </span>
            </div>

            {link.digested_at && (
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Digested</span>
                <span className="text-text-secondary">
                  {new Date(link.digested_at).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-text-muted">Status</span>
              <StatusBadge status={link.status} contentType={link.content_type} />
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <TagEditor linkId={link.id} />

          <Separator />

          <DigestedDialog
            open={digestedDialogOpen}
            onOpenChange={setDigestedDialogOpen}
            onKeep={() => handleStatusChange("digested")}
            onArchive={() => handleStatusChange("archived")}
          />

          {/* Archive */}
          {link.status !== "archived" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-text-muted hover:text-text-primary"
              onClick={() => handleStatusChange("archived")}
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive (never see again)
            </Button>
          )}

          {/* Delete */}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive hover:text-destructive hover:border-destructive/50"
            onClick={handleDelete}
            disabled={deleteLink.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleteLink.isPending ? "Deleting..." : "Delete link"}
          </Button>
        </div>
      </div>
    </>
  );
}

export function DetailPanel() {
  const { isDetailPanelOpen, selectedLinkId } = useUIStore();
  const { data: links } = useLinks();
  const selectedLink = links?.find((l) => l.id === selectedLinkId) ?? null;

  return (
    <>
      {/* Mobile: slide-in overlay (unchanged behaviour) */}
      <AnimatePresence>
        {isDetailPanelOpen && (
          <motion.aside
            className="fixed inset-0 z-40 bg-card flex flex-col overflow-hidden lg:hidden shadow-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            {selectedLink ? (
              <PanelContent link={selectedLink} />
            ) : (
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-sm font-semibold text-text-primary">Link Details</h2>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop: always-visible right panel */}
      <aside className="hidden lg:flex lg:flex-col w-[360px] flex-shrink-0 h-full bg-card border-l border-border overflow-hidden">
        {selectedLink ? (
          <PanelContent link={selectedLink} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-primary mb-1">Nothing selected</p>
            <p className="text-xs text-text-muted">Click any link to see its details here</p>
          </div>
        )}
      </aside>
    </>
  );
}
