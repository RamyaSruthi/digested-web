import { NextRequest, NextResponse } from "next/server";

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2019;/g, "\u2019")
    .replace(/&#x2018;/g, "\u2018")
    .replace(/&#x2014;/g, "\u2014")
    .replace(/&#x2013;/g, "\u2013")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractMeta(html: string, property: string): string | null {
  const ogMatch = html.match(
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    )
  );
  if (ogMatch) return ogMatch[1];

  const ogMatchReversed = html.match(
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      "i"
    )
  );
  return ogMatchReversed ? ogMatchReversed[1] : null;
}

function extractMetaName(html: string, name: string): string | null {
  const match = html.match(
    new RegExp(
      `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`,
      "i"
    )
  );
  if (match) return match[1];

  const matchReversed = html.match(
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`,
      "i"
    )
  );
  return matchReversed ? matchReversed[1] : null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

function estimateReadingTime(html: string): number | null {
  // Strip scripts, styles, nav, header, footer, aside
  const cleaned = html
    .replace(/<(script|style|nav|header|footer|aside|noscript)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ").filter((w) => w.length > 1).length;
  if (words < 100) return null; // too little text
  return Math.max(1, Math.round(words / 238)); // ~238 wpm average
}

// YouTube oEmbed — free, no auth, returns title + thumbnail_url
async function fetchYouTubeMetadata(url: string) {
  try {
    const parsed = new URL(url);
    let videoId: string | null = null;

    if (parsed.hostname.includes("youtube.com")) {
      videoId = parsed.searchParams.get("v");
      if (!videoId) {
        const m = parsed.pathname.match(/\/(shorts|live|embed)\/([a-zA-Z0-9_-]{11})/);
        videoId = m?.[2] ?? null;
      }
    } else if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.slice(1).split("/")[0] || null;
    }

    // oEmbed gives us title + thumbnail
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: AbortSignal.timeout(6000) }
    );

    if (oembedRes.ok) {
      const data = await oembedRes.json();
      return {
        title: (data.title as string) ?? null,
        description: data.author_name ? `By ${data.author_name as string}` : null,
        // oEmbed thumbnail is 480×360; upgrade to maxresdefault when we have videoId
        image_url: videoId
          ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
          : (data.thumbnail_url as string) ?? null,
      };
    }

    // oEmbed failed but we have a video ID — use direct thumbnail URL
    if (videoId) {
      return {
        title: null,
        description: null,
        image_url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      };
    }

    return null;
  } catch {
    return null;
  }
}

// Instagram — oEmbed with app token
async function fetchInstagramMetadataWithAppToken(url: string) {
  const appId = process.env.INSTAGRAM_CLIENT_ID;
  const appSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  if (!appId || !appSecret) return null;

  try {
    const appToken = `${appId}|${appSecret}`;
    const res = await fetch(
      `https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${appToken}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: (data.title as string) ?? null,
      description: data.author_name ? `By ${data.author_name as string}` : null,
      image_url: (data.thumbnail_url as string) ?? null,
    };
  } catch {
    return null;
  }
}

// Instagram — scrape with mobile user-agent + JSON-LD (fallback, works for some posts)
async function scrapeInstagramMetadata(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const ogImage = extractMeta(html, "og:image");
    const ogTitle = extractMeta(html, "og:title");
    const ogDesc = extractMeta(html, "og:description");
    if (ogImage) {
      return {
        title: ogTitle ? decodeHtmlEntities(ogTitle) : null,
        description: ogDesc ? decodeHtmlEntities(ogDesc) : null,
        image_url: ogImage,
      };
    }

    const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const ld = JSON.parse(jsonLdMatch[1]);
        const thumbnail = ld?.thumbnailUrl ?? ld?.image?.url ?? ld?.image ?? null;
        if (thumbnail && typeof thumbnail === "string") {
          return {
            title: ld?.name ?? ld?.headline ?? null,
            description: ld?.description ?? null,
            image_url: thumbnail,
          };
        }
      } catch { /* malformed JSON-LD */ }
    }
    return null;
  } catch {
    return null;
  }
}

// Twitter/X oEmbed — returns basic info (no direct image, but we get the tweet text)
async function fetchTwitterMetadata(url: string) {
  try {
    const oembedRes = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!oembedRes.ok) return null;
    const data = await oembedRes.json();

    // Extract plain text from the HTML embed
    const html: string = data.html ?? "";
    const textMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const rawText = textMatch ? textMatch[1].replace(/<[^>]+>/g, " ").trim() : null;

    // Check if the tweet contains an image
    const imageMatch = html.match(/https:\/\/pbs\.twimg\.com\/[^\s"']+(?:jpg|jpeg|png|webp)/i);

    return {
      title: data.author_name ? `@${data.author_name as string} on X` : null,
      description: rawText ? decodeHtmlEntities(rawText).slice(0, 500) : null,
      image_url: imageMatch ? imageMatch[0] : null,
    };
  } catch {
    return null;
  }
}

// Reddit JSON API for posts — much more reliable than scraping HTML
async function fetchRedditMetadata(url: string) {
  try {
    // Normalize: strip query params, ensure it ends with .json
    const parsed = new URL(url);
    const jsonUrl = `https://www.reddit.com${parsed.pathname.replace(/\/$/, "")}.json?limit=1`;

    const res = await fetch(jsonUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Digested/1.0)",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const post = data?.[0]?.data?.children?.[0]?.data;
    if (!post) return null;

    const title = post.title ?? null;
    const description = post.selftext
      ? post.selftext.slice(0, 500)
      : null;

    // Reddit image: prefer preview image over thumbnail
    let image_url: string | null = null;
    const preview = post.preview?.images?.[0];
    if (preview) {
      // Use the highest resolution preview available
      const resolutions = preview.resolutions ?? [];
      const source = preview.source;
      const best = resolutions.length > 0 ? resolutions[resolutions.length - 1] : source;
      if (best?.url) {
        // Reddit HTML-encodes ampersands in JSON
        image_url = best.url.replace(/&amp;/g, "&");
      }
    } else if (post.thumbnail && post.thumbnail.startsWith("http")) {
      image_url = post.thumbnail;
    } else if (post.url_overridden_by_dest?.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
      image_url = post.url_overridden_by_dest;
    }

    return {
      title: title ? decodeHtmlEntities(title) : title,
      description: description ? decodeHtmlEntities(description) : description,
      image_url,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url parameter required" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // YouTube: use oEmbed + direct thumbnail construction
  if (
    parsed.hostname.includes("youtube.com") ||
    parsed.hostname === "youtu.be"
  ) {
    const ytMeta = await fetchYouTubeMetadata(url);
    if (ytMeta) return NextResponse.json(ytMeta);
    // fall through to generic scrape
  }

  // Instagram: oEmbed with app token (requires App Review), fallback to scraping
  if (
    parsed.hostname === "www.instagram.com" ||
    parsed.hostname === "instagram.com"
  ) {
    const igMeta =
      (await fetchInstagramMetadataWithAppToken(url)) ??
      (await scrapeInstagramMetadata(url));
    return NextResponse.json(
      igMeta ?? { title: "Instagram", description: null, image_url: null }
    );
  }

  // Twitter / X: oEmbed
  if (
    parsed.hostname === "twitter.com" ||
    parsed.hostname === "www.twitter.com" ||
    parsed.hostname === "x.com" ||
    parsed.hostname === "www.x.com"
  ) {
    const twMeta = await fetchTwitterMetadata(url);
    if (twMeta) return NextResponse.json(twMeta);
    // fall through to generic scrape
  }

  // Reddit: use JSON API directly
  if (parsed.hostname === "www.reddit.com" || parsed.hostname === "reddit.com") {
    const redditMeta = await fetchRedditMetadata(url);
    if (redditMeta) {
      return NextResponse.json(redditMeta);
    }
    // Fall through to HTML scraping if JSON API fails
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
      },
      signal: AbortSignal.timeout(8000),
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ title: parsed.hostname, description: null, image_url: null });
    }

    const html = await res.text();

    const title =
      extractMeta(html, "og:title") ??
      extractMeta(html, "twitter:title") ??
      extractTitle(html) ??
      parsed.hostname;

    const description =
      extractMeta(html, "og:description") ??
      extractMeta(html, "twitter:description") ??
      extractMetaName(html, "description") ??
      null;

    let image_url =
      extractMeta(html, "og:image") ??
      extractMeta(html, "twitter:image") ??
      null;

    // Resolve relative image URLs
    if (image_url && !image_url.startsWith("http")) {
      try {
        image_url = new URL(image_url, url).href;
      } catch {
        image_url = null;
      }
    }

    return NextResponse.json({
      title: decodeHtmlEntities(title).slice(0, 255),
      description: description ? decodeHtmlEntities(description).slice(0, 500) : null,
      image_url,
      reading_time_minutes: estimateReadingTime(html),
    });
  } catch {
    return NextResponse.json({ title: parsed.hostname, description: null, image_url: null });
  }
}
