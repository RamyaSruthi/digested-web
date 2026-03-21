"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LinkCard } from "./link-card";
import { LinkListItem } from "./link-list-item";
import { useLinks } from "@/hooks/use-links";
import { useUIStore } from "@/store/ui-store";
import type { LinkFilters } from "@/lib/validations/link";
import type { Link } from "@/types";

interface LinkGridProps {
  filters?: LinkFilters;
  search?: string;
  emptyMessage?: string;
}

function matchesSearch(link: Link, query: string): boolean {
  const q = query.toLowerCase();
  return (
    (link.title ?? "").toLowerCase().includes(q) ||
    (link.description ?? "").toLowerCase().includes(q) ||
    link.url.toLowerCase().includes(q)
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden animate-pulse">
      <div className="h-40 bg-muted" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-2.5 w-20 rounded-full bg-muted" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-full rounded-full bg-muted" />
          <div className="h-3.5 w-3/4 rounded-full bg-muted" />
        </div>
        <div className="h-2.5 w-16 rounded-full bg-muted" />
      </div>
    </div>
  );
}

function EmptyState({ message, hasSearch, search }: { message: string; hasSearch: boolean; search: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-purple-light flex items-center justify-center mb-4">
        <span className="text-2xl">{hasSearch ? "🔍" : "📭"}</span>
      </div>
      <p className="text-sm font-semibold text-text-primary">
        {hasSearch ? `No results for "${search}"` : message}
      </p>
      {!hasSearch && (
        <p className="text-xs text-text-muted mt-1.5">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">N</kbd> to save your first link
        </p>
      )}
    </div>
  );
}

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export function LinkGrid({
  filters,
  search = "",
  emptyMessage = "No links yet. Add your first link to get started.",
}: LinkGridProps) {
  const { data: links, isLoading } = useLinks(filters);
  const { viewMode } = useUIStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const effectiveViewMode = isMobile ? "list" : viewMode;

  if (isLoading) {
    return effectiveViewMode === "list" ? (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-card border border-border animate-pulse" />
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const filtered = (links ?? []).filter((l) => {
    if (filters?.status && l.status !== filters.status) return false;
    if (filters?.content_type && l.content_type !== filters.content_type) return false;
    if (search.trim() && !matchesSearch(l, search)) return false;
    return true;
  });

  if (filtered.length === 0) {
    return <EmptyState message={emptyMessage} hasSearch={!!search.trim()} search={search} />;
  }

  if (effectiveViewMode === "list") {
    return (
      <div className="space-y-2">
        {filtered.map((link) => (
          <LinkListItem key={link.id} link={link} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      {filtered.map((link, i) => (
        <LinkCard key={link.id} link={link} index={i} />
      ))}
    </motion.div>
  );
}
