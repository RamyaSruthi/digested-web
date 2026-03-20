"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, Loader2, PenLine } from "lucide-react";
import { useUpdateLink } from "@/hooks/use-links";
import { NotesEditor } from "./notes-editor";

interface NotesPanelProps {
  linkId: string;
  initialNotes: string | null;
}

type SaveState = "idle" | "saving" | "saved";

export function NotesPanel({ linkId, initialNotes }: NotesPanelProps) {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const savedRef = useRef(initialNotes ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateLink = useUpdateLink();

  const handleChange = useCallback((html: string) => {
    if (html === savedRef.current) return;

    setSaveState("saving");
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        await updateLink.mutateAsync({ id: linkId, notes: html });
        savedRef.current = html;
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      } catch {
        setSaveState("idle");
      }
    }, 800);
  }, [linkId, updateLink]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <PenLine className="w-4 h-4 text-brand-purple" />
          <span className="text-sm font-semibold text-text-primary">Notes</span>
        </div>
        <div className="h-5 flex items-center">
          {saveState === "saving" && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving…
            </span>
          )}
          {saveState === "saved" && (
            <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Rich text editor */}
      <NotesEditor
        initialContent={initialNotes ?? ""}
        onChange={handleChange}
      />
    </div>
  );
}
