"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Inbox, CheckCircle, NotebookPen, Highlighter, BarChart2, PlayCircle, Settings, Shuffle, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { toast } from "sonner";

const navItems = [
  { href: "/app?status=unread",   label: "Yet to Digest", icon: Inbox },
  { href: "/app?status=digested", label: "Digested",      icon: CheckCircle },
  { href: "/app/videos",          label: "Videos",        icon: PlayCircle },
  { href: "/app/notes",           label: "Notes",         icon: NotebookPen },
  { href: "/app/highlights",      label: "Highlights",    icon: Highlighter },
  { href: "/app/archive",         label: "Archive",       icon: Archive },
  { href: "/app/stats",           label: "Stats",         icon: BarChart2 },
  { href: "/app/settings",        label: "Settings",      icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { openDetailPanel } = useUIStore();

  async function handleSurpriseMe() {
    try {
      const res = await fetch("/api/links/random");
      const data = await res.json();
      if (data.link) {
        openDetailPanel(data.link.id);
      } else {
        toast("No unread links to surprise you with!");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <nav className="px-3 space-y-0.5">
      {navItems.map(({ href, label, icon: Icon }) => {
        const [hrefPath, hrefQuery] = href.split("?");
        const hrefParams = new URLSearchParams(hrefQuery ?? "");
        const isActive =
          pathname === hrefPath &&
          (!hrefQuery || searchParams.get("status") === hrefParams.get("status"));

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150",
              isActive
                ? "text-text-primary bg-muted"
                : "text-text-muted hover:bg-muted/60 hover:text-text-primary"
            )}
          >
            <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-text-primary" : "text-text-muted")} />
            {label}
          </Link>
        );
      })}

      {/* Surprise Me */}
      <button
        onClick={handleSurpriseMe}
        className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 text-text-muted hover:bg-muted/60 hover:text-text-primary"
      >
        <Shuffle className="w-4 h-4 flex-shrink-0 text-text-muted" />
        Surprise Me
      </button>
    </nav>
  );
}
