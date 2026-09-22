/** Display helpers for scraped hackathon records. */

/** Internal detail-page path for a hackathon. */
export function hackathonPath(hackathon: { _id: string }) {
  return `/hackathons/${hackathon._id}`;
}

/**
 * Returns the URL only when it is plain http(s). Scraped data is untrusted,
 * so anything else (javascript:, data:, relative junk) is dropped.
 */
export function safeHttpUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** The official page to send people to: the platform's redirect, else its listing. */
export function officialUrl(hackathon: { url: string; redirect_url?: string }) {
  return safeHttpUrl(hackathon.redirect_url) ?? safeHttpUrl(hackathon.url);
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * Some platforms return descriptions as HTML. React renders strings as text,
 * so this is for readability, not safety: keep line breaks, drop tags.
 */
export function plainText(value: string) {
  return value
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
      if (code[0] === "#") {
        const n = code[1]?.toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
      }
      return ENTITIES[code.toLowerCase()] ?? match;
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Some sources list a prize of "$0" or 0. That is an absent prize, not a
 * prize worth nothing, so it is shown as "not listed" rather than "$0".
 */
export function isZeroPrizeText(value: string) {
  const text = value.trim();
  if (!/\d/.test(text)) return false;
  return /^[^\d]*0+(\.0+)?[^\d]*$/.test(text);
}

/** Prize text to display, or null when the source listed none. */
export function prizeText(
  hackathon: { prize_amount?: number; prize_currency?: string; prizes?: string },
  money: (amount: number, currency?: string | null) => string,
) {
  if (typeof hackathon.prize_amount === "number" && hackathon.prize_amount > 0) {
    return money(hackathon.prize_amount, hackathon.prize_currency);
  }
  const text = hackathon.prizes?.trim();
  if (!text || isZeroPrizeText(text)) return null;
  return text;
}

/** True when the registration deadline has passed. */
export function registrationClosed(hackathon: { registration_deadline?: string }, now: number) {
  if (!hackathon.registration_deadline) return false;
  const deadline = Date.parse(hackathon.registration_deadline);
  return !Number.isNaN(deadline) && deadline <= now;
}
