"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import { AnimatePresence, motion } from "motion/react";
import { Check, KeyRound, Loader2, Mail } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Panel, Skeleton, ease } from "@/components/dashboard/primitives";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { displayName, providerLabel } from "@/lib/profile";
import { cn } from "@/lib/utils";

type Viewer = NonNullable<FunctionReturnType<typeof api.users.viewer>>;

/** Settings page: account details and the editable public profile. */
export function ProfileSettings() {
  const viewer = useQuery(api.users.viewer, {});

  return (
    <div className="relative min-h-full overflow-hidden bg-[#07070d]">
      <div className="pointer-events-none absolute -right-32 -top-24 h-[26rem] w-[26rem] rounded-full bg-violet-600/15 blur-[130px]" />

      <div className="relative mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-200/60">Settings</p>
          <h1 className="font-display mt-1 text-3xl italic text-white sm:text-4xl">Your account</h1>
        </motion.div>

        {viewer === undefined ? (
          <Skeleton className="h-96 rounded-3xl" />
        ) : viewer === null ? (
          <Panel title="Signed out">
            <p className="text-sm text-white/50">Sign in to edit your profile.</p>
          </Panel>
        ) : (
          <>
            <AccountPanel viewer={viewer} />
            <ProfileForm key={viewer._id} viewer={viewer} />
          </>
        )}
      </div>
    </div>
  );
}

function AccountPanel({ viewer }: { viewer: Viewer }) {
  return (
    <Panel title="Account" subtitle="Managed by your sign-in method">
      <div className="flex items-center gap-4">
        <UserAvatar
          name={displayName(viewer)}
          image={viewer.image}
          className="font-display h-14 w-14 shrink-0 rounded-full border border-white/10 bg-[#161530] text-lg italic text-white"
        />
        <div className="min-w-0 space-y-1.5">
          {viewer.email && (
            <p className="flex items-center gap-2 truncate text-sm text-white/75">
              <Mail className="h-4 w-4 shrink-0 text-sky-300/80" /> {viewer.email}
              {viewer.emailVerified && (
                <span className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-200">
                  verified
                </span>
              )}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/45">
            <KeyRound className="h-3.5 w-3.5" /> Signs in with
            {viewer.providers.length === 0 ? (
              <span className="text-white/60">unknown</span>
            ) : (
              viewer.providers.map((provider) => (
                <span key={provider} className="rounded-md border border-white/12 bg-white/[0.05] px-1.5 py-0.5 text-white/70">
                  {providerLabel(provider)}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
      {!viewer.image && (
        <p className="mt-4 text-xs text-white/35">
          Sign in with Google or GitHub using the same email to show that account&apos;s photo here.
        </p>
      )}
    </Panel>
  );
}

function ProfileForm({ viewer }: { viewer: Viewer }) {
  const updateMyProfile = useMutation(api.users.updateMyProfile);
  const [name, setName] = useState(viewer.name ?? "");
  const [headline, setHeadline] = useState(viewer.headline ?? "");
  const [location, setLocation] = useState(viewer.location ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const dirty =
    name.trim() !== (viewer.name ?? "") ||
    headline.trim() !== (viewer.headline ?? "") ||
    location.trim() !== (viewer.location ?? "");

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setStatus("idle");
    setError(null);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      await updateMyProfile({ displayName: name, headline, location });
      setStatus("saved");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof ConvexError ? String(err.data) : "Could not save. Please try again.");
    }
  };

  return (
    <Panel title="Public profile" subtitle="Shown on your profile page and dashboard" delay={0.05}>
      <form onSubmit={onSubmit} className="space-y-5">
        <Field
          label="Name"
          value={name}
          onChange={edit(setName)}
          maxLength={60}
          required
          placeholder="Your full name"
          hint={
            viewer.providerName && viewer.providerName !== name.trim()
              ? { text: `From your sign-in provider: ${viewer.providerName}`, action: () => edit(setName)(viewer.providerName!) }
              : undefined
          }
        />
        <Field
          label="Headline"
          value={headline}
          onChange={edit(setHeadline)}
          maxLength={80}
          placeholder="e.g. Full-stack developer, ML enthusiast"
          optional
        />
        <Field
          label="Location"
          value={location}
          onChange={edit(setLocation)}
          maxLength={60}
          placeholder="e.g. Delhi, India"
          optional
        />

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={!dirty || status === "saving" || name.trim().length < 2}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.7)] transition-opacity disabled:opacity-40"
          >
            {status === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === "saving" ? "Saving…" : "Save changes"}
          </motion.button>
          <AnimatePresence>
            {status === "saved" && !dirty && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1.5 text-sm text-emerald-300"
              >
                <Check className="h-4 w-4" /> Saved
              </motion.span>
            )}
          </AnimatePresence>
          {error && (
            <p role="alert" className="text-sm text-rose-300">
              {error}
            </p>
          )}
        </div>
      </form>
    </Panel>
  );
}

function Field({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  required,
  optional,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder: string;
  required?: boolean;
  optional?: boolean;
  hint?: { text: string; action: () => void };
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm font-medium text-white/80">
        <span>
          {label} {optional && <span className="text-xs font-normal text-white/35">optional</span>}
        </span>
        <span className={cn("text-[11px] tabular-nums", value.length >= maxLength ? "text-amber-300" : "text-white/30")}>
          {value.length}/{maxLength}
        </span>
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        required={required}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:border-violet-400/60 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.12)]"
      />
      {hint && (
        <button
          type="button"
          onClick={hint.action}
          className="mt-1.5 text-xs text-violet-200/70 underline-offset-2 hover:text-violet-100 hover:underline"
        >
          {hint.text} · use this
        </button>
      )}
    </label>
  );
}

export default ProfileSettings;
