import { FAQ_ITEMS } from "@/lib/calculator/assumptions";

export function JsonLd() {
  const siteUrl =
    (typeof import.meta !== "undefined" &&
      (import.meta as ImportMeta & { env?: Record<string, string> }).env
        ?.VITE_PUBLIC_SITE_URL) ||
    "https://psm-agent-opportunity-calculator.vercel.app";

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "PSM Agent Opportunity Calculator",
    url: siteUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Free illustrative calculator for independent insurance agents to estimate Year-1 commission impact and multi-year compounding on Medicare, ACA, life, annuity, and ancillary product lines not currently offered.",
    provider: {
      "@type": "Organization",
      name: "PSM Brokerage",
      url: siteUrl,
    },
    audience: {
      "@type": "Audience",
      audienceType: "Independent insurance agents",
    },
  };

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PSM Brokerage",
    description:
      "Independent agent support for Medicare, ACA, life, annuity, and ancillary product lines.",
    url: siteUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
    </>
  );
}
