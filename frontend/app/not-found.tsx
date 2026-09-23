import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/visuals/BrandMark";

export const metadata = { title: "Page not found · HackkyHub" };

/** Site-wide 404 for addresses that match no route. */
export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#07070d] px-4 text-white">
      <div className="pointer-events-none absolute -right-40 -top-32 h-[30rem] w-[30rem] rounded-full bg-violet-600/15 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-teal-500/10 blur-[130px]" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <BrandMark className="mx-auto h-10 w-10" />
        <p className="font-display mt-4 text-6xl italic text-white/80">404</p>
        <h1 className="mt-3 text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-white/50">
          There is nothing at this address. Check the link, or head back and explore from the dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Go to dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-white/12 px-4 py-2 text-sm text-white/75 transition-colors hover:text-white"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
