import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FolderWithCount } from "@/types";
import type { CreateFolderInput, UpdateFolderInput } from "@/lib/validations/folder";

const FOLDERS_KEY = ["folders"] as const;

async function fetchFolders(): Promise<FolderWithCount[]> {
  const res = await fetch("/api/folders");
  if (!res.ok) throw new Error("Failed to fetch folders");
  return res.json();
}

async function createFolderApi(data: CreateFolderInput): Promise<FolderWithCount> {
  const res = await fetch("/api/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create folder");
  const folder = await res.json();
  return { ...folder, link_count: 0 };
}

async function updateFolderApi({
  id,
  ...data
}: UpdateFolderInput & { id: string }): Promise<FolderWithCount> {
  const res = await fetch(`/api/folders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update folder");
  const folder = await res.json();
  return { ...folder, link_count: folder.link_count ?? 0 };
}

async function deleteFolderApi(id: string): Promise<void> {
  const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete folder");
}

export function useFolders() {
  return useQuery({
    queryKey: FOLDERS_KEY,
    queryFn: fetchFolders,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFolderApi,
    onSuccess: (newFolder) => {
      queryClient.setQueryData<FolderWithCount[]>(FOLDERS_KEY, (old = []) => [
        ...old,
        newFolder,
      ]);
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFolderApi,
    onSuccess: (updatedFolder) => {
      queryClient.setQueryData<FolderWithCount[]>(FOLDERS_KEY, (old = []) =>
        old.map((f) =>
          f.id === updatedFolder.id
            ? { ...updatedFolder, link_count: f.link_count }
            : f
        )
      );
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFolderApi,
    onSuccess: (_data, deletedId) => {
      queryClient.setQueryData<FolderWithCount[]>(FOLDERS_KEY, (old = []) =>
        old.filter((f) => f.id !== deletedId)
      );
    },
  });
}
