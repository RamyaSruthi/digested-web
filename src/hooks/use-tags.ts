import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LinkTag } from "@/types";

const tagsKey = (linkId: string) => ["tags", linkId];

export interface TagWithCount { name: string; count: number; }

export function useAllTags() {
  return useQuery<TagWithCount[]>({
    queryKey: ["tags", "all"],
    queryFn: async () => {
      const res = await fetch("/api/tags");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

async function fetchTags(linkId: string): Promise<LinkTag[]> {
  const res = await fetch(`/api/links/${linkId}/tags`);
  if (!res.ok) throw new Error("Failed to fetch tags");
  return res.json();
}

async function addTagApi(linkId: string, name: string): Promise<LinkTag> {
  const res = await fetch(`/api/links/${linkId}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (res.status === 409) throw new Error("Tag already exists");
  if (!res.ok) throw new Error("Failed to add tag");
  return res.json();
}

async function removeTagApi(linkId: string, name: string): Promise<void> {
  const res = await fetch(`/api/links/${linkId}/tags/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove tag");
}

export function useTags(linkId: string) {
  return useQuery({
    queryKey: tagsKey(linkId),
    queryFn: () => fetchTags(linkId),
    enabled: !!linkId,
  });
}

export function useAddTag(linkId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => addTagApi(linkId, name),
    onSuccess: (newTag) => {
      queryClient.setQueryData<LinkTag[]>(tagsKey(linkId), (old = []) => [
        ...old,
        newTag,
      ]);
    },
  });
}

export function useRemoveTag(linkId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => removeTagApi(linkId, name),
    onSuccess: (_data, removedName) => {
      queryClient.setQueryData<LinkTag[]>(tagsKey(linkId), (old = []) =>
        old.filter((t) => t.name !== removedName)
      );
    },
  });
}
