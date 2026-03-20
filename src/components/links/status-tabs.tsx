"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LinkStatus } from "@/types";

const TABS: { label: string; value: LinkStatus }[] = [
  { label: "Yet to Digest", value: "unread" },
  { label: "Digested",      value: "digested" },
];

export function StatusTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeStatus = (searchParams.get("status") ?? "unread") as LinkStatus;

  function handleTabClick(value: LinkStatus) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit bg-black/5">
      {TABS.map(({ label, value }) => {
        const isActive = activeStatus === value;
        return (
          <button
            key={value}
            onClick={() => handleTabClick(value)}
            className={cn(
              "relative px-4 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 outline-none",
              isActive ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="status-tab-pill"
                className="absolute inset-0 bg-card rounded-lg"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
