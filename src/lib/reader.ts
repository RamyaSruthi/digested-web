import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

export interface ReaderContent {
  title: string;
  byline: string | null;
  siteName: string | null;
  content: string;
  excerpt: string | null;
  wordCount: number;
  readTime: number;
}

function proxyImages(html: string): string {
  return html.replace(
    /(<img[^>]+src=["'])(?!\/api\/image-proxy)([^"']+)(["'])/gi,
    (_, before, src, after) => {
      try {
        new URL(src);
        return `${before}/api/image-proxy?url=${encodeURIComponent(src)}${after}`;
      } catch {
        return `${before}${src}${after}`;
      }
    }
  );
}

function stripDangerousTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[^>]*>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:[^\s"']*/gi, "");
}

export function estimateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function fetchRedditContent(url: string): Promise<ReaderContent | null> {
  try {
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

    const title: string = post.title ?? "Reddit Post";
    const byline: string | null = post.author ? `u/${post.author}` : null;
    const subreddit: string | null = post.subreddit_name_prefixed ?? null;

    if (post.selftext_html && post.selftext_html.trim()) {
      const raw = post.selftext_html
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"');

      const content = proxyImages(stripDangerousTags(raw));
      const wordCount: number = post.selftext ? post.selftext.split(/\s+/).length : 0;

      return {
        title,
        byline,
        siteName: subreddit,
        content,
        excerpt: post.selftext?.slice(0, 200) ?? null,
        wordCount,
        readTime: estimateReadTime(post.selftext ?? ""),
      };
    }

    const isImage = post.post_hint === "image" || post.url_overridden_by_dest?.match(/\.(jpg|jpeg|png|gif|webp)/i);
    const imgSrc = post.url_overridden_by_dest && isImage
      ? `/api/image-proxy?url=${encodeURIComponent(post.url_overridden_by_dest)}`
      : null;

    const score: number = post.score ?? 0;
    const numComments: number = post.num_comments ?? 0;
    const linkedUrl: string | null = post.url_overridden_by_dest ?? null;

    const content = `
      ${imgSrc ? `<figure><img src="${imgSrc}" alt="${title}" /></figure>` : ""}
      <p><strong>${score.toLocaleString()} upvotes</strong> · ${numComments.toLocaleString()} comments${subreddit ? ` · ${subreddit}` : ""}</p>
      ${linkedUrl && !isImage ? `<p>Linked article: <a href="${linkedUrl}" target="_blank" rel="noopener noreferrer">${linkedUrl}</a></p>` : ""}
    `;

    return {
      title,
      byline,
      siteName: subreddit,
      content: stripDangerousTags(content),
      excerpt: `${score.toLocaleString()} upvotes · ${numComments.toLocaleString()} comments`,
      wordCount: 0,
      readTime: 1,
    };
  } catch {
    return null;
  }
}

async function fetchArticleContent(url: string): Promise<ReaderContent | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    const html = await res.text();
    const { document } = parseHTML(html);

    const base = document.createElement("base");
    base.setAttribute("href", url);
    document.head?.appendChild(base);

    const reader = new Readability(document as unknown as Document, {
      charThreshold: 20,
    });
    const article = reader.parse();
    if (!article) return null;

    const content = proxyImages(stripDangerousTags(article.content ?? ""));

    return {
      title: article.title ?? new URL(url).hostname,
      byline: article.byline ?? null,
      siteName: article.siteName ?? new URL(url).hostname.replace("www.", ""),
      content,
      excerpt: article.excerpt ?? null,
      wordCount: article.length ?? 0,
      readTime: estimateReadTime(article.textContent ?? ""),
    };
  } catch {
    return null;
  }
}

export async function extractContent(url: string): Promise<ReaderContent | null> {
  const parsed = new URL(url);

  if (parsed.hostname === "www.reddit.com" || parsed.hostname === "reddit.com") {
    const reddit = await fetchRedditContent(url);
    if (reddit) return reddit;
  }

  return fetchArticleContent(url);
}
