import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "HackkyHub — Find hackathons, build teams",
  description:
    "Discover hackathons, meet builders, and ship projects that win.",
};

export default function Home() {
  return <LandingPage />;
}
