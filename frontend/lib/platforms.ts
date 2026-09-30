/** Registered ingestion sources; a missing feed remains visible with zero rows. */
export const HACKATHON_PLATFORMS = [
  { id: "devpost", label: "Devpost" },
  { id: "mlh", label: "MLH" },
  { id: "unstop", label: "Unstop" },
  { id: "hack2skill", label: "Hack2Skill" },
  { id: "devnovate", label: "Devnovate" },
  { id: "devfolio", label: "Devfolio" },
  { id: "hackerearth", label: "HackerEarth" },
  { id: "commudle", label: "Commudle" },
  { id: "hackculture", label: "HackCulture" },
] as const;

export function allPlatformRows<T extends { platform: string; total: number; upcoming: number }>(rows: T[]) {
  const result: { platform: string; total: number; upcoming: number }[] = [...rows];
  const present = new Set(rows.map(row => row.platform));
  for (const { id } of HACKATHON_PLATFORMS) if (!present.has(id)) result.push({ platform: id, total: 0, upcoming: 0 });
  return result;
}
export function platformLabel(id: string) {
  return HACKATHON_PLATFORMS.find(platform => platform.id === id)?.label ?? id;
}
