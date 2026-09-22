/**
 * Hackathon phase rules, shared by Convex queries and the browser so both
 * agree on what "upcoming", "live" and "ended" mean. Pure functions only.
 */

type Dated = {
  start_date?: string;
  end_date?: string;
  status: string;
};

export type Phase = "upcoming" | "ongoing" | "completed" | "unknown";

/** Parses a scraped date string; returns null when it is missing or unusable. */
export function toTime(value?: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Real dates beat the scraped `status` string, which goes stale the moment a
 * hackathon starts. We only fall back to `status` when no date is usable.
 */
export function phaseOf(hackathon: Dated, now: number): Phase {
  const start = toTime(hackathon.start_date);
  const end = toTime(hackathon.end_date);

  if (start !== null && end !== null) {
    if (now < start) return "upcoming";
    return now <= end ? "ongoing" : "completed";
  }
  if (start !== null) return now < start ? "upcoming" : "ongoing";
  if (end !== null) return now <= end ? "ongoing" : "completed";

  switch ((hackathon.status ?? "").trim().toLowerCase()) {
    case "upcoming":
    case "open":
      return "upcoming";
    case "ongoing":
    case "live":
    case "active":
      return "ongoing";
    case "completed":
    case "closed":
    case "ended":
    case "expired":
      return "completed";
    default:
      return "unknown";
  }
}
