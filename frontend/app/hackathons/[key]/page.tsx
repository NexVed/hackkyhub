import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { HackathonDetail } from "@/components/hackathons/HackathonDetail";

type Props = { params: Promise<{ key: string }> };

function decodeKey(key: string) {
  try {
    return decodeURIComponent(key);
  } catch {
    return key; // Malformed escapes: let the lookup return "not found".
  }
}

// Public page: proxy.ts only protects /dashboard, so anyone can read this.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  try {
    const hackathon = await fetchQuery(api.hackathons.getByKey, { key: decodeKey(key) });
    if (!hackathon) return { title: "Hackathon not found · HackkyHub" };
    return {
      title: `${hackathon.name} · HackkyHub`,
      description: hackathon.description?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160),
    };
  } catch {
    return { title: "Hackathon · HackkyHub" };
  }
}

export default async function HackathonPage({ params }: Props) {
  const { key } = await params;
  return <HackathonDetail hackathonKey={decodeKey(key)} />;
}
