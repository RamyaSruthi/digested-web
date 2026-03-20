import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Highlight } from "@/types";

export interface HighlightWithLink extends Highlight {
  links: { id: string; title: string | null; url: string };
}

async function fetchHighlights(linkId?: string): Promise<Highlight[]> {
  const url = linkId
    ? `/api/highlights?link_id=${linkId}`
    : `/api/highlights`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch highlights");
  return res.json();
}

async function fetchAllHighlights(): Promise<HighlightWithLink[]> {
  const res = await fetch("/api/highlights");
  if (!res.ok) throw new Error("Failed to fetch highlights");
  return res.json();
}

async function createHighlight(data: {
  link_id: string;
  text: string;
  color: string;
}): Promise<Highlight> {
  const res = await fetch("/api/highlights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create highlight");
  return res.json();
}

async function deleteHighlight(id: string): Promise<void> {
  const res = await fetch(`/api/highlights/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete highlight");
}

export function useHighlights(linkId: string, initialData?: Highlight[]) {
  return useQuery({
    queryKey: ["highlights", linkId],
    queryFn: () => fetchHighlights(linkId),
    staleTime: 1000 * 60 * 5,
    initialData: initialData,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}

export function useAllHighlights() {
  return useQuery({
    queryKey: ["highlights"],
    queryFn: fetchAllHighlights,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateHighlight(linkId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHighlight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights", linkId] });
      queryClient.invalidateQueries({ queryKey: ["highlights"] });
    },
  });
}

export function useDeleteHighlight(linkId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteHighlight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights", linkId] });
      queryClient.invalidateQueries({ queryKey: ["highlights"] });
    },
  });
}
