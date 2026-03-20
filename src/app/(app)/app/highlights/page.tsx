"use client";

import { useAllHighlights, useDeleteHighlight } from "@/hooks/use-highlights";
import { useRouter } from "next/navigation";
import { Highlighter, BookOpen, ExternalLink, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import type { HighlightWithLink } from "@/hooks/use-highlights";

const COLOR_BG: Record<string, string> = {
  yellow: "bg-yellow-100 border-yellow-200",
  green:  "bg-green-100 border-green-200",
  blue:   "bg-blue-100 border-blue-200",
  pink:   "bg-pink-100 border-pink-200",
};
const COLOR_BAR: Record<string, string> = {
  yellow: "bg-yellow-300",
  green:  "bg-green-300",
  blue:   "bg-blue-300",
  pink:   "bg-pink-300",
};

function getDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}
function getFaviconUrl(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).origin}&sz=32`; } catch { return null; }
}

function HighlightCard({ highlight }: { highlight: HighlightWithLink }) {
  const deleteHighlight = useDeleteHighlight(highlight.link_id);

  return (
    <div className={`relative flex gap-3 rounded-xl border px-4 py-3 ${COLOR_BG[highlight.color] ?? "bg-slate-50 border-slate-200"}`}>
      {/* Color bar */}
      <div className={`w-1 flex-shrink-0 rounded-full self-stretch ${COLOR_BAR[highlight.color] ?? "bg-slate-300"}`} />
      <p className="flex-1 text-sm text-text-primary leading-relaxed italic">
        &ldquo;{highlight.text}&rdquo;
      </p>
      <button
        onClick={() => deleteHighlight.mutateAsync(highlight.id)}
        disabled={deleteHighlight.isPending}
        className="flex-shrink-0 text-text-muted hover:text-red-400 transition-colors self-start mt-0.5"
        title="Remove highlight"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function HighlightsPage() {
  const { data: highlights = [], isLoading } = useAllHighlights();
  const router = useRouter();

  // Group highlights by link
  const groups = useMemo(() => {
    const map = new Map<string, { link: HighlightWithLink["links"]; items: HighlightWithLink[] }>();
    for (const h of highlights) {
      const existing = map.get(h.link_id);
      if (existing) {
        existing.items.push(h);
      } else {
        map.set(h.link_id, { link: h.links, items: [h] });
      }
    }
    return Array.from(map.values());
  }, [highlights]);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Highlighter className="w-5 h-5 text-brand-purple" />
          <h1 className="text-2xl font-semibold text-text-primary">Highlights</h1>
          {!isLoading && highlights.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-purple-light text-brand-purple">
              {highlights.length}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-5 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
                <div className="space-y-3">
                  <div className="h-12 bg-yellow-50 rounded-lg" />
                  <div className="h-10 bg-blue-50 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && highlights.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-purple-light flex items-center justify-center">
              <Highlighter className="w-6 h-6 text-brand-purple" />
            </div>
            <p className="font-semibold text-text-primary">No highlights yet</p>
            <p className="text-sm text-text-muted max-w-xs">
              Open any link in Reader Mode, select text, and choose a highlight colour.
            </p>
          </div>
        )}

        <div className="space-y-5">
          {groups.map(({ link, items }, i) => {
            const domain = getDomain(link.url);
            const faviconUrl = getFaviconUrl(link.url);

            return (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-border shadow-card overflow-hidden"
              >
                {/* Link header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50">
                  <div className="flex items-center gap-2 min-w-0">
                    {faviconUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={faviconUrl} alt="" width={14} height={14} className="rounded-sm opacity-70 flex-shrink-0" />
                    )}
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {link.title || domain}
                    </p>
                    <span className="text-[11px] text-text-muted flex-shrink-0 ml-1">
                      · {items.length} highlight{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <button
                      onClick={() => router.push(`/read/${link.id}`)}
                      className="flex items-center gap-1 text-xs text-brand-purple hover:text-brand-purple-dark font-medium transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Read
                    </button>
                    <span className="text-slate-200">|</span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-muted hover:text-text-primary transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Highlights */}
                <div className="px-5 py-4 space-y-2.5">
                  {items.map((h) => (
                    <HighlightCard key={h.id} highlight={h} />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
