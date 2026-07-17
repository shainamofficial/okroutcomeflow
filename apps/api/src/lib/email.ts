// Minimal transactional email sender. Uses Resend's HTTP API when
// RESEND_API_KEY is set; otherwise logs the message to the console so dev/CI
// (and self-hosters without a provider) keep working. Swap the transport here
// to move to SMTP/SES/etc. without touching callers.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Resend requires a verified sender; their sandbox address works for testing.
const EMAIL_FROM = process.env.EMAIL_FROM ?? "OutcomeFlow <onboarding@resend.dev>";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  /** Plain-text fallback; also what the dev console logs. */
  text?: string;
}

/** True when a real email provider is configured (vs. the console fallback). */
export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY;
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log(
      `[email:dev] no RESEND_API_KEY — not sending.\n  to: ${msg.to}\n  subject: ${msg.subject}\n  ${msg.text ?? msg.html}`
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      ...(msg.text ? { text: msg.text } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send email (${res.status}): ${body}`);
  }
}

/** Reset-password email used by Better Auth's sendResetPassword hook. */
export function resetPasswordEmail(url: string, name?: string): { subject: string; html: string; text: string } {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return {
    subject: "Reset your OutcomeFlow password",
    text: `${greeting}\n\nReset your OutcomeFlow password using this link (expires in 1 hour):\n${url}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <p>${greeting}</p>
        <p>We received a request to reset your OutcomeFlow password. Click the button below to choose a new one. This link expires in 1 hour.</p>
        <p style="margin: 24px 0;">
          <a href="${url}" style="background: #6d28d9; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">Reset your password</a>
        </p>
        <p style="color: #666; font-size: 13px;">If you didn't request this, you can safely ignore this email. The link only works once.</p>
      </div>
    `,
  };
}
