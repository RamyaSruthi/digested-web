import { cn } from "@/lib/utils";
import type { LinkStatus, ContentType } from "@/types";

export function getStatusLabel(status: LinkStatus, _contentType?: ContentType | null): string {
  if (status === "unread")   return "Yet to Digest";
  if (status === "archived") return "Archived";
  return "Digested";
}

interface StatusBadgeProps {
  status: LinkStatus;
  contentType?: ContentType | null;
  className?: string;
}

export function StatusBadge({ status, contentType, className }: StatusBadgeProps) {
  const style =
    status === "digested" ? { background: "rgba(14,168,122,0.15)", color: "#0EA87A", backdropFilter: "blur(8px)" }
    : status === "archived" ? { background: "rgba(100,116,139,0.15)", color: "#64748B", backdropFilter: "blur(8px)" }
    : { background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)" };
  return (
    <span
      className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide", className)}
      style={style}
    >
      {getStatusLabel(status, contentType)}
    </span>
  );
}
