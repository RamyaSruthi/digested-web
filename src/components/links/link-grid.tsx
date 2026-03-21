"use client";

import { LinkListItem } from "./link-list-item";
import { useLinks } from "@/hooks/use-links";
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

export function LinkGrid({
  filters,
  search = "",
  emptyMessage = "No links yet. Add your first link to get started.",
}: LinkGridProps) {
  const { data: links, isLoading } = useLinks(filters);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-[52px] animate-pulse bg-muted/40" />
        ))}
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

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
      {filtered.map((link) => (
        <LinkListItem key={link.id} link={link} />
      ))}
    </div>
  );
}
