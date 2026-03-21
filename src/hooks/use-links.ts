import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Link } from "@/types";
import type { CreateLinkInput, UpdateLinkInput, LinkFilters } from "@/lib/validations/link";

export const linksKey = (filters?: LinkFilters) =>
  filters ? ["links", filters] : ["links"];

async function fetchLinks(filters?: LinkFilters): Promise<Link[]> {
  const params = new URLSearchParams();
  if (filters?.status)       params.set("status",       filters.status);
  if (filters?.folder_id)    params.set("folder_id",    filters.folder_id);
  if (filters?.content_type) params.set("content_type", filters.content_type);
  if (filters?.has_notes)    params.set("has_notes",    "true");
  if (filters?.search)       params.set("search",       filters.search);
  if (filters?.tag)          params.set("tag",          filters.tag);

  const res = await fetch(`/api/links?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch links");
  return res.json();
}

async function fetchMetadata(url: string) {
  const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error("Failed to fetch metadata");
  return res.json() as Promise<{
    title: string | null;
    description: string | null;
    image_url: string | null;
    reading_time_minutes: number | null;
  }>;
}

async function createLinkApi(data: CreateLinkInput): Promise<Link> {
  const res = await fetch("/api/links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save link");
  return res.json();
}

async function updateLinkApi({
  id,
  ...data
}: UpdateLinkInput & { id: string }): Promise<Link> {
  const res = await fetch(`/api/links/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update link");
  return res.json();
}

async function deleteLinkApi(id: string): Promise<void> {
  const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete link");
}

export function useLinks(filters?: LinkFilters) {
  return useQuery({
    queryKey: linksKey(filters),
    queryFn: () => fetchLinks(filters),
  });
}

export function useCheckDuplicate(url: string) {
  return useQuery({
    queryKey: ["links", "check", url],
    queryFn: async () => {
      const res = await fetch(`/api/links/check?url=${encodeURIComponent(url)}`);
      if (!res.ok) return { exists: false, link: null };
      return res.json() as Promise<{ exists: boolean; link: Pick<Link, "id" | "title" | "url" | "status"> | null }>;
    },
    enabled: url.length > 0,
    staleTime: 30 * 1000,
  });
}

export function useMetadata(url: string, enabled: boolean) {
  return useQuery({
    queryKey: ["metadata", url],
    queryFn: () => fetchMetadata(url),
    enabled: enabled && url.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLinkApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLinkApi,
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ["links"] });
      const queries = queryClient.getQueriesData<Link[]>({ queryKey: ["links"] });
      queries.forEach(([key, old]) => {
        if (!old) return;
        const newLinks = old.map((l) => (l.id === updated.id ? { ...l, ...updated } : l));
        // If this cached query filters by status, drop links that no longer match
        const keyFilters = key[1] as { status?: string } | undefined;
        queryClient.setQueryData<Link[]>(
          key,
          keyFilters?.status
            ? newLinks.filter((l) => l.status === keyFilters.status)
            : newLinks
        );
      });
      return { queries };
    },
    onError: (_err, _vars, context) => {
      context?.queries.forEach(([key, old]) => {
        queryClient.setQueryData(key, old);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLinkApi,
    onSuccess: (_data, deletedId) => {
      const queries = queryClient.getQueriesData<Link[]>({ queryKey: ["links"] });
      queries.forEach(([key, old]) => {
        if (old) {
          queryClient.setQueryData<Link[]>(
            key,
            old.filter((l) => l.id !== deletedId)
          );
        }
      });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
