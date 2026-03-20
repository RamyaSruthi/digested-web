"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";
import { useRouter } from "next/navigation";

interface ShortcutOptions {
  onAddLink?: () => void;
  onDeleteSelected?: () => void;
  onMarkDigested?: () => void;
  onMarkUnread?: () => void;
  onOpenReader?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export function useKeyboardShortcuts({
  onAddLink,
  onDeleteSelected,
  onMarkDigested,
  onMarkUnread,
  onOpenReader,
  searchInputRef,
}: ShortcutOptions = {}) {
  const { closeDetailPanel, isDetailPanelOpen, setViewMode } = useUIStore();
  const router = useRouter();

  useEffect(() => {
    async function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Escape — close detail panel
      if (e.key === "Escape" && isDetailPanelOpen) {
        closeDetailPanel();
        return;
      }

      if (isTyping) return;

      // N — open add link dialog
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        onAddLink?.();
        return;
      }

      // / — focus search
      if (e.key === "/") {
        e.preventDefault();
        searchInputRef?.current?.focus();
        return;
      }

      // S — surprise me
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        try {
          const res = await fetch("/api/links/random");
          const data = await res.json();
          if (data.link) {
            const { openDetailPanel } = useUIStore.getState();
            openDetailPanel(data.link.id);
          }
        } catch { /* ignore */ }
        return;
      }

      // G — grid view
      if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        setViewMode("grid");
        return;
      }

      // L — list view
      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        setViewMode("list");
        return;
      }

      // D — mark digested (when detail panel open)
      if ((e.key === "d" || e.key === "D") && isDetailPanelOpen) {
        e.preventDefault();
        onMarkDigested?.();
        return;
      }

      // U — mark unread (when detail panel open)
      if ((e.key === "u" || e.key === "U") && isDetailPanelOpen) {
        e.preventDefault();
        onMarkUnread?.();
        return;
      }

      // R — open in reader (when detail panel open)
      if ((e.key === "r" || e.key === "R") && isDetailPanelOpen) {
        e.preventDefault();
        onOpenReader?.();
        return;
      }

      // Backspace / Delete — delete selected link (when detail panel open)
      if ((e.key === "Backspace" || e.key === "Delete") && isDetailPanelOpen) {
        e.preventDefault();
        onDeleteSelected?.();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDetailPanelOpen, closeDetailPanel, onAddLink, onDeleteSelected, onMarkDigested, onMarkUnread, onOpenReader, searchInputRef, setViewMode, router]);
}
