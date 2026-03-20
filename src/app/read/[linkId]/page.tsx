import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractContent } from "@/lib/reader";
import { ReaderView } from "./reader-view";
import type { Link, Highlight } from "@/types";

interface Props {
  params: Promise<{ linkId: string }>;
}

export default async function ReaderPage({ params }: Props) {
  const { linkId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: linkData }, { data: highlightsData }] = await Promise.all([
    supabase.from("links").select("*").eq("id", linkId).eq("user_id", user.id).single(),
    supabase.from("highlights").select("*").eq("link_id", linkId).eq("user_id", user.id).order("created_at"),
  ]);

  if (!linkData) notFound();
  const link = linkData as Link;
  const initialHighlights = (highlightsData ?? []) as Highlight[];

  const content = await extractContent(link.url);

  return <ReaderView link={link} content={content} initialHighlights={initialHighlights} />;
}
