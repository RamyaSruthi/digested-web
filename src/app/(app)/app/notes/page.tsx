"use client";

import { useLinks } from "@/hooks/use-links";
import { useRouter } from "next/navigation";
import { NotebookPen, BookOpen, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

function getDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function getFaviconUrl(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).origin}&sz=32`; } catch { return null; }
}

export default function NotesPage() {
  const { data: links = [], isLoading } = useLinks({ has_notes: true });
  const router = useRouter();

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <NotebookPen className="w-5 h-5 text-brand-purple" />
          <h1 className="text-2xl font-semibold text-text-primary">Notes</h1>
          {!isLoading && links.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-purple-light text-brand-purple">
              {links.length}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-5 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-4/5" />
                  <div className="h-3 bg-slate-100 rounded w-3/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && links.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-purple-light flex items-center justify-center">
              <NotebookPen className="w-6 h-6 text-brand-purple" />
            </div>
            <p className="font-semibold text-text-primary">No notes yet</p>
            <p className="text-sm text-text-muted max-w-xs">
              Open any link in Reader Mode and hit the Notes button to start taking notes.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {links.map((link, i) => {
            const domain = getDomain(link.url);
            const faviconUrl = getFaviconUrl(link.url);

            return (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="bg-white rounded-xl border border-border shadow-card hover:shadow-card-hover transition-shadow"
              >
                {/* Card header */}
                <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-slate-50">
                  <div className="flex items-center gap-2 min-w-0">
                    {faviconUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={faviconUrl} alt="" width={14} height={14} className="rounded-sm flex-shrink-0 opacity-70" />
                    )}
                    <span className="text-xs text-text-muted truncate">{domain}</span>
                    <span className="text-text-muted/40">·</span>
                    <span className="text-xs text-text-muted flex-shrink-0">
                      {new Date(link.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
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
                      onClick={(e) => e.stopPropagation()}
                      className="text-text-muted hover:text-text-primary transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Link title */}
                <div className="px-5 pt-3 pb-1">
                  <p className="text-sm font-semibold text-text-primary line-clamp-1">
                    {link.title || domain}
                  </p>
                </div>

                {/* Note content */}
                <div
                  className="px-5 pb-4 prose prose-sm prose-slate max-w-none
                    prose-p:text-text-secondary prose-p:leading-relaxed prose-p:my-1
                    prose-headings:text-text-primary prose-headings:font-semibold prose-headings:my-1
                    prose-li:text-text-secondary prose-li:my-0
                    prose-blockquote:border-brand-purple/40 prose-blockquote:text-text-muted prose-blockquote:not-italic
                    prose-code:text-brand-purple prose-code:bg-brand-purple-light prose-code:px-1 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none"
                  dangerouslySetInnerHTML={{ __html: link.notes ?? "" }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
