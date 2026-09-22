/** Display helpers for the signed-in user returned by `api.users.viewer`. */

type ViewerLike = { name: string | null; email: string | null } | null | undefined;

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  "resend-otp": "Email code",
  password: "Password",
};

/** The name to show: chosen name, provider name, or the email's local part. */
export function displayName(viewer: ViewerLike) {
  if (!viewer) return null;
  if (viewer.name) return viewer.name;
  if (viewer.email) return viewer.email.split("@")[0]!;
  return null;
}

export function providerLabel(provider: string) {
  return PROVIDER_LABELS[provider] ?? provider;
}
