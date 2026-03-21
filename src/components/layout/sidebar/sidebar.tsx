"use client";

import { SidebarNav } from "./sidebar-nav";
import { FolderList } from "./folder-list";
import { TagList } from "./tag-list";
import { UserFooter } from "./user-footer";
import { SearchModal } from "@/components/layout/search-modal";

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-[220px] flex-shrink-0 bg-card border-r border-border flex-col h-full">
      {/* Brand header */}
      <div className="px-4 h-14 flex items-center border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-purple flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-xs font-bold">D</span>
          </div>
          <span className="font-semibold text-[14px] text-text-primary tracking-tight">Digested</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-1">
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
