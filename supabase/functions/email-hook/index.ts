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
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return new Response(JSON.stringify({}), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const otp = email_data.token;
  let subject = "";
  let description = "";

  switch (email_data.email_action_type) {
    case "signup":
      subject = "Your MailFlow Verification Code";
      description = "Use the code below to complete your registration:";
      break;
    case "login":
    case "magiclink":
    case "recovery":
      subject = "Your MailFlow Login Code";
      description = "Use the code below to sign in to your account:";
      break;
    case "email_change":
      subject = "Confirm Email Change";
      description = "Use the code below to confirm your email change:";
      break;
    default:
      subject = "Your MailFlow Code";
      description = "Use the code below:";
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
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Your Verification Code</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#52525b;font-size:15px;line-height:1.6;margin:0 0 24px;">${description}</p>
          <div style="background-color:#f0fdfa;border:2px dashed #14b8a6;border-radius:8px;padding:20px;text-align:center;margin:0 0 24px;">
            <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0d9488;font-family:monospace;">${otp}</span>
          </div>
          <p style="color:#a1a1aa;font-size:13px;line-height:1.5;margin:0;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
        </td></tr>
        <tr><td style="background-color:#f4f4f5;padding:16px 32px;text-align:center;">
          <p style="color:#a1a1aa;font-size:12px;margin:0;">&copy; MailFlow</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

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

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend error:", errorText);
    }

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
