import { NextResponse } from "next/server";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url", { status: 400 });
  }

  // Validate it's an http(s) URL
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return new NextResponse("Invalid URL", { status: 400 });
    }
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  // YouTube maxresdefault → fallback to hqdefault if 404
  const ytMaxRes = /^https:\/\/i\.ytimg\.com\/vi\/([a-zA-Z0-9_-]+)\/maxresdefault\.jpg/.exec(url);

  const urlsToTry: string[] = [url];
  if (ytMaxRes) {
    urlsToTry.push(`https://i.ytimg.com/vi/${ytMaxRes[1]}/hqdefault.jpg`);
  }

  let res: Response | null = null;
  for (const candidate of urlsToTry) {
    try {
      const r = await fetch(candidate, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": new URL(candidate).origin,
          "Accept": "image/webp,image/avif,image/*,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) { res = r; break; }
    } catch {
      // try next candidate
    }
  }

  try {
    if (!res) {
      return new NextResponse("Failed to fetch image", { status: 502 });
    }

    const contentType = res.headers.get("content-type") ?? "";
    const baseType = contentType.split(";")[0].trim();

    if (!ALLOWED_CONTENT_TYPES.some((t) => baseType.startsWith(t.split("/")[0]) && baseType.includes("image"))) {
      return new NextResponse("Not an image", { status: 400 });
    }

    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": baseType || "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch {
    return new NextResponse("Failed to fetch image", { status: 502 });
  }
}
