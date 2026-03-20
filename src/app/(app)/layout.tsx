export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { DetailPanel } from "@/components/layout/detail-panel";
import { BulkActionBar } from "@/components/links/bulk-action-bar";
import { KeyboardShortcutsModal } from "@/components/layout/keyboard-shortcuts-modal";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden pb-14 lg:pb-0">{children}</main>
      <DetailPanel />
      <BulkActionBar />
      <KeyboardShortcutsModal />
      <MobileBottomNav />
    </div>
  );
}
