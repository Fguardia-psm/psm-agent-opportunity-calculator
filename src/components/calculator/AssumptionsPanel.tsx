import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import {
  ATTACH_RATES,
  CATEGORY_LABELS,
  OPPORTUNITY_PRODUCT_IDS,
  PERSISTENCY_RATES,
  PRODUCT_BY_ID,
} from "@/lib/calculator/assumptions";
import { formatCurrency, cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function AssumptionsPanel() {
  const [open, setOpen] = useState(false);
  const opportunityProducts = OPPORTUNITY_PRODUCT_IDS.map((id) => PRODUCT_BY_ID[id]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-2xl border border-border bg-surface shadow-card">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/30"
          >
            <span className="flex items-center gap-2.5">
              <Info className="size-4 shrink-0 text-accent" />
              <span className="font-medium text-foreground">How the money is calculated</span>
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-5 border-t border-border px-5 py-5 text-sm">
            <div>
              <h4 className="font-semibold text-foreground">Formulas</h4>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">Primary markets</span> — categories
                  you select are treated as covered. Opportunity is every other line in the
                  calculator catalog (Medicare, ACA, life, ancillary). Annuity is primary-focus only
                  and is not scored as a dollar opportunity.
                </li>
                <li>
                  <span className="font-medium text-foreground">Eligible clients</span> — Medicare
                  lines use your Medicare-age percentage; ACA uses under-65 percentage; life and
                  ancillary use the full book; default planning place rate is 35% of eligible clients.
                </li>
                <li>
                  <span className="font-medium text-foreground">Year-1 impact</span> — (eligible book
                  × place rate + eligible new × place rate) × first-year commission.
                </li>
                <li>
                  <span className="font-medium text-foreground">Years 2 and beyond</span> — new
                  pipeline × first-year commission + prior in-force × persistency × renewal
                  commission. Cumulative path always climbs.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-2 font-semibold text-foreground">
                Default commission per placed case (opportunity lines)
              </h4>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {opportunityProducts.map((p) => (
                  <li key={p.id} className="px-3.5 py-2.5">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-foreground">
                        {p.label}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({CATEGORY_LABELS[p.category]})
                        </span>
                      </span>
                      <span className="text-xs tabular-nums text-foreground sm:text-sm">
                        FY {formatCurrency(p.firstYearRevenue)} · Ren{" "}
                        {formatCurrency(p.renewalRevenue)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {p.compensationSource}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 font-semibold text-foreground">Place-rate scenarios</h4>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex justify-between gap-3">
                    <span>Conservative</span>
                    <span className="tabular-nums text-foreground">
                      {(ATTACH_RATES.low * 100).toFixed(0)}%
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Planning</span>
                    <span className="tabular-nums text-foreground">
                      {(ATTACH_RATES.moderate * 100).toFixed(0)}%
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>High</span>
                    <span className="tabular-nums text-foreground">
                      {(ATTACH_RATES.high * 100).toFixed(0)}%
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-semibold text-foreground">Book retention (field agents)</h4>
                <p className="mb-2 text-[11px] leading-snug text-muted-foreground">
                  Calibrated for face-to-face independent agents — typically higher than call-center
                  books.
                </p>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex justify-between gap-3">
                    <span>Conservative</span>
                    <span className="tabular-nums text-foreground">
                      {(PERSISTENCY_RATES.low * 100).toFixed(0)}%
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Planning</span>
                    <span className="tabular-nums text-foreground">
                      {(PERSISTENCY_RATES.moderate * 100).toFixed(0)}%
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>High</span>
                    <span className="tabular-nums text-foreground">
                      {(PERSISTENCY_RATES.high * 100).toFixed(0)}%
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              These are not official PSM or carrier commission schedules except where CMS FMV is
              cited for MA structure. Override with your contracts after you calculate.
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
