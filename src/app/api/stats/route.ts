import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function toYMD(date: Date) {
  return date.toISOString().slice(0, 10); // "2025-03-13"
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    { data: links },
    { data: highlights },
    { data: folders },
  ] = await Promise.all([
    supabase.from("links").select("id, status, folder_id, digested_at").eq("user_id", user.id),
    supabase.from("highlights").select("id").eq("user_id", user.id),
    supabase.from("folders").select("id, name, color").eq("user_id", user.id),
  ]);

  const allLinks = links ?? [];
  const total_saved = allLinks.length;
  const total_digested = allLinks.filter((l) => l.digested_at !== null).length;
  const total_unread = allLinks.filter((l) => l.status === "unread").length;
  const total_highlights = (highlights ?? []).length;

  // ── Digested by folder ────────────────────────────────────────────────────
  const folderMap = new Map((folders ?? []).map((f) => [f.id, f]));
  const folderCounts: Record<string, { name: string; color: string; count: number }> = {};

  for (const link of allLinks.filter((l) => l.status === "digested")) {
    const key = link.folder_id ?? "__none__";
    if (!folderCounts[key]) {
      const folder = link.folder_id ? folderMap.get(link.folder_id) : null;
      folderCounts[key] = {
        name: folder?.name ?? "Unorganized",
        color: folder?.color ?? "#94a3b8",
        count: 0,
      };
    }
    folderCounts[key].count += 1;
  }

  const by_folder = Object.values(folderCounts).sort((a, b) => b.count - a.count);

  // ── Time-series: last 30 days (covers week + month views) ─────────────────
  const now = new Date();
  const dayMap = new Map<string, number>();

  // Pre-fill last 30 days with 0
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayMap.set(toYMD(d), 0);
  }

  for (const link of allLinks) {
    if (link.status !== "digested" || !link.digested_at) continue;
    const ymd = link.digested_at.slice(0, 10);
    if (dayMap.has(ymd)) dayMap.set(ymd, (dayMap.get(ymd) ?? 0) + 1);
  }

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const by_day = Array.from(dayMap.entries()).map(([ymd, count]) => {
    const d = new Date(ymd);
    return {
      date: ymd,
      label: DAY_LABELS[d.getDay()],  // short day name for weekly view
      short: `${d.getMonth() + 1}/${d.getDate()}`, // "3/13" for monthly view
      count,
    };
  });

  // ── Time-series: last 12 months ───────────────────────────────────────────
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthMap = new Map<string, number>(); // key: "2025-03"

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, 0);
  }

  for (const link of allLinks) {
    if (link.status !== "digested" || !link.digested_at) continue;
    const key = link.digested_at.slice(0, 7); // "2025-03"
    if (monthMap.has(key)) monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  }

  const by_month = Array.from(monthMap.entries()).map(([key, count]) => {
    const [year, month] = key.split("-");
    return {
      date: key,
      label: `${MONTH_NAMES[parseInt(month) - 1]} '${year.slice(2)}`,
      count,
    };
  });

  return NextResponse.json({
    total_saved,
    total_digested,
    total_unread,
    total_highlights,
    by_folder,
    by_day,
    by_month,
  });
}
