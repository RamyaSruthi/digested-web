"use client";

import { Suspense } from "react";
import { LinkGrid } from "@/components/links/link-grid";
import { Archive } from "lucide-react";

export default function ArchivePage() {
  return (
    <Suspense>
      <ArchiveContent />
    </Suspense>
  );
}

function ArchiveContent() {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2.5 mb-6">
          <Archive className="w-5 h-5 text-text-muted" />
          <h1 className="text-2xl font-semibold text-text-primary">Archive</h1>
          <p className="text-sm text-text-muted ml-1">Links you never want to see again</p>
        </div>
        <LinkGrid
          filters={{ status: "archived" }}
          emptyMessage="Nothing archived yet. Use 'Archive (never see again)' on any link to hide it here."
        />
      </div>
    </div>
  );
}
