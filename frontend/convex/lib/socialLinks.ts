export const SOCIAL_PLATFORMS = [
  { key: "github", label: "GitHub", placeholder: "https://github.com/yourname", hosts: ["github.com"] },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/in/yourname", hosts: ["linkedin.com", "www.linkedin.com"] },
  { key: "reddit", label: "Reddit", placeholder: "https://www.reddit.com/user/yourname", hosts: ["reddit.com", "www.reddit.com", "old.reddit.com"] },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/yourname", hosts: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"] },
] as const;
export type SocialKey = typeof SOCIAL_PLATFORMS[number]["key"];
export type SocialLinks = Partial<Record<SocialKey, string>>;

export function normalizeSocialLinks(input: SocialLinks): SocialLinks {
  const result: SocialLinks = {};
  for (const platform of SOCIAL_PLATFORMS) {
    const value = input[platform.key]?.trim();
    if (!value) continue;
    let url: URL;
    try { url = new URL(value); } catch { throw new Error(`Enter a full HTTPS ${platform.label} profile URL.`); }
    if (value.length > 300 || url.protocol !== "https:" || !(platform.hosts as readonly string[]).includes(url.hostname) || url.username || url.password || url.port || /[\u0000-\u0020\\]/.test(value) || url.pathname === "/") {
      throw new Error(`Use a valid HTTPS profile link from ${platform.label}.`);
    }
    // Tracking query strings and fragments aren't part of the profile address.
    url.search = "";
    url.hash = "";
    result[platform.key] = url.toString();
  }
  return result;
}
