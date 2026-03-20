import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// HEAD-check a URL — fast, minimal data transfer
async function isUrlAlive(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    return res.ok || res.status === 405; // 405 = HEAD not allowed but URL exists
  } catch {
    return false;
  }
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all user links
  const { data: links, error } = await supabase
    .from("links")
    .select("id, url")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!links?.length) return NextResponse.json({ checked: 0, dead: 0 });

  // Check in batches of 5 concurrently
  const BATCH = 5;
  let deadCount = 0;

  for (let i = 0; i < links.length; i += BATCH) {
    const batch = links.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (link) => {
        const alive = await isUrlAlive(link.url);
        if (!alive) {
          deadCount++;
          await supabase.from("links").update({ is_dead: true }).eq("id", link.id);
        } else {
          // Reset dead flag if it was previously dead and is now alive
          await supabase.from("links").update({ is_dead: false }).eq("id", link.id);
        }
      })
    );
  }

  return NextResponse.json({ checked: links.length, dead: deadCount });
}
