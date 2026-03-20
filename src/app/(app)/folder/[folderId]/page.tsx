import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { FolderView } from "@/components/links/folder-view";
import type { FolderWithCount } from "@/types";

interface FolderPageProps {
  params: Promise<{ folderId: string }>;
}

export default async function FolderPage({ params }: FolderPageProps) {
  const { folderId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: folderData } = await supabase
    .from("folders")
    .select("*")
    .eq("id", folderId)
    .eq("user_id", user.id)
    .single();

  if (!folderData) notFound();

  const folder = { ...(folderData as FolderWithCount), link_count: 0 };

  return <FolderView folder={folder} />;
}
