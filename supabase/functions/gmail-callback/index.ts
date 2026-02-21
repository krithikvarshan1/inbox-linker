import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error("Google OAuth error:", error);
      return redirectWithError("Google authorization was denied");
    }

    if (!code || !stateParam) {
      return redirectWithError("Missing authorization code");
    }

    const state = JSON.parse(atob(stateParam));
    const { user_id, redirect_url } = state;

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return redirectWithError("Google credentials not configured");
    }

    const callbackUrl = `${SUPABASE_URL}/functions/v1/gmail-callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Token exchange failed:", tokens);
      return redirectWithError("Failed to exchange authorization code");
    }

    // Get user email from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json();

    // Store in connected_accounts using service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Upsert: delete existing then insert
    await supabase
      .from('connected_accounts')
      .delete()
      .eq('user_id', user_id)
      .eq('provider', 'gmail')
      .eq('email', userInfo.email);

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    const { error: insertError } = await supabase.from('connected_accounts').insert({
      user_id,
      provider: 'gmail',
      email: userInfo.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("DB insert error:", insertError);
      return redirectWithError("Failed to save account");
    }

    // Redirect back to app
    const appUrl = redirect_url || SUPABASE_URL.replace('.supabase.co', '');
    const successUrl = `${getAppOrigin(redirect_url)}/dashboard/connections?success=gmail`;
    return Response.redirect(successUrl, 302);
  } catch (err) {
    console.error("Callback error:", err);
    return redirectWithError("An unexpected error occurred");
  }
});

function getAppOrigin(redirectUrl?: string): string {
  if (redirectUrl) {
    try {
      const u = new URL(redirectUrl);
      return u.origin;
    } catch {}
  }
  return 'https://mail-craft-flow.lovable.app';
}

function redirectWithError(message: string): Response {
  const url = `https://mail-craft-flow.lovable.app/dashboard/connections?error=${encodeURIComponent(message)}`;
  return Response.redirect(url, 302);
}
