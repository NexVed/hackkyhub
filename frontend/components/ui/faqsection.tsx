"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";

export type FAQItem = {
  question: string;
  answer: string;
};

export interface FAQSectionProps {
  title?: React.ReactNode;
  subtitle?: string;
  description?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  faqsLeft?: FAQItem[];
  faqsRight?: FAQItem[];
  className?: string;
}

export const defaultFaqsLeft: FAQItem[] = [
  {
    question: "What is HackkyHub and how does it work?",
    answer:
      "HackkyHub is a universal hackathon gateway that indexes competitions, hackathons, and developer leagues from Devfolio, MLH, HackerEarth, Unstop, and more into a single unified directory.",
  },
  {
    question: "How do portable team rosters work?",
    answer:
      "Assemble your squad once. HackkyHub lets you carry your team profile, skill tags, and collective submission track record across multiple hackathons without having to re-create rosters on every platform.",
  },
  {
    question: "Is HackkyHub free for participants?",
    answer:
      "Yes, HackkyHub is completely free for individual builders, collegiate hackers, and developer teams discovering and participating in competitions worldwide.",
  },
  {
    question: "How frequently are hackathon listings updated?",
    answer:
      "Our indexes synchronize around the clock with verified official schedules, prize pools, and registration deadlines as soon as organizers announce them.",
  },
  {
    question: "Can I filter hackathons by tech stack or prize pool?",
    answer:
      "Yes. Advanced filters allow you to search competitions tailored to AI/ML, Web3, Systems, Mobile, or collegiate leagues, sorted by prize amounts and timelines.",
  },
];

export const defaultFaqsRight: FAQItem[] = [
  {
    question: "How do I register for an indexed hackathon?",
    answer:
      "Each competition entry provides direct, verified links straight to the official registration portals (such as Devfolio, MLH, Unstop) with zero intermediate friction.",
  },
  {
    question: "Can I find teammates if I'm competing solo?",
    answer:
      "Yes! Our dedicated Teammate Finder helps you browse builder profiles by tech stack, timezone, and project interests to connect with compatible collaborators.",
  },
  {
    question: "Does HackkyHub support both in-person and virtual hackathons?",
    answer:
      "Absolutely. You can toggle between global virtual hackathons, regional collegiate events, and premier in-person hackathons around the globe.",
  },
  {
    question: "How can organizers get their hackathons listed?",
    answer:
      "Organizers can submit event schedules and prize categories directly through our gateway to reach hundreds of active builders and developer squads.",
  },
  {
    question: "Will I receive reminders before deadlines pass?",
    answer:
      "Yes. Bookmark any hackathon to receive timely alerts before registrations close, submissions are due, or project judging commences.",
  },
];

export function FAQSection({
  title = (
    <>
      Everything you need to know
      <span className="block font-serif italic font-normal text-zinc-300 mt-1">
        about HackkyHub.
      </span>
    </>
  ),
  subtitle = "• Frequently Asked Questions",
  description = "Answers to common questions about discovering hackathons, managing portable rosters, and registering across global platforms.",
  buttonLabel = "Browse All FAQs",
  onButtonClick,
  faqsLeft = defaultFaqsLeft,
  faqsRight = defaultFaqsRight,
  className,
}: FAQSectionProps) {
  return (
    <section className={cn("w-full max-w-6xl mx-auto px-4 py-16 sm:px-6 sm:py-20", className)}>
      {/* Header */}
      <ScrollReveal animation="fade-up" className="text-center mb-14">
        {subtitle && (
          <p className="text-[0.68rem] font-medium tracking-[0.25em] text-zinc-500 uppercase mb-3">
            {subtitle}
          </p>
        )}
        <h2 className="text-[1.75rem] sm:text-4xl lg:text-[2.85rem] font-light leading-[1.14] tracking-[-0.035em] text-white mb-4">
          {title}
        </h2>
        {description && (
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-8 font-normal">
            {description}
          </p>
        )}
        {buttonLabel && (
          <Button
            variant="outline"
            className="rounded-full border-white/20 bg-white/5 px-6 py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-white hover:text-black transition-all cursor-pointer shadow-sm"
            onClick={onButtonClick}
          >
            {buttonLabel}
          </Button>
        )}
      </ScrollReveal>

      {/* FAQs Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 lg:gap-12 text-left items-start">
        {[faqsLeft, faqsRight].map((faqColumn, columnIndex) => (
          <ScrollRevealGroup
            key={columnIndex}
            staggerDelay={0.07}
            delay={columnIndex * 0.1}
            className="w-full"
          >
            <Accordion
              type="single"
              collapsible
              className="space-y-1 w-full"
            >
              {faqColumn.map((faq, i) => (
                <ScrollRevealItem key={i} animation="fade-up">
                  <AccordionItem
                    value={`item-${columnIndex}-${i}`}
                    className="border-b border-white/10 py-1 transition-colors"
                  >
                    <AccordionTrigger className="text-sm sm:text-base font-normal text-zinc-200 hover:text-white hover:no-underline py-4 text-left transition-colors">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm text-zinc-400 leading-relaxed pb-4 pt-1">
                      <div className="min-h-[30px] transition-all duration-200 ease-in-out">
                        {faq.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </ScrollRevealItem>
              ))}
            </Accordion>
          </ScrollRevealGroup>
        ))}
      </div>
    </section>
  );
}

export default FAQSection;
