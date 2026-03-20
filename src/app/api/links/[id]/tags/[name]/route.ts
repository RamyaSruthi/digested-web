import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string; name: string }>;
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id, name } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("link_tags")
    .delete()
    .eq("link_id", id)
    .eq("user_id", user.id)
    .eq("name", decodeURIComponent(name));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
