import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Web Share Target sends title, text, url
  const url = searchParams.get("url") ?? searchParams.get("text") ?? "";
  const title = searchParams.get("title") ?? "";

  // Redirect to app with share params so the AddLinkDialog opens pre-filled
  const params = new URLSearchParams();
  if (url) params.set("shareUrl", url);
  if (title) params.set("shareTitle", title);

  return NextResponse.redirect(
    new URL(`/app?${params.toString()}`, request.url)
  );
}
