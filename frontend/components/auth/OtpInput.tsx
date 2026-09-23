"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type OtpStatus = "idle" | "verifying" | "error" | "success";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  status?: OtpStatus;
  autoFocus?: boolean;
};

const DIGITS_ONLY = /\D/g;

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  status = "idle",
  autoFocus = true,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  /**
   * Several keystrokes can land in one React batch, and each handler would
   * otherwise read the same stale `value` prop and overwrite the previous
   * digit. This ref is updated synchronously so rapid typing composes, and is
   * resynced from the prop on every render.
   */
  const valueRef = useRef(value);
  valueRef.current = value;

  // Land the cursor on the first empty cell when the component appears.
  useEffect(() => {
    if (!autoFocus) return;
    const target = Math.min(valueRef.current.length, length - 1);
    inputsRef.current[target]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  // Jump back to the start after a failed attempt so the user can retype.
  useEffect(() => {
    if (status === "error") inputsRef.current[0]?.focus();
  }, [status]);

  const commit = (next: string, focusIndex?: number) => {
    const clean = next.replace(DIGITS_ONLY, "").slice(0, length);
    valueRef.current = clean;
    onChange(clean);

    if (focusIndex !== undefined) {
      inputsRef.current[Math.min(Math.max(focusIndex, 0), length - 1)]?.focus();
    }
    if (clean.length === length) onComplete?.(clean);
    return clean;
  };

  /**
   * Writes digits starting at `index`, clamped to the end of what has been
   * entered so far. Clamping means the string can never grow a hole, which is
   * what previously let a digit get dropped.
   */
  const writeAt = (index: number, incoming: string) => {
    const current = valueRef.current;
    const at = Math.min(index, current.length);
    const chars = current.split("");
    for (let i = 0; i < incoming.length && at + i < length; i++) {
      chars[at + i] = incoming[i];
    }
    return commit(chars.join(""), at + incoming.length);
  };

  const handleChange = (index: number, raw: string) => {
    const typed = raw.replace(DIGITS_ONLY, "");
    if (!typed) return;
    writeAt(index, typed);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    const current = valueRef.current;

    if (event.key === "Backspace") {
      event.preventDefault();
      if (current[index]) {
        commit(current.slice(0, index) + current.slice(index + 1), index);
      } else if (index > 0) {
        commit(current.slice(0, index - 1) + current.slice(index), index - 1);
      }
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(DIGITS_ONLY, "");
    if (!pasted) return;
    writeAt(index, pasted);
  };

  return (
    <motion.div
      animate={status === "error" ? { x: [0, -9, 8, -6, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.42, ease: "easeInOut" }}
      className="flex items-center justify-center gap-2 sm:gap-3"
    >
      {Array.from({ length }).map((_, index) => {
        const digit = value[index] ?? "";
        return (
          <div key={index} className="relative">
            {/* Glow layer behind a filled cell */}
            <motion.span
              aria-hidden
              className={cn(
                "pointer-events-none absolute -inset-1 rounded-2xl blur-md",
                status === "success"
                  ? "bg-emerald-400/30"
                  : status === "error"
                    ? "bg-rose-500/25"
                    : "bg-violet-500/25",
              )}
              initial={false}
              animate={{ opacity: digit ? 1 : 0 }}
              transition={{ duration: 0.25 }}
            />
            <input
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(index, e)}
              onFocus={(e) => e.currentTarget.select()}
              disabled={disabled}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${index + 1} of ${length}`}
              maxLength={length}
              className={cn(
                "relative h-14 w-11 rounded-2xl border bg-white/5 text-center text-2xl font-semibold text-white",
                "outline-none backdrop-blur-sm transition-all duration-200 sm:h-16 sm:w-13",
                "caret-violet-300 disabled:cursor-not-allowed disabled:opacity-60",
                "focus:scale-[1.06] focus:bg-white/10",
                status === "success"
                  ? "border-emerald-400/60 focus:border-emerald-300"
                  : status === "error"
                    ? "border-rose-500/60 focus:border-rose-400"
                    : digit
                      ? "border-violet-400/60 focus:border-violet-300"
                      : "border-white/15 focus:border-violet-400/70",
              )}
            />
          </div>
        );
      })}
    </motion.div>
  );
}

export default OtpInput;
