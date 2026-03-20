import { useQuery } from "@tanstack/react-query";
import type { ReaderContent } from "@/lib/reader";

async function fetchReaderContent(url: string): Promise<ReaderContent> {
  const res = await fetch(`/api/reader?url=${encodeURIComponent(url)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to extract content");
  }
  return res.json();
}

export function useReader(url: string | null) {
  return useQuery({
    queryKey: ["reader", url],
    queryFn: () => fetchReaderContent(url!),
    enabled: !!url,
    staleTime: 1000 * 60 * 60, // cache for 1 hour
    retry: false,
  });
}
