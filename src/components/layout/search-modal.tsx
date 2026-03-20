"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ExternalLink, Clock, CheckCircle, X } from "lucide-react";
import { useLinks } from "@/hooks/use-links";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Link } from "@/types";

function getDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function ResultItem({
  link,
  isActive,
  onSelect,
}: {
  link: Link;
  isActive: boolean;
  onSelect: (link: Link) => void;
}) {
  const domain = getDomain(link.url);
  return (
    <button
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
        isActive ? "bg-brand-purple-light" : "hover:bg-muted"
      )}
      onMouseDown={(e) => { e.preventDefault(); onSelect(link); }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).origin}&sz=32`}
        alt=""
        width={16}
        height={16}
        className="mt-0.5 rounded-sm flex-shrink-0 opacity-60"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {link.title || domain}
        </p>
        <p className="text-xs text-text-muted truncate">{domain}</p>
      </div>
      {link.status === "digested" ? (
        <CheckCircle className="w-3.5 h-3.5 text-brand-teal flex-shrink-0 mt-0.5" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" />
      )}
    </button>
  );
}

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { openDetailPanel } = useUIStore();
  const router = useRouter();

  const { data: results = [], isFetching } = useLinks(
    query.trim().length >= 2 ? { search: query.trim() } : undefined
  );

  const displayResults = query.trim().length >= 2 ? results.slice(0, 8) : [];

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = useCallback((link: Link) => {
    setOpen(false);
    openDetailPanel(link.id);
  }, [openDetailPanel]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, displayResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const link = displayResults[activeIndex];
      if (link) handleSelect(link);
    }
  }

  // Reset active index when results change
  useEffect(() => { setActiveIndex(0); }, [query]);

  return (
    <>
      {/* Trigger button in header area (also responds to Cmd+K) */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] bg-muted hover:bg-accent text-text-muted transition-colors"
      >
        <Search className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="text-[10px] bg-white border border-border rounded px-1.5 py-0.5 font-mono text-text-muted">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/30 z-50"
              onClick={() => setOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed top-[20vh] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 bg-card rounded-xl shadow-2xl border border-border overflow-hidden"
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search your links…"
                  className="flex-1 text-sm text-text-primary outline-none placeholder:text-text-muted bg-transparent"
                />
                {query && (
                  <button onClick={() => setQuery("")}>
                    <X className="w-3.5 h-3.5 text-text-muted hover:text-text-primary" />
                  </button>
                )}
                <kbd
                  className="text-[10px] text-text-muted border border-border rounded px-1.5 py-0.5 font-mono cursor-pointer"
                  onClick={() => setOpen(false)}
                >
                  Esc
                </kbd>
              </div>

              {/* Results */}
              {query.trim().length >= 2 && (
                <div className="max-h-80 overflow-auto">
                  {isFetching && displayResults.length === 0 && (
                    <div className="flex items-center gap-2 px-4 py-6 text-sm text-text-muted">
                      <div className="w-3.5 h-3.5 border-2 border-brand-purple/30 border-t-brand-purple rounded-full animate-spin" />
                      Searching…
                    </div>
                  )}
                  {!isFetching && displayResults.length === 0 && (
                    <p className="px-4 py-6 text-sm text-text-muted text-center">
                      No results for &ldquo;{query}&rdquo;
                    </p>
                  )}
                  {displayResults.map((link, i) => (
                    <ResultItem
                      key={link.id}
                      link={link}
                      isActive={i === activeIndex}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              )}

              {/* Hint */}
              {query.trim().length < 2 && (
                <div className="px-4 py-4 text-xs text-text-muted">
                  Type at least 2 characters to search across titles, descriptions, and notes.
                </div>
              )}

              {/* Footer */}
              {displayResults.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-2 border-t border-border text-[11px] text-text-muted">
                  <span><kbd className="font-mono">↑↓</kbd> navigate</span>
                  <span><kbd className="font-mono">↵</kbd> open</span>
                  <span><kbd className="font-mono">Esc</kbd> close</span>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
