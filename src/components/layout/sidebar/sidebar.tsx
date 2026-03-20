"use client";

import { SidebarNav } from "./sidebar-nav";
import { FolderList } from "./folder-list";
import { TagList } from "./tag-list";
import { UserFooter } from "./user-footer";
import { SearchModal } from "@/components/layout/search-modal";

export function Sidebar() {
  return (
    <aside className="w-[220px] flex-shrink-0 bg-white dark:bg-dark-surface border-r border-border flex flex-col h-full">
      {/* Brand header */}
      <div className="gradient-brand px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">D</span>
          </div>
          <div>
            <span className="text-white font-bold text-[15px] tracking-tight">Digested</span>
            <p className="text-white/60 text-[10px] leading-none mt-0.5">Read less, learn more</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <SearchModal />
      </div>

      <div className="flex-1 overflow-auto pb-2">
        <SidebarNav />
        <div className="border-t border-border mx-4 my-2" />
        <FolderList />
        <TagList />
      </div>

      <UserFooter />
    </aside>
  );
}
