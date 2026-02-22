import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface EmailHookPayload {
  user: {
    email: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

serve(async (req) => {
  const payload: EmailHookPayload = await req.json();
  const { user, email_data } = payload;

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  // If no Resend key, just return empty so Supabase sends default email
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({}), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build the magic link confirmation URL
  const confirmUrl = `${SUPABASE_URL}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type === 'signup' ? 'signup' : 'magiclink'}&redirect_to=${encodeURIComponent(email_data.redirect_to)}`;

  let subject = "Your MailFlow Login Link";
  let description = "Click the button below to sign in to your account:";

  switch (email_data.email_action_type) {
    case "signup":
      subject = "Welcome to MailFlow — Confirm Your Email";
      description = "Click the button below to confirm your email and get started:";
      break;
    case "login":
    case "magiclink":
    case "recovery":
      subject = "Your MailFlow Login Link";
      description = "Click the button below to sign in to your account:";
      break;
    case "email_change":
      subject = "Confirm Email Change";
      description = "Click the button below to confirm your email change:";
      break;
  }

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="400" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <tr><td style="background:linear-gradient(135deg,#0d9488,#14b8a6);padding:32px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">MailFlow</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#52525b;font-size:15px;line-height:1.6;margin:0 0 24px;">${description}</p>
          <div style="text-align:center;margin:0 0 24px;">
            <a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#14b8a6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">Sign In to MailFlow</a>
          </div>
          <p style="color:#a1a1aa;font-size:13px;line-height:1.5;margin:0;">This link expires in 10 minutes. If you didn't request this, please ignore this email.</p>
        </td></tr>
        <tr><td style="background-color:#f4f4f5;padding:16px 32px;text-align:center;">
          <p style="color:#a1a1aa;font-size:12px;margin:0;">&copy; MailFlow</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  console.log("Sending magic link email to:", user.email, "type:", email_data.email_action_type);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "MailFlow <onboarding@resend.dev>",
        to: [user.email],
        subject,
        html: htmlBody,
      }),
    });

    const responseBody = await res.text();
    console.log("Resend response:", res.status, responseBody);

    return new Response(JSON.stringify({}), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Email send error:", error);
    return new Response(JSON.stringify({}), {
      headers: { "Content-Type": "application/json" },
    });
  }
});
