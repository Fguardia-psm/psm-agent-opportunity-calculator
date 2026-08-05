import { ArrowRight, ShieldCheck, Clock, Lock, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onStart: () => void;
}

export function Hero({ onStart }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/80 bg-hero">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--color-accent)_12%,transparent),transparent_55%)]" />
      <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-10 sm:px-6 sm:pb-18 sm:pt-14 lg:px-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Free tool for independent insurance agents
        </p>

        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-accent" />
          PSM Brokerage · Agent Opportunity Calculator
        </div>

        <h1 className="font-display max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.15rem] lg:leading-[1.12]">
          See what you leave on the table when you only sell part of the book
        </h1>

        <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
          For any independent agent — Medicare, ACA, life, annuity, ancillary, or mixed. Estimate{" "}
          <span className="font-medium text-foreground">Year-1 impact</span> and the{" "}
          <span className="font-medium text-foreground">compounding multi-year path</span> (new
          production + renewals) on lines you do not write today that PSM can help you add.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="xl" onClick={onStart} className="w-full sm:w-auto">
            Calculate My Opportunity
            <ArrowRight className="size-4" />
          </Button>
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            No login. No client data. No obligation. Under 2 minutes.
          </p>
        </div>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Clock, label: "Any primary market" },
            { icon: LineChart, label: "Year-1 + compounding path" },
            { icon: Lock, label: "No private client data" },
            { icon: ShieldCheck, label: "CMS-aligned MA defaults" },
          ].map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-surface/60 px-3.5 py-3 text-sm text-muted-foreground backdrop-blur-sm"
            >
              <Icon className="size-4 shrink-0 text-accent" strokeWidth={2} />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
