export type ContentType = "article" | "video" | "tweet" | "pdf";

const VIDEO_PATTERNS = [
  /youtube\.com\/watch/i,
  /youtu\.be\//i,
  /youtube\.com\/shorts\//i,
  /youtube\.com\/live\//i,
  /vimeo\.com\/\d+/i,
  /twitch\.tv\//i,
  /tiktok\.com\//i,
  /loom\.com\/share\//i,
  /wistia\.(com|net)\/medias\//i,
  /dailymotion\.com\/video\//i,
  /facebook\.com\/.*\/videos\//i,
  /fb\.watch\//i,
  /rumble\.com\/v/i,
  /odysee\.com\/@/i,
];

const TWEET_PATTERNS = [
  /twitter\.com\/\w+\/status\//i,
  /x\.com\/\w+\/status\//i,
];

export function detectContentType(url: string, ogType?: string | null): ContentType {
  try {
    // PDF by URL
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.endsWith(".pdf")) return "pdf";

    // Tweet by URL
    if (TWEET_PATTERNS.some((p) => p.test(url))) return "tweet";

    // Video by URL
    if (VIDEO_PATTERNS.some((p) => p.test(url))) return "video";

    // Fallback to og:type
    if (ogType) {
      const t = ogType.toLowerCase();
      if (t.startsWith("video")) return "video";
      if (t === "article" || t === "website") return "article";
    }
  } catch {
    // invalid URL — fall through
  }

  return "article";
}
