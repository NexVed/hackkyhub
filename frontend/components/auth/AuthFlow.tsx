"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { ArrowLeft, ArrowRight, Loader2, Mail, RotateCw, ShieldCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { OtpInput, type OtpStatus } from "@/components/auth/OtpInput";
import { NetworkField } from "@/components/visuals/NetworkField";
import { FloatingCode } from "@/components/visuals/FloatingCode";
import { BrandMark } from "@/components/visuals/BrandMark";
import { cn } from "@/lib/utils";

const OTP_PROVIDER = "resend-otp";
const OTP_LENGTH = 6;
const RESEND_COOLDOWN_MS = 45_000;
/** Must match `maxAge` in convex/ResendOTP.ts. */
const CODE_TTL_MS = 10 * 60_000;
/** Long enough for the verify animation to read, short enough not to stall. */
const MIN_VERIFY_MS = 1_100;

type Mode = "signin" | "signup";
type Step = "email" | "otp" | "verifying" | "success";

const ease = [0.22, 1, 0.36, 1] as const;

const panelVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40, filter: "blur(8px)" }),
  center: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: (dir: number) => ({ opacity: 0, x: dir * -40, filter: "blur(8px)" }),
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The HackkyHub sign-in experience: email, then a one-time code, then an
 * animated verification hand-off into the dashboard. The email OTP provider
 * both signs existing users in and creates new ones, so "Sign in" and
 * "Create account" share one mechanism and only differ in wording.
 */
export function AuthFlow({
  redirectTo = "/dashboard",
  mode: initialMode = "signin",
}: {
  redirectTo?: string;
  mode?: Mode;
}) {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const reduceMotion = useReducedMotion();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<Step>("email");
  const [direction, setDirection] = useState(1);
  const [sweep, setSweep] = useState(0);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [exiting, setExiting] = useState(false);

  const verifyingRef = useRef(false);

  // One ticker drives both the resend cooldown and the code-expiry countdown.
  useEffect(() => {
    if (step !== "otp") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [step]);

  const go = (next: Step, dir = 1) => {
    setDirection(dir);
    setSweep((n) => n + 1);
    setStep(next);
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setError(null);
    setSweep((n) => n + 1);
    // Keep the address bar honest without a full navigation.
    window.history.replaceState(null, "", next === "signup" ? "/signup" : "/login");
  };

  const sendCode = useCallback(
    async (target: string) => {
      setSending(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.set("email", target);
        await signIn(OTP_PROVIDER, formData);
        const at = Date.now();
        setSentAt(at);
        setNow(at);
        return true;
      } catch (caught) {
        console.warn("OTP send failed:", caught);
        setError(explainAuthError(caught));
        return false;
      } finally {
        setSending(false);
      }
    },
    [signIn],
  );

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const target = email.trim().toLowerCase();
    if (!target) return;
    setEmail(target);
    if (await sendCode(target)) {
      setCode("");
      setOtpStatus("idle");
      go("otp", 1);
    }
  };

  const handleVerify = useCallback(
    async (value: string) => {
      if (verifyingRef.current || value.length !== OTP_LENGTH) return;
      verifyingRef.current = true;
      setSubmitted(value);
      setError(null);
      go("verifying", 1);
      router.prefetch(redirectTo);

      const startedAt = Date.now();
      try {
        const formData = new FormData();
        formData.set("email", email);
        formData.set("code", value);
        await signIn(OTP_PROVIDER, formData);
        await sleep(Math.max(0, MIN_VERIFY_MS - (Date.now() - startedAt)));
        go("success", 1);
        await sleep(1500);
        setExiting(true);
        await sleep(reduceMotion ? 150 : 650);
        router.push(redirectTo);
      } catch (caught) {
        console.warn("OTP verification failed:", caught);
        await sleep(Math.max(0, 600 - (Date.now() - startedAt)));
        setCode("");
        setOtpStatus("error");
        setError(explainVerifyError(caught));
        go("otp", -1);
        verifyingRef.current = false;
      }
    },
    [email, redirectTo, router, signIn, reduceMotion],
  );

  const maskedEmail = useMemo(() => {
    const [name, domain] = email.split("@");
    if (!domain) return email;
    return `${name.slice(0, 2)}${"•".repeat(Math.max(name.length - 2, 1))}@${domain}`;
  }, [email]);

  const resendIn = sentAt ? Math.max(0, Math.ceil((sentAt + RESEND_COOLDOWN_MS - now) / 1000)) : 0;
  const expiresIn = sentAt ? Math.max(0, Math.ceil((sentAt + CODE_TTL_MS - now) / 1000)) : 0;
  const expired = sentAt !== null && expiresIn === 0;

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#05060c] px-4 py-8 sm:px-6">
      {/* Ambient scene */}
      <NetworkField density={0.55} linkDistance={130} />
      <div className="pointer-events-none absolute -left-40 top-[-10%] h-[520px] w-[520px] rounded-full bg-violet-600/20 blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 bottom-[-15%] h-[480px] w-[480px] rounded-full bg-teal-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,6,12,0.85)_80%)]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease }}
        className="relative z-10 grid w-full max-w-[1080px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0b14]/80 shadow-[0_40px_120px_-30px_rgba(76,29,149,0.6)] backdrop-blur-2xl grid-cols-[minmax(0,1fr)] lg:min-h-[640px] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]"
      >
        <BrandPanel />

        {/* Form side */}
        <div className="relative flex items-center overflow-hidden px-6 py-9 sm:px-10 lg:px-14">
          <BladeSweep trigger={sweep} />

          <div className="relative mx-auto w-full max-w-[400px]">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              {step === "email" && (
                <motion.div
                  key={`email-${mode}`}
                  custom={direction}
                  variants={panelVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease }}
                >
                  <ModeTabs mode={mode} onChange={switchMode} />

                  <h1 className="mt-8 text-[34px] font-semibold leading-[1.1] tracking-tight text-white">
                    {mode === "signup" ? (
                      <>
                        Start your <span className="font-display italic text-violet-200">first build.</span>
                      </>
                    ) : (
                      <>
                        Welcome <span className="font-display italic text-violet-200">back.</span>
                      </>
                    )}
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-white/50">
                    {mode === "signup"
                      ? "Create your HackkyHub account with just your email. We verify it with a one-time code, so there is no password to invent."
                      : "Enter your email and we will send a 6-digit code. No password to remember."}
                  </p>

                  <form onSubmit={handleEmailSubmit} className="mt-8 space-y-4">
                    <label className="group relative block">
                      <span className="sr-only">Email address</span>
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-violet-300" />
                      <input
                        type="email"
                        required
                        autoFocus
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-[52px] w-full rounded-2xl border border-white/12 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-400/70 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.14)]"
                      />
                    </label>

                    <ErrorNote message={error} />

                    <PrimaryButton type="submit" loading={sending} disabled={sending}>
                      {sending ? "Sending code" : mode === "signup" ? "Create account" : "Continue"}
                      {!sending && <ArrowRight className="h-4 w-4" />}
                    </PrimaryButton>
                  </form>

                  <Divider />

                  <div className="grid grid-cols-2 gap-3">
                    <OAuthButton onClick={() => void signIn("google", { redirectTo })} label="Google">
                      <GoogleMark />
                    </OAuthButton>
                    <OAuthButton onClick={() => void signIn("github", { redirectTo })} label="GitHub">
                      <GitHubMark />
                    </OAuthButton>
                  </div>

                  <p className="mt-7 flex items-center justify-center gap-1.5 text-center text-xs text-white/35">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300/70" />
                    Passwordless sign-in, verified by email
                  </p>
                </motion.div>
              )}

              {step === "otp" && (
                <motion.div
                  key="otp"
                  custom={direction}
                  variants={panelVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setOtpStatus("idle");
                      go("email", -1);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-white/45 transition-colors hover:text-white/85"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Use a different email
                  </button>

                  <h1 className="mt-7 text-[34px] font-semibold leading-[1.1] tracking-tight text-white">
                    Verify your <span className="font-display italic text-violet-200">email.</span>
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-white/50">
                    Enter the {OTP_LENGTH}-digit code we sent to{" "}
                    <span className="font-medium text-white/85">{maskedEmail}</span>.
                  </p>

                  <div className="mt-9">
                    <OtpInput
                      value={code}
                      onChange={(next) => {
                        setCode(next);
                        if (otpStatus === "error") {
                          setOtpStatus("idle");
                          setError(null);
                        }
                      }}
                      onComplete={(value) => void handleVerify(value)}
                      length={OTP_LENGTH}
                      status={otpStatus}
                      disabled={expired}
                    />
                  </div>

                  <div className="mt-5 min-h-5">
                    <ErrorNote
                      message={expired ? "This code has expired. Request a new one below." : error}
                      centered
                    />
                  </div>

                  <PrimaryButton
                    type="button"
                    className="mt-4"
                    disabled={code.length !== OTP_LENGTH || expired}
                    onClick={() => void handleVerify(code)}
                  >
                    Verify code
                  </PrimaryButton>

                  <div className="mt-6 flex items-center justify-between gap-3 text-xs">
                    <ExpiryMeter secondsLeft={expiresIn} total={CODE_TTL_MS / 1000} />

                    {resendIn > 0 ? (
                      <span className="text-white/40">
                        Resend in <span className="font-mono text-white/70">0:{String(resendIn).padStart(2, "0")}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => {
                          setCode("");
                          setOtpStatus("idle");
                          void sendCode(email);
                        }}
                        className="inline-flex items-center gap-1.5 font-medium text-violet-300 transition-colors hover:text-violet-200 disabled:opacity-50"
                      >
                        <RotateCw className={cn("h-3.5 w-3.5", sending && "animate-spin")} />
                        {sending ? "Sending" : "Resend code"}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {step === "verifying" && (
                <motion.div
                  key="verifying"
                  custom={direction}
                  variants={panelVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease }}
                  className="flex flex-col items-center py-6 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <VerifySequence digits={submitted} />
                  <h1 className="mt-8 text-2xl font-semibold tracking-tight text-white">Verifying…</h1>
                  <p className="mt-2 text-sm text-white/45">Securely checking your code</p>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  custom={direction}
                  variants={panelVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease }}
                  className="flex flex-col items-center py-6 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <SuccessSequence />
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="mt-9 text-2xl font-semibold tracking-tight text-white"
                  >
                    Access <span className="font-display italic text-emerald-200">granted.</span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.58 }}
                    className="mt-2 text-sm text-white/45"
                  >
                    Launching your hackathon universe
                  </motion.p>
                  <div className="mt-7 h-0.5 w-44 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-violet-400 via-indigo-300 to-emerald-300"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <ExitWipe active={exiting} reduceMotion={Boolean(reduceMotion)} />
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Brand panel                                                               */
/* ------------------------------------------------------------------------ */

const TAGLINE = ["Discover.", "Compete.", "Build.", "Win."];

function BrandPanel() {
  const stats = useQuery(api.analytics.getDashboardStats, {});
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % TAGLINE.length), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-[260px] overflow-hidden bg-[linear-gradient(145deg,#1a1036_0%,#0d1026_45%,#071a22_100%)] lg:min-h-0 lg:[clip-path:polygon(0_0,100%_0,86%_100%,0_100%)]">
      <NetworkField density={1.2} linkDistance={110} />
      <FloatingCode className="hidden sm:block" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(139,92,246,0.35),transparent_55%)]" />

      {/* Glowing diagonal seam along the clipped edge */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="seam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0" />
            <stop offset="50%" stopColor="#e9d5ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#5eead4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="100" y1="0" x2="86" y2="100" stroke="url(#seam)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="relative flex h-full flex-col justify-between gap-10 p-7 sm:p-10 lg:pr-24">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex items-center gap-3"
        >
          <BrandMark />
          <span className="text-sm font-semibold tracking-[0.32em] text-white">HACKKYHUB</span>
        </motion.div>

        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease }}
            className="text-sm font-medium uppercase tracking-[0.22em] text-violet-200/70"
          >
            Your gateway to
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32, ease }}
            className="font-display mt-2 bg-gradient-to-r from-white via-violet-100 to-teal-100 bg-clip-text text-5xl italic leading-[1.02] text-transparent sm:text-6xl"
          >
            Hackathons.
          </motion.h2>

          <div className="mt-6 flex flex-wrap gap-x-3 gap-y-1">
            {TAGLINE.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.5 + i * 0.1, ease }}
                className="relative pb-1 text-lg font-semibold"
              >
                <span className={cn("transition-colors duration-500", active === i ? "text-white" : "text-white/40")}>
                  {word}
                </span>
                {active === i && (
                  <motion.span
                    layoutId="tagline-underline"
                    className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-violet-400 to-teal-300"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </motion.span>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-md sm:flex"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <p className="text-xs text-white/60">
            {stats === undefined ? (
              "Connecting to the live feed…"
            ) : stats.total === 0 ? (
              "Live feed is syncing from hackathon platforms"
            ) : (
              <>
                <span className="font-semibold text-white">{stats.total.toLocaleString()}</span> hackathons tracked across{" "}
                <span className="font-semibold text-white">{stats.platforms.length}</span> platforms ·{" "}
                <span className="font-semibold text-white">{stats.phases.upcoming.toLocaleString()}</span> upcoming
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Motion pieces                                                             */
/* ------------------------------------------------------------------------ */

/** A diagonal band of light that sweeps across the form on every change. */
function BladeSweep({ trigger }: { trigger: number }) {
  return (
    <AnimatePresence>
      {trigger > 0 && (
        <motion.div
          key={trigger}
          aria-hidden
          className="pointer-events-none absolute inset-y-[-20%] z-20 w-[45%] -skew-x-[14deg] bg-gradient-to-r from-transparent via-violet-200/[0.13] to-transparent"
          initial={{ left: "-60%", opacity: 0 }}
          animate={{ left: "120%", opacity: [0, 1, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
        />
      )}
    </AnimatePresence>
  );
}

/** The submitted digits gather into an orbit around a spinning ring. */
function VerifySequence({ digits }: { digits: string }) {
  const radius = 64;
  const count = digits.length || OTP_LENGTH;
  return (
    <div className="relative grid h-48 w-48 place-items-center">
      <motion.svg
        viewBox="0 0 192 192"
        className="absolute inset-0"
        initial={{ opacity: 0, rotate: 0 }}
        animate={{ opacity: 1, rotate: 360 }}
        transition={{
          opacity: { delay: 0.5, duration: 0.4 },
          rotate: { repeat: Infinity, duration: 1.1, ease: "linear" },
        }}
      >
        <defs>
          <linearGradient id="verify-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#5eead4" />
          </linearGradient>
        </defs>
        <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
        <circle
          cx="96"
          cy="96"
          r="88"
          fill="none"
          stroke="url(#verify-arc)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="130 423"
        />
      </motion.svg>

      <motion.span
        className="absolute h-10 w-10 rounded-full bg-violet-500/30 blur-xl"
        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
      />

      {digits.split("").map((digit, i) => {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 -ml-[18px] -mt-[18px] grid h-9 w-9 place-items-center rounded-xl border border-violet-300/30 bg-violet-500/15 font-mono text-sm font-semibold text-white backdrop-blur-sm"
            initial={{ x: (i - (count - 1) / 2) * 44, y: 110, opacity: 0.2, scale: 1.15 }}
            animate={{ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, opacity: 1, scale: 0.9 }}
            transition={{ duration: 0.6, delay: i * 0.045, ease }}
          >
            {digit}
          </motion.span>
        );
      })}
    </div>
  );
}

/** Glowing orb that resolves into a drawn checkmark and a VERIFIED badge. */
function SuccessSequence() {
  return (
    <div className="relative grid h-48 w-48 place-items-center">
      <motion.span
        className="absolute inset-4 rounded-full bg-emerald-400/25 blur-2xl"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.3, 1], opacity: [0, 1, 0.7] }}
        transition={{ duration: 0.9 }}
      />
      <motion.span
        className="absolute h-28 w-28 rounded-full border border-emerald-300/40"
        initial={{ scale: 0.6, opacity: 0.8 }}
        animate={{ scale: 1.7, opacity: 0 }}
        transition={{ duration: 1.1, delay: 0.25, ease: "easeOut" }}
      />
      <motion.div
        className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-500 shadow-[0_0_60px_-5px_rgba(52,211,153,0.8)]"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.12, 1] }}
        transition={{ duration: 0.55, ease }}
      >
        <svg viewBox="0 0 52 52" className="h-11 w-11">
          <motion.path
            d="M14 27 L22.5 35 L38 18"
            fill="none"
            stroke="#052e1f"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
          />
        </svg>
      </motion.div>
      <motion.span
        className="absolute -bottom-1 rounded-full border border-emerald-300/40 bg-emerald-400/15 px-3 py-1 text-[10px] font-bold tracking-[0.22em] text-emerald-200"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        VERIFIED
      </motion.span>
    </div>
  );
}

/** Circular wipe that carries the user from the auth card into the dashboard. */
function ExitWipe({ active, reduceMotion }: { active: boolean; reduceMotion: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          aria-hidden
          className="fixed inset-0 z-50 grid place-items-center bg-[radial-gradient(circle_at_center,#1b1238_0%,#07070d_70%)]"
          initial={reduceMotion ? { opacity: 0 } : { clipPath: "circle(0% at 50% 50%)" }}
          animate={reduceMotion ? { opacity: 1 } : { clipPath: "circle(150% at 50% 50%)" }}
          transition={{ duration: reduceMotion ? 0.15 : 0.65, ease: [0.7, 0, 0.3, 1] }}
        >
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <BrandMark className="h-14 w-14" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------------ */
/* Small UI pieces                                                           */
/* ------------------------------------------------------------------------ */

function ModeTabs({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div role="tablist" aria-label="Account mode" className="relative inline-grid grid-cols-2 rounded-full border border-white/10 bg-white/[0.04] p-1">
      {(["signin", "signup"] as const).map((value) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={mode === value}
          onClick={() => onChange(value)}
          className={cn(
            "relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
            mode === value ? "text-[#0b0b14]" : "text-white/55 hover:text-white/85",
          )}
        >
          {mode === value && (
            <motion.span
              layoutId="mode-pill"
              className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-violet-200 to-teal-100"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          {value === "signin" ? "Sign in" : "Create account"}
        </button>
      ))}
    </div>
  );
}

/** Small ring that drains as the emailed code approaches expiry. */
function ExpiryMeter({ secondsLeft, total }: { secondsLeft: number; total: number }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  const share = total > 0 ? secondsLeft / total : 0;
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");
  return (
    <span className="inline-flex items-center gap-2 text-white/45">
      <svg viewBox="0 0 18 18" className="h-4 w-4 -rotate-90">
        <circle cx="9" cy="9" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <circle
          cx="9"
          cy="9"
          r={r}
          fill="none"
          stroke={share < 0.2 ? "rgb(251 113 133)" : "rgb(167 139 250)"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - share)}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      Expires in <span className="font-mono text-white/75">{mm}:{ss}</span>
    </span>
  );
}

function PrimaryButton({
  children,
  loading,
  className,
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof motion.button>, "children"> & {
  loading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.015 }}
      whileTap={{ scale: disabled ? 1 : 0.985 }}
      disabled={disabled}
      {...props}
      className={cn(
        "group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl",
        "bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-600 bg-[length:200%_100%]",
        "text-sm font-semibold text-white shadow-[0_12px_36px_-12px_rgba(124,58,237,0.9)]",
        "transition-all duration-300 hover:bg-[position:100%_0]",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
        className,
      )}
    >
      {/* Sheen */}
      <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/15 opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </motion.button>
  );
}

function OAuthButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] text-sm font-medium text-white/80 transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
    >
      {children}
      {label}
    </motion.button>
  );
}

function Divider() {
  return (
    <div className="relative my-7">
      <div className="absolute inset-0 flex items-center">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[#0a0b14] px-3 text-[11px] uppercase tracking-[0.18em] text-white/30">or</span>
      </div>
    </div>
  );
}

function ErrorNote({ message, centered }: { message: string | null; centered?: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.p
          key={message}
          role="alert"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className={cn("text-xs leading-relaxed text-rose-300/90", centered && "text-center")}
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------------ */
/* Error explanations                                                        */
/* ------------------------------------------------------------------------ */

/**
 * Surfaces the actual reason a send failed. Resend's common setup problems are
 * all configuration issues, and hiding them behind a generic message makes them
 * far harder to fix than showing them.
 */
function explainAuthError(caught: unknown): string {
  const detail = caught instanceof Error ? caught.message : String(caught);

  if (/only send testing emails|testing emails to your own/i.test(detail)) {
    return "Resend is still in test mode, so it only delivers to the address your Resend account was created with. Use that email, or verify a domain in Resend.";
  }
  if (/api[ _-]?key|unauthorized|invalid.*token|\b401\b/i.test(detail)) {
    return "Resend rejected the API key. Re-check AUTH_RESEND_KEY on your Convex deployment.";
  }
  if (/domain|not verified|from address/i.test(detail)) {
    return "Resend rejected the sender address. Verify a domain, or set AUTH_EMAIL_FROM to the sandbox sender.";
  }
  if (/\b(429|rate limit)\b/i.test(detail)) {
    return "Too many requests for this address. Wait a moment and try again.";
  }
  if (/Missing environment variable/i.test(detail)) {
    return `Server configuration is incomplete: ${detail.match(/Missing environment variable `?[A-Z_]+`?/)?.[0] ?? detail}`;
  }
  return detail
    ? `Could not send the code: ${detail.slice(0, 220)}`
    : "Could not send that code. Check the address and try again.";
}

/**
 * A failed verification is not always a wrong code: a stale code from an
 * earlier email, an expired one, or a leftover OAuth verifier all land here
 * and each needs a different fix.
 */
function explainVerifyError(caught: unknown): string {
  const detail = caught instanceof Error ? caught.message : String(caught);

  if (/Missing environment variable/i.test(detail)) {
    return `Server configuration is incomplete: ${detail.match(/Missing environment variable `?[A-Z_]+`?/)?.[0] ?? detail}`;
  }
  if (/verifier/i.test(detail)) {
    return "Stale sign-in state from an earlier attempt. Clear this site's data (or open a private window) and request a fresh code.";
  }
  if (/expired/i.test(detail)) {
    return "That code expired. Request a new one with Resend code.";
  }
  if (/invalid verification code|could not verify/i.test(detail)) {
    return "That code was not accepted. Codes are single-use, so use the most recent email.";
  }
  return detail
    ? `Could not verify: ${detail.slice(0, 220)}`
    : "That code did not match. Enter the latest one we emailed you.";
}

/* ------------------------------------------------------------------------ */
/* Provider marks                                                            */
/* ------------------------------------------------------------------------ */

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
      <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
      <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
      <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default AuthFlow;
