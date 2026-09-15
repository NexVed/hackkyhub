import Image from "next/image";
import { loadHackathons, safeExternalUrl } from "@/lib/hackathons";

function displayDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export async function HackathonDirectory({ mncOnly = false }: { mncOnly?: boolean }) {
  let hackathons;
  try {
    hackathons = await loadHackathons(mncOnly);
  } catch {
    return <p role="status" className="mt-6 rounded-xl border border-white/10 p-6 text-zinc-400">Hackathons are temporarily unavailable. Please try again shortly.</p>;
  }
  if (!hackathons.length) {
    return <p className="mt-6 rounded-xl border border-white/10 p-6 text-zinc-400">{mncOnly ? "No corporate hackathons have been listed yet." : "No hackathons have been listed yet."}</p>;
  }
  return (
    <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {hackathons.map((hackathon) => {
        const destination = safeExternalUrl(hackathon.redirect_url) || safeExternalUrl(hackathon.url);
        const banner = safeExternalUrl(hackathon.banner_url);
        const logo = safeExternalUrl(hackathon.logo_url);
        const platformLogo = hackathon.platform_logo?.startsWith("/hackathons-logo/")
          ? hackathon.platform_logo : "/favicon.ico";
        const deadline = displayDate(hackathon.registration_deadline);
        const start = displayDate(hackathon.start_date);
        return (
          <article key={hackathon._id} className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40">
            {banner && <Image unoptimized src={banner} alt={`${hackathon.name} banner`} width={640} height={280} className="h-40 w-full object-cover" />}
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Image unoptimized src={platformLogo} alt="" width={24} height={24} className="h-6 w-6 rounded object-contain" />
                <span className="capitalize">{hackathon.platform}</span>
                <span className="ml-auto capitalize">{hackathon.status}</span>
              </div>
              <h2 className="text-lg font-semibold">{hackathon.name}</h2>
              {hackathon.organizer && <div className="flex items-center gap-2 text-sm text-zinc-400">
                {logo && <Image unoptimized src={logo} alt="" width={24} height={24} className="h-6 w-6 rounded object-contain" />}
                {hackathon.organizer}
              </div>}
              {hackathon.description && <p className="line-clamp-3 text-sm text-zinc-400">{hackathon.description}</p>}
              <dl className="space-y-1 text-sm">
                <div><dt className="inline text-zinc-500">Location: </dt><dd className="inline">{hackathon.location || (hackathon.is_online ? "Online" : "To be announced")}</dd></div>
                {hackathon.prizes && <div><dt className="inline text-zinc-500">Prizes: </dt><dd className="inline">{hackathon.prizes}</dd></div>}
                {start && <div><dt className="inline text-zinc-500">Starts: </dt><dd className="inline">{start}</dd></div>}
                {deadline && <div><dt className="inline text-zinc-500">Register by: </dt><dd className="inline">{deadline}</dd></div>}
                {hackathon.registered_count !== undefined && <div><dt className="inline text-zinc-500">Registered: </dt><dd className="inline">{hackathon.registered_count.toLocaleString("en-IN")}</dd></div>}
              </dl>
              {!!hackathon.themes?.length && <div className="flex flex-wrap gap-1">{hackathon.themes.map((theme) => <span key={theme} className="rounded-full bg-white/5 px-2 py-1 text-xs text-zinc-400">{theme}</span>)}</div>}
              {destination && <a href={destination} target="_blank" rel="noopener noreferrer" className="mt-auto rounded-lg bg-white px-4 py-2 text-center text-sm font-medium text-black hover:bg-zinc-200">View official event ↗</a>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
