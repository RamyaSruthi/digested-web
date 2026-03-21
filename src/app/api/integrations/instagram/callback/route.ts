import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/app/settings?instagram=denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/app/settings?instagram=error`);
  }

  // CSRF check
  const storedState = request.cookies.get("instagram_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${origin}/app/settings?instagram=error`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID!;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/integrations/instagram/callback`;

  try {
    // Step 1: Exchange code for short-lived token
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenRes.ok) {
      console.error("Instagram token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${origin}/app/settings?instagram=error`);
    }

    const { access_token: shortToken, user_id: providerUserId } = await tokenRes.json();

    // Step 2: Exchange for long-lived token (60 days)
    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortToken}`
    );

    if (!longTokenRes.ok) {
      console.error("Instagram long-lived token exchange failed:", await longTokenRes.text());
      return NextResponse.redirect(`${origin}/app/settings?instagram=error`);
    }

    const { access_token: longToken, expires_in } = await longTokenRes.json();

    // Step 3: Fetch username
    const meRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${longToken}`
    );
    const meData = meRes.ok ? await meRes.json() : {};
    const username: string | null = meData.username ?? null;

    const tokenExpiresAt = new Date(Date.now() + (expires_in as number) * 1000).toISOString();

    // Step 4: Upsert into integrations table
    const admin = createAdminClient();
    const { error: upsertError } = await admin
      .from("integrations")
      .upsert(
        {
          user_id: user.id,
          provider: "instagram",
          access_token: longToken,
          provider_user_id: String(providerUserId),
          provider_username: username,
          token_expires_at: tokenExpiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" }
      );

    if (upsertError) {
      console.error("Failed to store Instagram token:", upsertError);
      return NextResponse.redirect(`${origin}/app/settings?instagram=error`);
    }

    const response = NextResponse.redirect(`${origin}/app/settings?instagram=connected`);
    response.cookies.delete("instagram_oauth_state");
    return response;
  } catch (err) {
    console.error("Instagram callback error:", err);
    return NextResponse.redirect(`${origin}/app/settings?instagram=error`);
  }
}
