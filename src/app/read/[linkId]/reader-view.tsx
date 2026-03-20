"use client";

import { useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ExternalLink, Clock, BookOpen,
  AlertCircle, PenLine, Trash2, CheckCircle,
} from "lucide-react";
import { NotesPanel } from "./notes-panel";
import {
  useHighlights, useCreateHighlight, useDeleteHighlight,
} from "@/hooks/use-highlights";
import { useUpdateLink } from "@/hooks/use-links";
import { getStatusLabel } from "@/components/links/status-badge";
import type { Link, Highlight } from "@/types";
import type { ReaderContent } from "@/lib/reader";

interface ReaderViewProps {
  link: Link;
  content: ReaderContent | null;
  initialHighlights: Highlight[];
}

const COLORS = [
  { color: "yellow", bg: "bg-yellow-200", ring: "ring-yellow-300" },
  { color: "green",  bg: "bg-green-200",  ring: "ring-green-300"  },
  { color: "blue",   bg: "bg-blue-200",   ring: "ring-blue-300"   },
  { color: "pink",   bg: "bg-pink-200",   ring: "ring-pink-300"   },
] as const;

function getDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

// ── DOM-based highlight application ──────────────────────────────────────────
// We never change dangerouslySetInnerHTML after first render.
// Highlights are stamped directly onto the DOM.
// Selection is saved as character offsets and restored after mutations so that
// any in-progress user selection survives the DOM restructuring.

function saveSelection(container: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;

  const preStart = document.createRange();
  preStart.selectNodeContents(container);
  preStart.setEnd(range.startContainer, range.startOffset);

  const preEnd = document.createRange();
  preEnd.selectNodeContents(container);
  preEnd.setEnd(range.endContainer, range.endOffset);

  return { start: preStart.toString().length, end: preEnd.toString().length };
}

function restoreSelection(container: HTMLElement, saved: { start: number; end: number }): void {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let charCount = 0;
  let startNode: Text | null = null, startOff = 0;
  let endNode: Text | null = null, endOff = 0;

  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    const len = node.textContent?.length ?? 0;
    if (!startNode && charCount + len >= saved.start) {
      startNode = node;
      startOff = saved.start - charCount;
    }
    if (!endNode && charCount + len >= saved.end) {
      endNode = node;
      endOff = saved.end - charCount;
      break;
    }
    charCount += len;
  }

  if (!startNode || !endNode) return;
  try {
    const range = document.createRange();
    range.setStart(startNode, startOff);
    range.setEnd(endNode, endOff);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  } catch {
    // ignore
  }
}

// Remove only marks that are no longer in the active highlights list
function removeStaleMarks(container: HTMLElement, activeIds: Set<string>) {
  let removed = false;
  container.querySelectorAll("mark[data-hid]").forEach((mark) => {
    const hid = (mark as HTMLElement).dataset.hid ?? "";
    if (activeIds.has(hid)) return; // still active — leave it alone
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    removed = true;
  });
  if (removed) container.normalize();
}

// Stamp only highlights that don't already have a mark in the DOM
function stampMissingHighlights(container: HTMLElement, highlights: Highlight[]) {
  const existingIds = new Set(
    Array.from(container.querySelectorAll("mark[data-hid]")).map(
      (m) => (m as HTMLElement).dataset.hid ?? ""
    )
  );

  const toStamp = [...highlights]
    .filter((h) => !existingIds.has(h.id))
    .sort((a, b) => b.text.length - a.text.length); // longest first

  for (const h of toStamp) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let node: Text | null;

    while ((node = walker.nextNode() as Text)) {
      // Skip text already inside any mark
      let el: Node | null = node.parentNode;
      while (el && el !== container) {
        if ((el as HTMLElement).tagName === "MARK") { el = null; break; }
        el = el.parentNode;
      }
      if (!el) continue;

      const idx = (node.textContent ?? "").indexOf(h.text);
      if (idx === -1) continue;

      try {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + h.text.length);
        const mark = document.createElement("mark");
        mark.className = `hl-${h.color}`;
        mark.dataset.hid = h.id;
        range.surroundContents(mark);
        break; // stamped — move on to next highlight
      } catch {
        // surroundContents fails across element boundaries — skip
      }
    }
  }
}

// ── ScrollProgress ────────────────────────────────────────────────────────────
function ScrollProgress({ splitMode }: { splitMode: boolean }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      if (splitMode) {
        const node = document.getElementById("article-scroll");
        if (!node) return;
        const total = node.scrollHeight - node.clientHeight;
        setProgress(total > 0 ? Math.min(100, (node.scrollTop / total) * 100) : 0);
      } else {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0);
      }
    }
    const target = splitMode ? document.getElementById("article-scroll") : window;
    target?.addEventListener("scroll", update, { passive: true });
    return () => target?.removeEventListener("scroll", update);
  }, [splitMode]);

  return (
    <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-100">
      <div
        className="h-full bg-brand-purple origin-left"
        style={{ transform: `scaleX(${progress / 100})`, transition: "none" }}
      />
    </div>
  );
}

// ── ArticleBody ───────────────────────────────────────────────────────────────
// Owns selection + highlight DOM logic so that none of it requires re-rendering
// the base article HTML.

interface ArticleBodyProps {
  link: Link;
  content: ReaderContent;
  initialHighlights: Highlight[];
}

function ArticleBody({ link, content, initialHighlights }: ArticleBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: highlights = [] } = useHighlights(link.id, initialHighlights);
  const createHighlight = useCreateHighlight(link.id);
  const deleteHighlight = useDeleteHighlight(link.id);

  const [toolbar, setToolbar] = useState<{ x: number; y: number; text: string } | null>(null);
  const [activeHid, setActiveHid] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  // ── Apply highlights to DOM (never re-renders base HTML) ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const saved = saveSelection(container);
    const activeIds = new Set(highlights.map((h) => h.id));
    removeStaleMarks(container, activeIds);
    stampMissingHighlights(container, highlights);
    if (saved) restoreSelection(container, saved);
  }, [highlights]);

  // ── Selection toolbar ──
  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { setToolbar(null); return; }
    const text = sel.toString().trim();
    if (text.length < 3) { setToolbar(null); return; }
    const range = sel.getRangeAt(0);
    if (!containerRef.current?.contains(range.commonAncestorContainer)) {
      setToolbar(null); return;
    }
    const rect = range.getBoundingClientRect();
    savedRangeRef.current = range.cloneRange();
    setToolbar({ x: rect.left + rect.width / 2, y: rect.top - 8, text });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore selection after toolbar renders (browser drops it on re-render)
  useLayoutEffect(() => {
    if (!toolbar || !savedRangeRef.current) return;
    try {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRangeRef.current);
    } catch { /* ignore */ }
  }, [toolbar]);

  const handleHighlight = useCallback(async (color: string) => {
    if (!toolbar) return;
    savedRangeRef.current = null;
    window.getSelection()?.removeAllRanges();
    await createHighlight.mutateAsync({ link_id: link.id, text: toolbar.text, color });
    setToolbar(null);
  }, [toolbar, createHighlight, link.id]);

  // Clicks on mark elements
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const mark = (e.target as HTMLElement).closest("mark[data-hid]") as HTMLElement | null;
    setActiveHid(mark ? mark.dataset.hid ?? null : null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!activeHid) return;
    setDeletingId(activeHid);
    await deleteHighlight.mutateAsync(activeHid);
    setDeletingId(null);
    setActiveHid(null);
  }, [activeHid, deleteHighlight]);

  // Dismiss toolbar on scroll
  useEffect(() => {
    const dismiss = () => { savedRangeRef.current = null; setToolbar(null); };
    window.addEventListener("scroll", dismiss, { passive: true });
    document.getElementById("article-scroll")?.addEventListener("scroll", dismiss, { passive: true });
    return () => {
      window.removeEventListener("scroll", dismiss);
      document.getElementById("article-scroll")?.removeEventListener("scroll", dismiss);
    };
  }, []);

  return (
    <>
      {/* Selection highlight toolbar */}
      <AnimatePresence>
        {toolbar && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 flex items-center gap-1.5 bg-slate-800 rounded-xl px-3 py-2 shadow-xl border border-slate-700 -translate-x-1/2"
            style={{ left: toolbar.x, top: toolbar.y - 48 }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <span className="text-white/50 text-[11px] mr-0.5 font-medium select-none">Highlight</span>
            {COLORS.map(({ color, bg, ring }) => (
              <button
                key={color}
                onClick={() => handleHighlight(color)}
                className={`w-5 h-5 rounded-full ${bg} ring-2 ${ring} hover:scale-125 transition-transform`}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete tooltip */}
      <AnimatePresence>
        {activeHid && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl border border-slate-700"
          >
            <span className="text-white/60">Remove highlight?</span>
            <button
              onClick={handleDelete}
              disabled={!!deletingId}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deletingId ? "Removing…" : "Remove"}
            </button>
            <button
              onClick={() => setActiveHid(null)}
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Article header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-text-primary leading-tight mb-4">{content.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted">
          {content.byline && <span className="font-medium text-text-secondary">{content.byline}</span>}
          {content.siteName && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-purple-light text-brand-purple">
              {content.siteName}
            </span>
          )}
          {content.readTime > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {content.readTime} min read
            </span>
          )}
        </div>
        {content.excerpt && (
          <p className="mt-4 text-text-secondary text-base leading-relaxed italic border-l-[3px] border-brand-purple/25 pl-4">
            {content.excerpt}
          </p>
        )}
        <div className="mt-6 border-t border-slate-100" />
      </header>

      {/* Article content — rendered ONCE, highlights applied via DOM */}
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        className="
          prose prose-slate max-w-none
          prose-headings:font-bold prose-headings:text-text-primary prose-headings:leading-snug
          prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
          prose-p:text-[17px] prose-p:leading-[1.85] prose-p:text-text-secondary
          prose-a:text-brand-purple prose-a:font-medium prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-2xl prose-img:shadow-lg prose-img:my-8 prose-img:w-full
          prose-blockquote:border-l-[3px] prose-blockquote:border-brand-purple/40
          prose-blockquote:bg-brand-purple-light/30 prose-blockquote:rounded-r-lg
          prose-blockquote:px-4 prose-blockquote:py-0.5 prose-blockquote:not-italic
          prose-blockquote:text-text-secondary
          prose-code:text-brand-purple prose-code:bg-brand-purple-light prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:shadow-md
          prose-strong:text-text-primary prose-strong:font-semibold
          prose-li:text-[17px] prose-li:leading-[1.85] prose-li:text-text-secondary
          prose-hr:border-slate-200 prose-hr:my-8
        "
        dangerouslySetInnerHTML={{ __html: content.content }}
      />
    </>
  );
}

// ── ReaderView ────────────────────────────────────────────────────────────────

export function ReaderView({ link, content, initialHighlights }: ReaderViewProps) {
  const router = useRouter();
  const [notesOpen, setNotesOpen] = useState(false);
  const [status, setStatus] = useState(link.status);
  const { data: highlights = [] } = useHighlights(link.id, initialHighlights);
  const updateLink = useUpdateLink();
  const domain = getDomain(link.url);
  const saveProgressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Restore scroll position on mount ──
  useEffect(() => {
    if (!link.scroll_progress || link.scroll_progress <= 0) return;
    const pct = link.scroll_progress / 100;
    // Small delay to ensure content is fully rendered
    const t = setTimeout(() => {
      if (notesOpen) {
        const el = document.getElementById("article-scroll");
        if (el) el.scrollTop = (el.scrollHeight - el.clientHeight) * pct;
      } else {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: total * pct });
      }
    }, 120);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save scroll progress (debounced 1.5s) ──
  const handleScrollProgress = useCallback(() => {
    if (saveProgressTimer.current) clearTimeout(saveProgressTimer.current);
    saveProgressTimer.current = setTimeout(() => {
      let pct = 0;
      if (notesOpen) {
        const el = document.getElementById("article-scroll");
        if (el) {
          const total = el.scrollHeight - el.clientHeight;
          pct = total > 0 ? Math.round((el.scrollTop / total) * 100) : 0;
        }
      } else {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        pct = total > 0 ? Math.round((window.scrollY / total) * 100) : 0;
      }
      updateLink.mutate({ id: link.id, scroll_progress: pct });
    }, 1500);
  }, [notesOpen, link.id, updateLink]);

  useEffect(() => {
    const target = notesOpen ? document.getElementById("article-scroll") : window;
    target?.addEventListener("scroll", handleScrollProgress, { passive: true });
    return () => {
      target?.removeEventListener("scroll", handleScrollProgress);
      if (saveProgressTimer.current) clearTimeout(saveProgressTimer.current);
    };
  }, [notesOpen, handleScrollProgress]);

  async function toggleDigested() {
    const next = status === "digested" ? "unread" : "digested";
    setStatus(next);
    await updateLink.mutateAsync({
      id: link.id,
      status: next,
      digested_at: next === "digested" ? new Date().toISOString() : null,
    });
  }

  return (
    <div className={notesOpen ? "h-screen flex flex-col overflow-hidden" : "min-h-screen"}>
      {/* Header */}
      <header className="relative flex-shrink-0 flex items-center justify-between px-6 py-3 bg-[#FAFAF8]/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <ScrollProgress splitMode={notesOpen} />

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <div className="flex items-center gap-1.5 text-brand-purple">
          <BookOpen className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold tracking-wide">Reader Mode</span>
        </div>

        <div className="flex items-center gap-3">
          {highlights.length > 0 && (
            <span className="text-xs text-text-muted">
              {highlights.length} highlight{highlights.length !== 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={toggleDigested}
            disabled={updateLink.isPending}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              status === "digested"
                ? "bg-brand-teal-light text-brand-teal"
                : "text-text-muted hover:text-text-primary hover:bg-slate-100"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {status === "digested"
              ? getStatusLabel("digested")
              : `Mark ${getStatusLabel("digested")}`}
          </button>
          <button
            onClick={() => setNotesOpen((o) => !o)}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              notesOpen
                ? "bg-brand-purple-light text-brand-purple"
                : "text-text-muted hover:text-text-primary hover:bg-slate-100"
            }`}
          >
            <PenLine className="w-3.5 h-3.5" />
            Notes
          </button>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-purple transition-colors"
          >
            <span className="hidden sm:inline">{domain}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Body */}
      {notesOpen ? (
        <div className="flex flex-1 overflow-hidden">
          <div id="article-scroll" className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-8 py-10">
              {content
                ? <ArticleBody link={link} content={content} initialHighlights={initialHighlights} />
                : <ExtractionError url={link.url} />}
            </div>
          </div>
          <AnimatePresence>
            <motion.div
              key="notes-panel"
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="w-[380px] flex-shrink-0 border-l border-slate-100 flex flex-col overflow-hidden"
            >
              <NotesPanel linkId={link.id} initialNotes={link.notes} />
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <main className="max-w-2xl mx-auto px-6 py-12">
          {content
            ? <ArticleBody link={link} content={content} initialHighlights={initialHighlights} />
            : <ExtractionError url={link.url} />}
        </main>
      )}
    </div>
  );
}

function ExtractionError({ url }: { url: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 gap-4 text-center"
    >
      <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-amber-400" />
      </div>
      <p className="font-semibold text-text-primary mb-1">Couldn&apos;t extract content</p>
      <p className="text-sm text-text-muted max-w-xs">
        This page may require JavaScript to render, use a login wall, or block automated access.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-brand-purple text-white text-sm font-medium hover:bg-brand-purple-dark transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Open in browser
      </a>
    </motion.div>
  );
}
