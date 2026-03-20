"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Tag, ChevronDown } from "lucide-react";
import { useAllTags } from "@/hooks/use-tags";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function TagList() {
  const { data: tags = [], isLoading } = useAllTags();
  const [expanded, setExpanded] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");

  if (isLoading || tags.length === 0) return null;

  return (
    <div className="px-3 mt-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full px-3 py-1 rounded-lg transition-colors hover:bg-muted text-text-muted"
      >
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest">
          <Tag className="w-3 h-3" />
          Tags
        </span>
        <ChevronDown
          className={cn("w-3 h-3 transition-transform duration-200", expanded ? "rotate-0" : "-rotate-90")}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pt-0.5">
              {tags.map((tag) => {
                const isActive = pathname === "/app" && activeTag === tag.name;
                return (
                  <button
                    key={tag.name}
                    onClick={() =>
                      isActive
                        ? router.push("/app?status=unread")
                        : router.push(`/app?tag=${encodeURIComponent(tag.name)}`)
                    }
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 rounded-lg text-[13px] transition-all duration-150 text-left",
                      isActive
                        ? "bg-brand-purple-light/60 text-brand-purple font-medium"
                        : "text-text-secondary hover:bg-muted hover:text-text-primary"
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", isActive ? "bg-brand-purple" : "bg-text-muted")}
                      />
                      <span className="truncate">{tag.name}</span>
                    </span>
                    <span className={cn("text-[11px] flex-shrink-0 ml-1", isActive ? "text-brand-purple/60" : "text-text-muted")}>
                      {tag.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
