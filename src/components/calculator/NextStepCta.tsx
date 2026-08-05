import { ArrowRight, Phone, ShieldCheck } from "lucide-react";
import type { CalculationResult } from "@/lib/calculator/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface NextStepCtaProps {
  result: CalculationResult;
  /** Where primary CTA scrolls */
  targetId?: string;
}

/**
 * Post-value conversion block — only shown after results.
 * Psychology: loss framing + concrete next step + low-friction autonomy (save first).
 * No "not interested" mid-path options; agents opt out by not submitting.
 */
export function NextStepCta({ result, targetId = "lead-form" }: NextStepCtaProps) {
  const { year1ImpactTotal, pathCumulativeTotal, horizonYears, topOpportunities, hasFullPortfolio } =
    result;

  const scrollToForm = () => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (hasFullPortfolio) {
    return (
      <Card className="print:hidden border-primary/20 bg-primary/[0.03]">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-display text-xl font-semibold text-foreground">
              You already mark a full catalog
            </p>
            <p className="max-w-xl text-sm text-muted-foreground">
              PSM can still help with carrier mix, training, persistency, and state appointments so
              more of that book turns into retained production.
            </p>
          </div>
          <Button size="lg" onClick={scrollToForm} className="shrink-0">
            Request a portfolio review
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const top = topOpportunities.slice(0, 3).map((p) => p.label);
  const y1 = formatCurrency(year1ImpactTotal.moderate);
  const path = formatCurrency(pathCumulativeTotal.moderate);

  return (
    <Card className="print:hidden overflow-hidden border-accent/25 bg-accent/[0.04] shadow-elevated">
      <CardContent className="space-y-5 p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2 text-accent">
          <Phone className="size-4" />
          <p className="text-xs font-semibold uppercase tracking-wider">Natural next step</p>
        </div>

        <div className="max-w-2xl space-y-2">
          <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
            Turn this estimate into a contracting plan — not a screenshot that sits in downloads
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Your planning path shows about{" "}
            <span className="font-semibold text-foreground tabular-nums">{y1}</span> Year-1 impact
            and about{" "}
            <span className="font-semibold text-foreground tabular-nums">{path}</span> over{" "}
            {horizonYears} years on open lines
            {top.length > 0 && (
              <>
                {" "}
                (including {top.join(", ")})
              </>
            )}
            . PSM helps independent agents appoint, train, and add those lines the right way — you
            stay the agent of record.
          </p>
        </div>

        <ul className="grid gap-2 sm:grid-cols-3">
          {[
            "Appoint on the lines that drive your gap",
            "Training and product support for your market",
            "No pressure script — you decide what to write",
          ].map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 rounded-xl border border-border/80 bg-surface/80 px-3 py-2.5 text-xs leading-snug text-muted-foreground sm:text-sm"
            >
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-accent" />
              {item}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="xl" onClick={scrollToForm} className="w-full sm:w-auto">
            Talk with PSM about my open lines
            <ArrowRight className="size-4" />
          </Button>
          <p className="text-center text-xs text-muted-foreground sm:text-left">
            Free · No obligation · Takes about one minute
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
