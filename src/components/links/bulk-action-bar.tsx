"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/store/ui-store";
import { useUpdateLink, useDeleteLink } from "@/hooks/use-links";
import { useFolders } from "@/hooks/use-folders";
import { CheckCircle, Clock, Trash2, FolderInput, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function BulkActionBar() {
  const { selectedLinkIds, clearSelection, isSelecting } = useUIStore();
  const updateLink = useUpdateLink();
  const deleteLink = useDeleteLink();
  const { data: folders = [] } = useFolders();
  const [loading, setLoading] = useState(false);

  const count = selectedLinkIds.size;
  const ids = Array.from(selectedLinkIds);

  async function handleBulkStatus(status: "unread" | "digested") {
    setLoading(true);
    try {
      await Promise.all(ids.map((id) => updateLink.mutateAsync({ id, status })));
      toast.success(`Marked ${count} link${count !== 1 ? "s" : ""} as ${status === "digested" ? "Digested" : "Yet to Digest"}`);
      clearSelection();
    } catch {
      toast.error("Failed to update some links");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${count} link${count !== 1 ? "s" : ""}? This can't be undone.`)) return;
    setLoading(true);
    try {
      await Promise.all(ids.map((id) => deleteLink.mutateAsync(id)));
      toast.success(`Deleted ${count} link${count !== 1 ? "s" : ""}`);
      clearSelection();
    } catch {
      toast.error("Failed to delete some links");
    } finally {
      setLoading(false);
    }
  }

  async function handleMoveToFolder(folderId: string | null) {
    setLoading(true);
    try {
      await Promise.all(ids.map((id) => updateLink.mutateAsync({ id, folder_id: folderId })));
      const folderName = folders.find((f) => f.id === folderId)?.name ?? "Inbox";
      toast.success(`Moved ${count} link${count !== 1 ? "s" : ""} to ${folderName}`);
      clearSelection();
    } catch {
      toast.error("Failed to move some links");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isSelecting && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="flex items-center gap-2 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 min-w-max">
            {/* Count */}
            <span className="text-sm font-semibold mr-1">
              {count} selected
            </span>

            <div className="w-px h-5 bg-white/20 mx-1" />

            {/* Mark digested */}
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-white hover:bg-white/10 hover:text-white h-8 px-3"
              onClick={() => handleBulkStatus("digested")}
              disabled={loading}
            >
              <CheckCircle className="w-3.5 h-3.5 text-brand-teal" />
              Digested
            </Button>

            {/* Mark unread */}
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-white hover:bg-white/10 hover:text-white h-8 px-3"
              onClick={() => handleBulkStatus("unread")}
              disabled={loading}
            >
              <Clock className="w-3.5 h-3.5 text-slate-300" />
              Unread
            </Button>

            {/* Move to folder */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-white hover:bg-white/10 hover:text-white h-8 px-3"
                  disabled={loading}
                >
                  <FolderInput className="w-3.5 h-3.5 text-slate-300" />
                  Move
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top" className="w-44 mb-1">
                <DropdownMenuItem onClick={() => handleMoveToFolder(null)}>
                  <span className="text-text-muted">No folder (Inbox)</span>
                </DropdownMenuItem>
                {folders.map((f) => (
                  <DropdownMenuItem key={f.id} onClick={() => handleMoveToFolder(f.id)}>
                    <span
                      className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: f.color }}
                    />
                    {f.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-5 bg-white/20 mx-1" />

            {/* Delete */}
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-red-400 hover:bg-white/10 hover:text-red-300 h-8 px-3"
              onClick={handleBulkDelete}
              disabled={loading}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>

            {/* Clear */}
            <Button
              size="icon"
              variant="ghost"
              className="w-7 h-7 text-white/60 hover:bg-white/10 hover:text-white ml-1"
              onClick={clearSelection}
              disabled={loading}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
