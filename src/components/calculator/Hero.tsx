import { ArrowRight, ShieldCheck, Clock, Lock, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onStart: () => void;
}

export function Hero({ onStart }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/80 bg-hero">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--color-accent)_12%,transparent),transparent_55%)]" />
      <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-8 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent sm:mb-4 sm:text-xs">
          Free tool for independent insurance agents
        </p>

        <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur-sm sm:mb-5 sm:text-xs">
          <span className="size-1.5 shrink-0 rounded-full bg-accent" />
          <span className="truncate">PSM Brokerage · Agent Opportunity Calculator</span>
        </div>

        <h1 className="font-display max-w-3xl text-balance text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground sm:text-5xl sm:leading-[1.12] lg:text-[3.15rem]">
          See how much revenue you may be leaving on the table
        </h1>

        <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:mt-5 sm:text-xl">
          Built for any independent agent — Medicare, ACA, life, annuity, ancillary, or mixed.
          Estimate{" "}
          <span className="font-medium text-foreground">Year-1 impact</span> and the{" "}
          <span className="font-medium text-foreground">compounding multi-year path</span> on lines
          you do not write today that PSM can help you add. Under two minutes. No login.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
          <Button size="xl" onClick={onStart} className="h-14 w-full text-base sm:w-auto">
            Calculate My Opportunity
            <ArrowRight className="size-4" />
          </Button>
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            Free · Illustrative estimates · Practice numbers only · No consumer data
          </p>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-2 sm:mt-10 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          {[
            { icon: Clock, label: "Any primary market" },
            { icon: LineChart, label: "Year-1 + compounding" },
            { icon: Lock, label: "No client data" },
            { icon: ShieldCheck, label: "CMS-aligned MA" },
          ].map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-surface/60 px-2.5 py-2.5 text-xs text-muted-foreground backdrop-blur-sm sm:gap-2.5 sm:px-3.5 sm:py-3 sm:text-sm"
            >
              <Icon className="size-3.5 shrink-0 text-accent sm:size-4" strokeWidth={2} />
              <span className="leading-snug">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
