export type Hackathon = {
  _id: string;
  name: string;
  description?: string;
  url: string;
  redirect_url?: string;
  platform: string;
  platform_logo?: string;
  banner_url?: string;
  logo_url?: string;
  prizes?: string;
  prize_amount?: number;
  prize_currency?: string;
  start_date?: string;
  end_date?: string;
  registration_deadline?: string;
  location?: string;
  is_online: boolean;
  is_mnc?: boolean;
  organizer?: string;
  themes?: string[];
  status: string;
  registered_count?: number;
  view_count?: number;
};

export function safeExternalUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export async function loadHackathons(mncOnly = false): Promise<Hackathon[]> {
  const base = process.env.SCRAPER_API_URL;
  if (!base) throw new Error("SCRAPER_API_URL is not configured");
  const endpoint = `${base.replace(/\/$/, "")}/api/v1/hackathons${mncOnly ? "/mnc" : ""}?limit=100`;
  const response = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Scraper returned ${response.status}`);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("Invalid hackathon response");
  return data.filter((item): item is Hackathon =>
    typeof item === "object" && item !== null && typeof item._id === "string" &&
    typeof item.name === "string" && typeof item.platform === "string" &&
    typeof item.url === "string" && (!mncOnly || item.is_mnc === true));
}
