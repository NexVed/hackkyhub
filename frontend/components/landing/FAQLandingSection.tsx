"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FAQSection } from "@/components/ui/faqsection";

export function FAQLandingSection() {
  const router = useRouter();

  return (
    <section id="faq" className="relative z-10 w-full bg-black text-white border-t border-white/5 overflow-hidden scroll-mt-20">
      <FAQSection
        onButtonClick={() => router.push("/dashboard/Find")}
      />
    </section>
  );
}

export default FAQLandingSection;
