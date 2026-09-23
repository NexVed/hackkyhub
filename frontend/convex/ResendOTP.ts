import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";

/**
 * Generates a cryptographically random 6-digit code.
 * Uses Web Crypto (available in the Convex runtime) so we avoid
 * pulling in an extra dependency.
 */
function generateOTP(): string {
  const values = new Uint32Array(6);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => (value % 10).toString()).join("");
}

/**
 * Email one-time-password provider for Convex Auth.
 *
 * Requires two Convex environment variables:
 *   AUTH_RESEND_KEY  - your Resend API key
 *   AUTH_EMAIL_FROM  - optional sender, defaults to Resend's sandbox address
 */
export const ResendOTP = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 10, // code is valid for 10 minutes
  async generateVerificationToken() {
    return generateOTP();
  },
  async sendVerificationRequest({ identifier: email, provider, token, expires }) {
    const resend = new ResendAPI(provider.apiKey);
    const minutes = Math.max(
      1,
      Math.round((expires.getTime() - Date.now()) / 60000),
    );

    const { error } = await resend.emails.send({
      from: process.env.AUTH_EMAIL_FROM ?? "HackkyHub <onboarding@resend.dev>",
      to: [email],
      subject: `${token} is your HackkyHub verification code`,
      text: `Your HackkyHub verification code is ${token}. It expires in ${minutes} minutes. If you didn't request this, you can ignore this email.`,
      html: `
<div style="background:#05050a;padding:40px 16px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;">
  <div style="max-width:440px;margin:0 auto;background:#0b0b14;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px 32px;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#7c7c96;">HackkyHub</p>
    <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:#ffffff;font-weight:600;">Verify your email</h1>
    <p style="margin:0 0 26px;font-size:14px;line-height:1.6;color:#a1a1b5;">
      Enter this code to finish signing in. It expires in ${minutes} minutes.
    </p>
    <div style="background:linear-gradient(135deg,rgba(99,102,241,.18),rgba(168,85,247,.12));border:1px solid rgba(139,92,246,.35);border-radius:14px;padding:22px;text-align:center;">
      <span style="font-size:34px;font-weight:700;letter-spacing:.34em;color:#ffffff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${token}</span>
    </div>
    <p style="margin:26px 0 0;font-size:12px;line-height:1.6;color:#6b6b82;">
      If you didn't try to sign in to HackkyHub, you can safely ignore this email.
    </p>
  </div>
</div>`,
    });

    if (error) {
      throw new Error(`Resend could not send the OTP email: ${JSON.stringify(error)}`);
    }
  },
});
