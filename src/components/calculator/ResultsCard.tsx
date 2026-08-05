import { Layers, Sparkles, TrendingUp } from "lucide-react";
import type { CalculationResult } from "@/lib/calculator/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DISCLAIMER_TEXT } from "@/lib/calculator/assumptions";

interface ResultsCardProps {
  result: CalculationResult;
}

const BAND_LABEL: Record<CalculationResult["portfolioBand"], string> = {
  broad: "Broad catalog",
  some: "Some opportunity",
  significant: "Significant opportunity",
  high: "High opportunity",
};

export function ResultsCard({ result }: ResultsCardProps) {
  const {
    year1ImpactTotal,
    pathCumulativeTotal,
    existingBookGapTotal,
    newPipelineYear1Total,
    portfolioScore,
    portfolioBand,
    hasFullPortfolio,
    horizonYears,
    activeClients,
    newClientsPerYear,
    effectiveAttach,
    effectivePersistency,
    usedCustomAssumptions,
    categoryRollups,
    moderatePathByYear,
    missingProducts,
  } = result;

  const lastYear = moderatePathByYear[moderatePathByYear.length - 1];
  const compoundRenewals =
    moderatePathByYear.reduce((s, y) => s + y.renewalProduction, 0) || 0;
  const y1Placed = moderatePathByYear[0]?.newPlaced ?? 0;
  const y1Renewals = moderatePathByYear[0]?.renewalProduction ?? 0;

  return (
    <Card
      id="overview"
      className="scroll-offset-deep overflow-hidden border-primary/15 bg-result-card shadow-elevated print:break-inside-avoid"
    >
      <CardHeader className="pb-3">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-accent">
          <TrendingUp className="size-5" strokeWidth={2} />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Practice opportunity estimate
          </span>
          {usedCustomAssumptions && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
              Custom rates
            </span>
          )}
        </div>
        <CardTitle className="text-2xl sm:text-3xl">
          {hasFullPortfolio
            ? "You marked the full PSM catalog as offered"
            : "What you may leave on the table — Year 1 and over time"}
        </CardTitle>
        <CardDescription className="text-base">
          Based on {activeClients.toLocaleString()} clients/households and{" "}
          {newClientsPerYear.toLocaleString()} new per year
          {!hasFullPortfolio && (
            <>
              {" "}
              · {missingProducts.length} open line{missingProducts.length === 1 ? "" : "s"} · planning
              place rate {Math.round(effectiveAttach.moderate * 100)}% · persistency{" "}
              {Math.round(effectivePersistency.moderate * 100)}%
              {usedCustomAssumptions ? " (your overrides)" : ""}
            </>
          )}
          . Not a guarantee of income.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {hasFullPortfolio ? (
          <div className="rounded-xl border border-border bg-surface/80 p-5">
            <p className="text-base font-medium leading-relaxed text-foreground">
              With every catalog line marked as offered, focus on review consistency, persistency,
              carrier mix, and case quality.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-surface p-5">
                <div className="flex items-center gap-2 text-accent">
                  <Sparkles className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide">Year-1 impact</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  First-year commission only (book attach plus new pipeline)
                </p>
                <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
                  {formatCurrency(year1ImpactTotal.moderate)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                  Range {formatCurrency(year1ImpactTotal.low)} –{" "}
                  {formatCurrency(year1ImpactTotal.high)}
                </p>
                {y1Placed > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    About {y1Placed.toFixed(1)} illustrative cases placed in Year 1 (planning)
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
                <div className="flex items-center gap-2 text-accent">
                  <TrendingUp className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    {horizonYears}-year compounding path
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  New production each year plus renewals on retained in-force
                </p>
                <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-primary sm:text-4xl">
                  {formatCurrency(pathCumulativeTotal.moderate)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                  Range {formatCurrency(pathCumulativeTotal.low)} –{" "}
                  {formatCurrency(pathCumulativeTotal.high)}
                </p>
                {pathCumulativeTotal.moderate > 0 && year1ImpactTotal.moderate > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Path is{" "}
                    <span className="font-semibold text-foreground">
                      {(pathCumulativeTotal.moderate / year1ImpactTotal.moderate).toFixed(1)} times
                    </span>{" "}
                    Year-1 — residual stack compounds
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Existing-book attach",
                  hint: "Year-1 first-year dollars on eligible clients you already have",
                  value: existingBookGapTotal.moderate,
                  range: existingBookGapTotal,
                },
                {
                  label: "New pipeline (Year 1)",
                  hint: "Year-1 first-year dollars on this year’s new clients",
                  value: newPipelineYear1Total.moderate,
                  range: newPipelineYear1Total,
                },
                {
                  label: "Renewals in path",
                  hint: `Sum of residual dollars across ${horizonYears} years (compounding)`,
                  value: compoundRenewals,
                  range: null,
                  highlight: true,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={
                    item.highlight
                      ? "rounded-xl border border-accent/30 bg-accent/5 px-3.5 py-3.5"
                      : "rounded-xl border border-border bg-surface/60 px-3.5 py-3.5"
                  }
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                    {formatCurrency(item.value)}
                  </p>
                  {item.range && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatCurrency(item.range.low)} – {formatCurrency(item.range.high)}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{item.hint}</p>
                </div>
              ))}
            </div>

            {lastYear && (
              <p className="text-xs text-muted-foreground">
                By Year {horizonYears} (planning), annual cash flow on these open lines is about{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(lastYear.total)}
                </span>{" "}
                ({formatCurrency(lastYear.firstYearProduction)} new plus{" "}
                {formatCurrency(lastYear.renewalProduction)} renewals)
                {y1Renewals === 0
                  ? " — renewals start building after Year 1 placements persist."
                  : ""}
                .
              </p>
            )}

            {categoryRollups.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Open opportunity by category
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {categoryRollups.map((r) => (
                    <div
                      key={r.category}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/70 px-3.5 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {r.missingCount} line{r.missingCount === 1 ? "" : "s"} not offered
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrency(r.year1Impact.moderate)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Year-1 planning</p>
                        <p className="text-xs font-medium tabular-nums text-primary">
                          {formatCurrency(r.pathCumulative.moderate)}
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            / {horizonYears} years
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "Conservative", value: pathCumulativeTotal.low },
                { label: "Planning", value: pathCumulativeTotal.moderate, highlight: true },
                { label: "High", value: pathCumulativeTotal.high },
              ].map((item) => (
                <div
                  key={item.label}
                  className={
                    item.highlight
                      ? "rounded-xl border border-primary/25 bg-primary/[0.04] px-3 py-3 text-center"
                      : "rounded-xl border border-border bg-surface/60 px-3 py-3 text-center"
                  }
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label} path
                  </p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-foreground sm:text-base">
                    {formatCurrency(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="rounded-xl border border-border/80 bg-surface/70 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Layers className="size-4 shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Catalog gap score
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Share of PSM catalog lines not yet offered — not a performance rating
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-semibold tabular-nums text-foreground">
                {portfolioScore}
                <span className="text-base font-normal text-muted-foreground">/100</span>
              </p>
              <p className="text-xs font-medium text-accent">{BAND_LABEL[portfolioBand]}</p>
            </div>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={portfolioScore}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Catalog gap score"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${Math.min(100, Math.max(0, portfolioScore))}%` }}
            />
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">{DISCLAIMER_TEXT}</p>
      </CardContent>
    </Card>
  );
}
