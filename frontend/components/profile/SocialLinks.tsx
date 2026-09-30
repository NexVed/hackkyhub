import { Github, Linkedin, MessageCircle, ArrowUpRight } from "lucide-react";
import { SOCIAL_PLATFORMS, normalizeSocialLinks, type SocialLinks as Links } from "@/convex/lib/socialLinks";

export function SocialLinks({ links }: { links: Links }) {
  // Validate individually so one stale bad URL doesn't hide valid links.
  return <div className="flex flex-wrap gap-2">{SOCIAL_PLATFORMS.map(platform => {
    let href: string | undefined;
    try { href = normalizeSocialLinks({ [platform.key]: links[platform.key] })[platform.key]; } catch { return null; }
    if (!href) return null;
    const Icon = platform.key === "github" ? Github : platform.key === "linkedin" ? Linkedin : MessageCircle;
    return <a key={platform.key} href={href} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-violet-400/50 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:text-violet-200" aria-label={`Open ${platform.label} profile (new tab)`}>{platform.key === "x" ? <span aria-hidden="true" className="text-base leading-none">𝕏</span> : <Icon className="size-4" />}{platform.label}<ArrowUpRight className="size-3 opacity-40 transition group-hover:opacity-100" /></a>;
  })}</div>;
}
