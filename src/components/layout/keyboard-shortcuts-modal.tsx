"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";

const SHORTCUTS = [
  { category: "Navigation" },
  { key: "N",       description: "Add new link" },
  { key: "/",       description: "Focus inline search" },
  { key: "⌘K",     description: "Open global search" },
  { key: "S",       description: "Surprise Me (random link)" },
  { key: "Esc",     description: "Close panel / modal" },
  { category: "Selected link" },
  { key: "D",       description: "Mark as Digested" },
  { key: "U",       description: "Mark as Unread" },
  { key: "⌫",      description: "Delete link" },
  { key: "R",       description: "Open in Reader" },
  { category: "View" },
  { key: "G",       description: "Switch to Grid view" },
  { key: "L",       description: "Switch to List view" },
  { key: "?",       description: "Show this cheatsheet" },
];

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isTyping) return;
      if (e.key === "?") { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed top-[15vh] left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-brand-purple" />
                <span className="text-sm font-semibold text-text-primary">Keyboard Shortcuts</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-auto">
              {SHORTCUTS.map((item, i) => (
                "category" in item ? (
                  <p key={i} className="text-[10px] font-semibold uppercase tracking-widest text-text-muted pt-2 first:pt-0">
                    {item.category}
                  </p>
                ) : (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">{item.description}</span>
                    <kbd className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-slate-100 dark:bg-dark-bg text-text-secondary border border-border min-w-[2rem] justify-center">
                      {item.key}
                    </kbd>
                  </div>
                )
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border">
              <p className="text-[11px] text-text-muted">Press <kbd className="font-mono bg-slate-100 dark:bg-dark-bg px-1.5 py-0.5 rounded text-[10px] border border-border">?</kbd> to toggle this panel</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
