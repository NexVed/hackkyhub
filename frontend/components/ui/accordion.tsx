"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as React from "react";

import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "@radix-ui/react-icons";

const Accordion = AccordionPrimitive.Root;

const AccordionItemContext = React.createContext<string | undefined>(undefined);

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, value, ...props }, ref) => (
  <AccordionItemContext.Provider value={value}>
    <AccordionPrimitive.Item
      ref={ref}
      value={value}
      className={cn("border-b border-border", className)}
      {...props}
    />
  </AccordionItemContext.Provider>
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, id, "aria-controls": ariaControls, ...props }, ref) => {
  const itemValue = React.useContext(AccordionItemContext);
  const triggerId = id ?? (itemValue ? `accordion-trigger-${itemValue}` : undefined);
  const contentId = ariaControls ?? (itemValue ? `accordion-content-${itemValue}` : undefined);

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        id={triggerId}
        aria-controls={contentId}
        className={cn(
          "flex flex-1 items-center justify-between py-4 text-left font-semibold transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          width={16}
          height={16}
          strokeWidth={2}
          className="shrink-0 opacity-60 transition-transform duration-200"
          aria-hidden="true"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, id, "aria-labelledby": ariaLabelledby, ...props }, ref) => {
  const itemValue = React.useContext(AccordionItemContext);
  const contentId = id ?? (itemValue ? `accordion-content-${itemValue}` : undefined);
  const triggerId = ariaLabelledby ?? (itemValue ? `accordion-trigger-${itemValue}` : undefined);

  return (
    <AccordionPrimitive.Content
      ref={ref}
      id={contentId}
      aria-labelledby={triggerId}
      className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
});

AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
