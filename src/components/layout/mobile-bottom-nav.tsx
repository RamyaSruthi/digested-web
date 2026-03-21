"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Inbox, FolderOpen, BarChart2, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddLinkDialog } from "@/components/links/add-link-dialog";
import { useLinks } from "@/hooks/use-links";

const leftItems = [
  { href: "/app?status=unread", label: "Feed",    icon: Inbox },
  { href: "/app/folders",       label: "Folders", icon: FolderOpen },
];

const rightItems = [
  { href: "/app/stats",    label: "Stats",    icon: BarChart2 },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

function MobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);
  const { data: unreadLinks } = useLinks({ status: "unread" });
  const unreadCount = unreadLinks?.length ?? 0;

  function isActive(href: string) {
    const [hrefPath, hrefQuery] = href.split("?");
    const hrefParams = new URLSearchParams(hrefQuery ?? "");
    return (
      pathname === hrefPath &&
      (!hrefQuery || searchParams.get("status") === hrefParams.get("status"))
    );
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-border flex items-center justify-around px-1"
      style={{ height: "calc(3.5rem + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {leftItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        const isFeed = href.startsWith("/app?status=unread");
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 py-2 px-4"
          >
            <div className="relative">
              <Icon className={cn("w-5 h-5", active ? "text-brand-purple" : "text-text-muted")} />
              {isFeed && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 bg-brand-purple text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <span className={cn("text-[10px] font-medium", active ? "text-brand-purple" : "text-text-muted")}>
              {label}
            </span>
          </Link>
        );
      })}

      {/* Centre add button */}
      <AddLinkDialog open={addOpen} onOpenChange={setAddOpen}>
        <button className="flex items-center justify-center w-12 h-12 bg-brand-purple rounded-2xl shadow-lg shadow-brand-purple/30 -mt-5">
          <Plus className="w-5 h-5 text-white" />
        </button>
      </AddLinkDialog>

      {rightItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center gap-0.5 py-2 px-4"
        >
          <Icon className={cn("w-5 h-5", isActive(href) ? "text-brand-purple" : "text-text-muted")} />
          <span className={cn("text-[10px] font-medium", isActive(href) ? "text-brand-purple" : "text-text-muted")}>
            {label}
          </span>
        </Link>
      ))}
    </nav>
  );
}

export function MobileBottomNav() {
  return (
    <Suspense>
      <MobileNav />
    </Suspense>
  );
}
