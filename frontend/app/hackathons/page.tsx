import { redirect } from "next/navigation";

// There is no standalone list page; the explorer lives on the dashboard.
export default function HackathonsIndex() {
  redirect("/dashboard#explore");
}
