"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { ArrowLeft, ArrowRight, Loader2, Mail, RotateCw } from "lucide-react";
import Galaxy from "@/components/Galaxy";
import { OtpInput, type OtpStatus } from "@/components/auth/OtpInput";
import { cn } from "@/lib/utils";

const OTP_PROVIDER = "resend-otp";
const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 45;

type Step = "email" | "otp" | "success";

const stepVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 36, filter: "blur(6px)" }),
  center: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: (direction: number) => ({ opacity: 0, x: direction * -36, filter: "blur(6px)" }),
};

const stepTransition = { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const };

/**
 * The email OTP provider signs a returning user in and creates a new one with
 * the same call, so both entry points share this component. `mode` only
 * changes the wording, never the mechanics.
 */
export function AuthFlow({
  redirectTo = "/dashboard/Profile",
  mode = "signin",
}: {
  redirectTo?: string;
  mode?: "signin" | "signup";
}) {
  const router = useRouter();
  const { signIn } = useAuthActions();

  const [step, setStep] = useState<Step>("email");
  const [direction, setDirection] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<OtpStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const verifyingRef = useRef(false);

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const goTo = (next: Step, dir: number) => {
    setDirection(dir);
    setStep(next);
  };

  const sendCode = useCallback(
    async (target: string) => {
      setSending(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.set("email", target);
        await signIn(OTP_PROVIDER, formData);
        setCooldown(RESEND_COOLDOWN_SECONDS);
        return true;
      } catch (caught) {
        console.error("OTP send failed:", caught);
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
    const sent = await sendCode(target);
    if (sent) {
      setCode("");
      setStatus("idle");
      goTo("otp", 1);
    }
  };

  const handleVerify = useCallback(
    async (value: string) => {
      if (verifyingRef.current) return;
      verifyingRef.current = true;
      setStatus("verifying");
      setError(null);
      try {
        const formData = new FormData();
        formData.set("email", email);
        formData.set("code", value);
        await signIn(OTP_PROVIDER, formData);
        setStatus("success");
        setDirection(1);
        setStep("success");
        setTimeout(() => router.push(redirectTo), 1400);
      } catch (caught) {
        console.error("OTP verification failed:", caught);
        setStatus("error");
        setCode("");
        setError(explainVerifyError(caught));
      } finally {
        verifyingRef.current = false;
      }
    },
    [email, redirectTo, router, signIn],
  );

  const maskedEmail = useMemo(() => {
    const [name, domain] = email.split("@");
    if (!domain) return email;
    const head = name.slice(0, 2);
    return `${head}${"•".repeat(Math.max(name.length - 2, 1))}@${domain}`;
  }, [email]);

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#05050a] px-4 py-10">
      <div className="absolute inset-0">
        <Galaxy transparent={false} hueShift={265} density={0.9} glowIntensity={0.35} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,5,10,0.75)_75%)]" />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[0_24px_80px_-20px_rgba(109,40,217,0.55)] backdrop-blur-2xl sm:p-9">
          {/* Top light seam */}
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/60 to-transparent" />

          <AnimatePresence mode="wait" custom={direction} initial={false}>
            {step === "email" && (
              <motion.div
                key="email"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={stepTransition}
              >
                <Badge>{mode === "signup" ? "Get started" : "Sign in"}</Badge>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                  {mode === "signup" ? "Create your account" : "Welcome back"}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  {mode === "signup"
                    ? "Enter your email to claim your HackkyHub account. We verify with a one-time code, so there is no password to pick."
                    : "Enter your email and we will send a one-time code. No password to remember."}
                </p>

                <form onSubmit={handleEmailSubmit} className="mt-7 space-y-4">
                  <div className="group relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-violet-300" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none backdrop-blur-sm transition-all duration-200 focus:border-violet-400/70 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.12)]"
                    />
                  </div>

                  <ErrorNote message={error} />

                  <PrimaryButton type="submit" loading={sending}>
                    {sending ? "Sending code" : "Continue"}
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

                <p className="mt-7 text-center text-sm text-white/40">
                  {mode === "signup" ? (
                    <>
                      Already have an account?{" "}
                      <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
                        Sign in
                      </Link>
                    </>
                  ) : (
                    <>
                      New to HackkyHub?{" "}
                      <Link href="/signup" className="font-medium text-violet-300 hover:text-violet-200">
                        Create an account
                      </Link>
                    </>
                  )}
                </p>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div
                key="otp"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={stepTransition}
              >
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStatus("idle");
                    goTo("email", -1);
                  }}
                  className="mb-5 inline-flex items-center gap-1.5 text-xs text-white/45 transition-colors hover:text-white/80"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Use a different email
                </button>

                <Badge>Verify</Badge>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                  Check your inbox
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  We sent a {OTP_LENGTH}-digit code to{" "}
                  <span className="font-medium text-white/80">{maskedEmail}</span>.
                </p>

                <div className="mt-8">
                  <OtpInput
                    value={code}
                    onChange={(next) => {
                      setCode(next);
                      if (status === "error") {
                        setStatus("idle");
                        setError(null);
                      }
                    }}
                    onComplete={handleVerify}
                    length={OTP_LENGTH}
                    status={status}
                    disabled={status === "verifying" || status === "success"}
                  />
                </div>

                <div className="mt-5 min-h-5">
                  <AnimatePresence mode="wait">
                    {status === "verifying" ? (
                      <motion.p
                        key="verifying"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2 text-xs text-violet-200/80"
                      >
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Verifying your code
                      </motion.p>
                    ) : (
                      <ErrorNote message={error} centered />
                    )}
                  </AnimatePresence>
                </div>

                <PrimaryButton
                  type="button"
                  className="mt-4"
                  loading={status === "verifying"}
                  disabled={code.length !== OTP_LENGTH || status === "verifying"}
                  onClick={() => void handleVerify(code)}
                >
                  {status === "verifying" ? "Verifying" : "Verify and continue"}
                </PrimaryButton>

                <div className="mt-6 text-center text-xs text-white/40">
                  {cooldown > 0 ? (
                    <span>
                      No code yet? Resend in{" "}
                      <span className="font-mono text-white/70">
                        0:{cooldown.toString().padStart(2, "0")}
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => {
                        setCode("");
                        setStatus("idle");
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

            {step === "success" && (
              <motion.div
                key="success"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={stepTransition}
                className="flex flex-col items-center py-8 text-center"
              >
                <div className="relative">
                  <motion.span
                    className="absolute -inset-6 rounded-full bg-emerald-400/20 blur-2xl"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: [0.5, 1.25, 1], opacity: [0, 1, 0.7] }}
                    transition={{ duration: 0.9 }}
                  />
                  <motion.svg
                    viewBox="0 0 52 52"
                    className="relative h-20 w-20"
                    initial={{ scale: 0.6, rotate: -12 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 240, damping: 14 }}
                  >
                    <motion.circle
                      cx="26"
                      cy="26"
                      r="24"
                      fill="none"
                      stroke="rgb(52 211 153)"
                      strokeWidth="2.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                    />
                    <motion.path
                      d="M15 27 L23 34 L38 19"
                      fill="none"
                      stroke="rgb(110 231 183)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
                    />
                  </motion.svg>
                </div>

                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-7 text-2xl font-semibold tracking-tight text-white"
                >
                  You are verified
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.62 }}
                  className="mt-2 text-sm text-white/50"
                >
                  Spinning up your dashboard
                </motion.p>

                <div className="mt-7 h-0.5 w-40 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-violet-400 to-emerald-300"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.3, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

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
  if (/api[ _-]?key|unauthorized|invalid.*token|401/i.test(detail)) {
    return "Resend rejected the API key. Re-check AUTH_RESEND_KEY on your Convex deployment.";
  }
  if (/domain|not verified|from address/i.test(detail)) {
    return "Resend rejected the sender address. Verify a domain, or set AUTH_EMAIL_FROM to the sandbox sender.";
  }
  if (/(429|rate limit)/i.test(detail)) {
    return "Resend is rate limiting this address. Wait a moment and try again.";
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

  if (/verifier/i.test(detail)) {
    return "Stale sign-in state from an earlier attempt. Clear this site's data (or open a private window) and request a fresh code.";
  }
  if (/expired/i.test(detail)) {
    return "That code expired. Request a new one with Resend code.";
  }
  if (/invalid verification code|could not verify/i.test(detail)) {
    return "That code was not accepted. Codes are single-use, so make sure you are reading the most recent email, not an earlier one.";
  }
  return detail
    ? `Could not verify: ${detail.slice(0, 220)}`
    : "That code did not match. Enter the latest one we emailed you.";
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-violet-200">
      {children}
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
        "relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl",
        "bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-600 bg-[length:200%_100%]",
        "text-sm font-semibold text-white shadow-[0_10px_34px_-10px_rgba(124,58,237,0.85)]",
        "transition-all duration-300 hover:bg-[position:100%_0]",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </motion.button>
  );
}

function OAuthButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
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
        <span className="px-3 text-[11px] uppercase tracking-[0.18em] text-white/30">or</span>
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
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className={cn("text-xs text-rose-300/90", centered && "text-center")}
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

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
