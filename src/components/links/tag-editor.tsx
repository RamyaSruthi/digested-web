"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";
import { useTags, useAddTag, useRemoveTag } from "@/hooks/use-tags";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TagEditorProps {
  linkId: string;
}

export function TagEditor({ linkId }: TagEditorProps) {
  const { data: tags = [] } = useTags(linkId);
  const addTag = useAddTag(linkId);
  const removeTag = useRemoveTag(linkId);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleAdd(raw: string) {
    const name = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name || name.length > 50) return;
    if (tags.some((t) => t.name === name)) {
      setInput("");
      return;
    }
    try {
      await addTag.mutateAsync(name);
    } catch {
      toast.error("Failed to add tag");
    }
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAdd(input);
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      handleRemove(tags[tags.length - 1].name);
    }
  }

  async function handleRemove(name: string) {
    try {
      await removeTag.mutateAsync(name);
    } catch {
      toast.error("Failed to remove tag");
    }
  }

  return (
    <div>
      <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
        Tags
      </p>
      <div
        className={cn(
          "flex flex-wrap gap-1.5 min-h-9 p-2 rounded-md border border-input bg-transparent",
          "focus-within:ring-1 focus-within:ring-ring cursor-text"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag.name}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-brand-purple-light text-brand-purple font-medium"
          >
            {tag.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(tag.name);
              }}
              className="hover:text-brand-purple-dark ml-0.5"
              aria-label={`Remove tag ${tag.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) handleAdd(input); }}
          placeholder={tags.length === 0 ? "Add tags..." : ""}
          className="flex-1 min-w-20 bg-transparent text-xs outline-none placeholder:text-text-muted"
        />
      </div>
      <p className="text-xs text-text-muted mt-1">Press Enter or comma to add</p>
    </div>
  );
}
