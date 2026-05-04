export type SendReportEmailInput = {
  to: string;
  subject: string;
  text: string;
  /** Optional HTML body — wire when integrating a provider that supports it */
  html?: string;
};

export type SendReportEmailResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Sends a purchased-report email. Replace implementation with Resend, SendGrid, SES, etc.
 * Keep this module provider-agnostic: callers only pass normalized subject/body.
 */
export async function sendReportEmail(
  input: SendReportEmailInput,
): Promise<SendReportEmailResult> {
  void input.html;
  // TODO: integrate Resend / SendGrid / AWS SES — use env for API keys and templates.
  console.log("[sendReportEmail:mock]", {
    to: input.to,
    subject: input.subject,
    chars: input.text.length,
  });
  return { ok: true };
}
