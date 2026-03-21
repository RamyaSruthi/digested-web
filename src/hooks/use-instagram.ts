import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface InstagramStatus {
  connected: boolean;
  username: string | null;
}

async function fetchInstagramStatus(): Promise<InstagramStatus> {
  const res = await fetch("/api/integrations/instagram/status");
  if (!res.ok) throw new Error("Failed to fetch Instagram status");
  return res.json();
}

async function disconnectInstagram(): Promise<void> {
  const res = await fetch("/api/integrations/instagram/disconnect", { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to disconnect Instagram");
}

export function useInstagramStatus() {
  return useQuery({
    queryKey: ["instagram", "status"],
    queryFn: fetchInstagramStatus,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDisconnectInstagram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectInstagram,
    onSuccess: () => {
      queryClient.setQueryData<InstagramStatus>(["instagram", "status"], {
        connected: false,
        username: null,
      });
    },
  });
}
