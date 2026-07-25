// Transactional email via Resend's REST API (no SDK dependency). Entirely
// inert until RESEND_API_KEY is set, so dev and un-configured deployments are
// unaffected.

export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail({ to, subject, html, replyTo }: SendArgs): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: "Email is not configured" };
  }
  const from = process.env.RESEND_FROM || "Evenkeep <onboarding@resend.dev>";
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error("[email] send failed", resp.status, body);
      return { ok: false, error: `Email provider returned ${resp.status}` };
    }
    return { ok: true };
  } catch (err: any) {
    console.error("[email] send exception", err);
    return { ok: false, error: err?.message || "Failed to send email" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// A warm, grief-sensitive invite email. Inline styles only (email clients
// strip <style> and external CSS). Terracotta accent to match the app.
export function buildInviteEmail(args: {
  recipientName: string;
  familyName?: string | null;
  contactName?: string | null;
  link: string;
}): { subject: string; html: string } {
  const name = escapeHtml(args.recipientName || "there");
  const family = args.familyName ? escapeHtml(args.familyName) : null;
  const contact = args.contactName ? escapeHtml(args.contactName) : null;
  const link = args.link;

  const subject = family
    ? `A private invitation to share the ${family} family's belongings`
    : `A private invitation to share a loved one's belongings`;

  const intro = family
    ? `The ${family} family is using Evenkeep — a calm, private way to share a loved one's belongings so every keepsake lands with someone who'll treasure it.`
    : `Your family is using Evenkeep — a calm, private way to share a loved one's belongings so every keepsake lands with someone who'll treasure it.`;

  const signoff = contact
    ? `With care,<br/>${contact}`
    : `With care`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2b2018;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1ea;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fbf7f1;border:1px solid #ece2d5;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <div style="font-size:20px;font-weight:700;letter-spacing:-0.01em;color:#b45a2b;font-family:Georgia,'Times New Roman',serif;">Evenkeep</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0 32px;">
                <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.25;font-weight:700;font-family:Georgia,'Times New Roman',serif;color:#2b2018;">Hello ${name},</h1>
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#5b4d3e;">${intro}</p>
                <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#5b4d3e;">You have your own private space to quietly note what matters most to you. No one else sees your choices — and there's no rush.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 32px 8px 32px;">
                <a href="${link}" style="display:inline-block;background:#b45a2b;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:10px;">Open your private page</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px;">
                <p style="margin:0 0 8px 0;font-size:13px;line-height:1.6;color:#8a7b69;">Or paste this link into your browser:</p>
                <p style="margin:0 0 20px 0;font-size:13px;line-height:1.6;word-break:break-all;"><a href="${link}" style="color:#b45a2b;">${link}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px 32px;border-top:1px solid #ece2d5;">
                <p style="margin:16px 0 0 0;font-size:15px;line-height:1.6;color:#5b4d3e;">${signoff}</p>
                <p style="margin:16px 0 0 0;font-size:12px;line-height:1.5;color:#a1917d;">This link is private to you. If you weren't expecting this, you can safely ignore it.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}

// Account password-reset email.
export function buildPasswordResetEmail(args: { link: string }): { subject: string; html: string } {
  const link = args.link;
  const subject = "Reset your Evenkeep password";
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2b2018;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1ea;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fbf7f1;border:1px solid #ece2d5;border-radius:16px;">
          <tr><td style="padding:32px 32px 8px 32px;">
            <div style="font-size:20px;font-weight:700;color:#b45a2b;font-family:Georgia,'Times New Roman',serif;">Evenkeep</div>
          </td></tr>
          <tr><td style="padding:8px 32px 0 32px;">
            <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;font-family:Georgia,'Times New Roman',serif;">Reset your password</h1>
            <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#5b4d3e;">Click the button below to choose a new password. This link expires in one hour.</p>
          </td></tr>
          <tr><td align="center" style="padding:0 32px 8px 32px;">
            <a href="${link}" style="display:inline-block;background:#b45a2b;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:10px;">Reset password</a>
          </td></tr>
          <tr><td style="padding:16px 32px 32px 32px;">
            <p style="margin:0 0 8px 0;font-size:13px;color:#8a7b69;">Or paste this link into your browser:</p>
            <p style="margin:0 0 16px 0;font-size:13px;word-break:break-all;"><a href="${link}" style="color:#b45a2b;">${link}</a></p>
            <p style="margin:16px 0 0 0;font-size:12px;color:#a1917d;">If you didn't request this, you can safely ignore it — your password won't change.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  return { subject, html };
}
