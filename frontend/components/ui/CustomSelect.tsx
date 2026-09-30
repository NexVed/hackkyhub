"use client";

import { Select } from "radix-ui";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string; description?: string; disabled?: boolean };
const EMPTY = "__hackkyhub_empty_selection__";

/** Shared themed listbox with Radix keyboard navigation and typeahead. */
export function CustomSelect({ value, onValueChange, options, ariaLabel, className, disabled = false }: {
  value: string; onValueChange: (value: string) => void; options: Option[]; ariaLabel: string; className?: string; disabled?: boolean;
}) {
  return <Select.Root value={value || EMPTY} onValueChange={(next) => onValueChange(next === EMPTY ? "" : next)} disabled={disabled}>
    <Select.Trigger aria-label={ariaLabel} className={cn("group inline-flex min-h-10 min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-left text-xs font-medium text-slate-700 shadow-sm outline-none transition hover:border-violet-400/50 focus-visible:ring-4 focus-visible:ring-violet-500/15 data-[state=open]:border-violet-400/60 data-[state=open]:ring-4 data-[state=open]:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-dash-surface dark:text-white/80", className)}>
      <span className="min-w-0 truncate"><Select.Value>{options.find(option => option.value === value)?.label}</Select.Value></span>
      <Select.Icon><ChevronDown className="size-3.5 shrink-0 text-violet-500 transition-transform duration-200 group-data-[state=open]:rotate-180 dark:text-violet-300" /></Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content position="popper" sideOffset={8} collisionPadding={16} className="custom-scrollbar z-90 w-[var(--radix-select-trigger-width)] min-w-52 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-1.5 text-slate-800 shadow-[0_20px_70px_-20px_rgba(76,29,149,0.35)] backdrop-blur-2xl dark:border-violet-300/15 dark:bg-[#11111f]/95 dark:text-white data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-150 origin-[var(--radix-select-content-transform-origin)]">
        <Select.ScrollUpButton className="flex h-6 items-center justify-center text-violet-500"><ChevronUp className="size-4" /></Select.ScrollUpButton>
        <Select.Viewport className="max-h-[min(20rem,var(--radix-select-content-available-height))] space-y-1">
          <Select.Group>
            <Select.Label className="px-3 pb-2 pt-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-white/35">{ariaLabel}</Select.Label>
            {options.map(option => <Select.Item key={option.value} value={option.value || EMPTY} disabled={option.disabled} textValue={option.label} title={option.label} className="relative flex min-h-10 cursor-pointer select-none items-center gap-3 rounded-xl px-2.5 py-2 pr-8 outline-none transition-colors data-[highlighted]:bg-violet-500/10 data-[highlighted]:text-violet-700 data-[state=checked]:bg-violet-500/10 data-[state=checked]:text-violet-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-40 dark:data-[highlighted]:bg-violet-400/15 dark:data-[highlighted]:text-violet-200 dark:data-[state=checked]:bg-violet-400/10 dark:data-[state=checked]:text-violet-200">
              <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500/10 to-teal-400/10 text-[10px] font-bold text-violet-600 dark:text-violet-300">{option.label.slice(0, 1).toUpperCase()}</span>
              <span className="min-w-0 flex-1"><Select.ItemText><span className="block break-words text-xs font-medium">{option.label}</span></Select.ItemText>{option.description && <span className="mt-0.5 block text-[10px] text-slate-500 dark:text-white/40">{option.description}</span>}</span>
              <Select.ItemIndicator className="absolute right-3"><Check className="size-3.5" /></Select.ItemIndicator>
            </Select.Item>)}
          </Select.Group>
        </Select.Viewport>
        <Select.ScrollDownButton className="flex h-6 items-center justify-center text-violet-500"><ChevronDown className="size-4" /></Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  </Select.Root>;
}
