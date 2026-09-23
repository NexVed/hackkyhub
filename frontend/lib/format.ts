/** Shared display formatting for hackathon data. */

export function compact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    Math.round(value),
  );
}

export function money(amount: number, currency?: string | null) {
  const code = (currency ?? "UNKNOWN").trim().toUpperCase();
  if (!code || code === "UNKNOWN") return compact(amount);
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    // Some platforms report non-ISO currency labels.
    return `${compact(amount)} ${code}`;
  }
}

export function relativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function formatCountdown(hoursLeft: number) {
  if (hoursLeft < 1) return "under 1h";
  if (hoursLeft < 48) return `${hoursLeft}h left`;
  return `${Math.round(hoursLeft / 24)}d left`;
}

function parse(value?: string | null) {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : new Date(t);
}

/** "12 Oct – 14 Oct 2026", "12 Oct 2026", or null when no usable dates. */
export function formatDateRange(start?: string | null, end?: string | null) {
  const s = parse(start);
  const e = parse(end);
  const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const full = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (s && e) return `${day(s)} – ${full(e)}`;
  if (s) return full(s);
  if (e) return `Ends ${full(e)}`;
  return null;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
