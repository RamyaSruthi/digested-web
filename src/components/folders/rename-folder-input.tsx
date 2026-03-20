"use client";

import { useEffect, useRef, useState } from "react";
import { useUpdateFolder } from "@/hooks/use-folders";
import { toast } from "sonner";
import type { Folder } from "@/types";

interface RenameFolderInputProps {
  folder: Folder;
  onDone: () => void;
}

export function RenameFolderInput({ folder, onDone }: RenameFolderInputProps) {
  const [value, setValue] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateFolder = useUpdateFolder();

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  async function commit() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === folder.name) {
      onDone();
      return;
    }

    try {
      await updateFolder.mutateAsync({ id: folder.id, name: trimmed });
      toast.success("Folder renamed");
    } catch {
      toast.error("Failed to rename folder");
    }
    onDone();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      onDone();
    }
  }

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className="w-full px-3 py-1.5 text-sm rounded-md border border-brand-purple bg-white outline-none focus:ring-2 focus:ring-brand-purple/30"
      aria-label="Rename folder"
    />
  );
}
