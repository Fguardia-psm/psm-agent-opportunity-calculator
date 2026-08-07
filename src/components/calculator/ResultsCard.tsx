import { ArrowRight, MessageCircle, Sparkles, TrendingUp } from "lucide-react";
import type { CalculationResult } from "@/lib/calculator/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DISCLAIMER_TEXT } from "@/lib/calculator/assumptions";

interface ResultsCardProps {
  result: CalculationResult;
}

/**
 * Conversation-strength framing (NOT a grade out of 100).
 * Agents ignore "30/100" — they act on dollars left on the table + open lines.
 */
function conversationStrength(pathModerate: number, openLines: number) {
  if (openLines === 0 || pathModerate <= 0) {
    return {
      label: "Catalog covered",
      urgency: "Focus on reviews, persistency, and case quality with PSM support.",
      bar: 12,
      cta: "Talk with PSM about growth support",
    };
  }
  // Bar scales with planning dollars (caps at ~$120k path = full bar)
  const bar = Math.min(100, Math.max(18, Math.round((pathModerate / 120_000) * 100)));

  if (pathModerate >= 75_000) {
    return {
      label: "Strong case to talk this week",
      urgency:
        "Multi-year planning dollars are large enough that a short portfolio review usually pays for itself in clarity alone.",
      bar,
      cta: "Request a portfolio review",
    };
  }
  if (pathModerate >= 25_000) {
    return {
      label: "Solid expansion opportunity",
      urgency:
        "Enough open-line dollars to justify a focused conversation — not a full agency rebuild.",
      bar,
      cta: "Talk through my open lines",
    };
  }
  if (pathModerate >= 8_000) {
    return {
      label: "Worth a focused review",
      urgency:
        "Even mid-size gaps compound with renewals. A 15-minute review beats guessing which line to add first.",
      bar,
      cta: "See how PSM would prioritize this",
    };
  }
  return {
    label: "A few open lines",
    urgency:
      "Smaller dollar gap still means room to add one high-fit line. Low pressure — high clarity.",
    bar: Math.max(bar, 22),
    cta: "Quick check-in with PSM",
  };
}

export function ResultsCard({ result }: ResultsCardProps) {
  const {
    year1ImpactTotal,
    pathCumulativeTotal,
    existingBookGapTotal,
    newPipelineYear1Total,
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
    productLines,
    topOpportunities,
  } = result;

  const lastYear = moderatePathByYear[moderatePathByYear.length - 1];
  const y2 = moderatePathByYear[1];
  const compoundRenewals =
    moderatePathByYear.reduce((s, y) => s + y.renewalProduction, 0) || 0;
  const y1Placed = moderatePathByYear[0]?.newPlaced ?? 0;
  const y1Book = moderatePathByYear[0]?.bookAttachProduction ?? existingBookGapTotal.moderate;
  const y1Pipe = moderatePathByYear[0]?.pipelineProduction ?? newPipelineYear1Total.moderate;
  const renY2 = y2?.renewalProduction ?? 0;
  const renLast = lastYear?.renewalProduction ?? 0;
  const renGrowing = renLast + 0.5 >= renY2;

  const maOpen = productLines.find(
    (l) => l.productId === "medicare-advantage" && !l.isOffered,
  );

  const openCount = missingProducts.length;
  const strength = conversationStrength(pathCumulativeTotal.moderate, openCount);
  const topLine = topOpportunities[0];
  const topCategory = categoryRollups[0];

  const scrollToLead = () => {
    document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
        <CardTitle className="text-xl leading-snug sm:text-3xl">
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
              · {openCount} open line{openCount === 1 ? "" : "s"} · planning place rate{" "}
              {Math.round(effectiveAttach.moderate * 100)}% · persistency{" "}
              {Math.round(effectivePersistency.moderate * 100)}%
              {usedCustomAssumptions ? " (your overrides)" : ""}
            </>
          )}
          . Not a guarantee of income.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!hasFullPortfolio && (
          <div
            className="rounded-xl border border-border bg-muted/30 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground sm:text-[13px]"
            role="note"
          >
            <span className="font-medium text-foreground">How to read these dollars: </span>
            Planning uses about {Math.round(effectiveAttach.moderate * 100)}% place rate on
            eligible clients and about {Math.round(effectivePersistency.moderate * 100)}% annual
            book retention. Figures are potential and illustrative — not a quote, not guaranteed
            income, and not advice that any product is suitable for a client. Adjust rates under
            “Use my contract assumptions.”
          </div>
        )}
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
                  First-year commission only — one-time book attach plus new pipeline. Illustrative.
                </p>
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  Estimated range
                </p>
                <p className="mt-1 font-display text-[1.35rem] font-semibold tabular-nums leading-snug text-foreground sm:text-2xl">
                  {formatCurrency(year1ImpactTotal.low)} – {formatCurrency(year1ImpactTotal.high)}
                </p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Planning estimate
                </p>
                <p className="mt-0.5 font-display text-[1.75rem] font-semibold tabular-nums leading-none text-foreground sm:text-4xl">
                  {formatCurrency(year1ImpactTotal.moderate)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                  Book attach {formatCurrency(y1Book)} · New pipeline {formatCurrency(y1Pipe)}
                  {y1Placed > 0 ? ` · about ${y1Placed.toFixed(1)} cases` : ""}
                </p>
              </div>

              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
                <div className="flex items-center gap-2 text-accent">
                  <TrendingUp className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    {horizonYears}-year cumulative path
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sum of every year — new production plus renewals. Illustrative cumulative path.
                </p>
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  Estimated range
                </p>
                <p className="mt-1 font-display text-[1.35rem] font-semibold tabular-nums leading-snug text-primary sm:text-2xl">
                  {formatCurrency(pathCumulativeTotal.low)} –{" "}
                  {formatCurrency(pathCumulativeTotal.high)}
                </p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Planning estimate
                </p>
                <p className="mt-0.5 font-display text-[1.75rem] font-semibold tabular-nums leading-none text-primary sm:text-4xl">
                  {formatCurrency(pathCumulativeTotal.moderate)}
                </p>
                {pathCumulativeTotal.moderate > 0 && year1ImpactTotal.moderate > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Cumulative is{" "}
                    <span className="font-semibold text-foreground">
                      {(pathCumulativeTotal.moderate / year1ImpactTotal.moderate).toFixed(1)} times
                    </span>{" "}
                    Year-1 first-year dollars — residual renewals and ongoing new production add on.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Existing-book attach",
                  hint: "One-time Year-1 first-year $ on your book",
                  value: existingBookGapTotal.moderate,
                },
                {
                  label: "New pipeline (Year 1)",
                  hint: "Year-1 first-year $ on new clients",
                  value: newPipelineYear1Total.moderate,
                },
                {
                  label: "All renewals in path",
                  hint: `Residual stack across ${horizonYears} years`,
                  value: compoundRenewals,
                  highlight: true,
                },
                {
                  label:
                    y2 && lastYear
                      ? `Renewals Y2 → Y${lastYear.year}`
                      : "Renewal trajectory",
                  hint: renGrowing
                    ? "Residual growing as in-force builds"
                    : "Residual after large catch-up",
                  valueLabel:
                    y2 && lastYear
                      ? `${formatCurrency(renY2)} → ${formatCurrency(renLast)}`
                      : "—",
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
                    {"valueLabel" in item && item.valueLabel
                      ? item.valueLabel
                      : formatCurrency(item.value as number)}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{item.hint}</p>
                </div>
              ))}
            </div>

            {maOpen && (
              <div className="rounded-xl border border-border bg-muted/25 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Medicare Advantage residual: </span>
                about {formatCurrency(maOpen.firstYearRevenue)} first-year and{" "}
                {formatCurrency(maOpen.renewalRevenue)} renewal per case (about 50% — CMS national
                FMV structure). Year-1 MA impact{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCurrency(maOpen.year1Impact.moderate)}
                </span>
                ; {horizonYears}-year MA path{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCurrency(maOpen.pathCumulative.moderate)}
                </span>
                .
              </div>
            )}

            {lastYear && (
              <p className="text-xs text-muted-foreground">
                Through Year {horizonYears}, cumulative planning dollars reach{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(lastYear.cumulativeTotal)}
                </span>
                . Year {horizonYears} alone is about{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(lastYear.total)}
                </span>{" "}
                ({formatCurrency(lastYear.pipelineProduction)} new +{" "}
                {formatCurrency(lastYear.renewalProduction)} renewals).
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

            <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-3 sm:gap-3">
              {[
                { label: "Conservative", value: pathCumulativeTotal.low },
                { label: "Planning", value: pathCumulativeTotal.moderate, highlight: true },
                { label: "High", value: pathCumulativeTotal.high },
              ].map((item) => (
                <div
                  key={item.label}
                  className={
                    item.highlight
                      ? "flex items-center justify-between rounded-xl border border-primary/25 bg-primary/[0.04] px-3.5 py-3 min-[400px]:flex-col min-[400px]:items-center min-[400px]:justify-center min-[400px]:text-center sm:px-3"
                      : "flex items-center justify-between rounded-xl border border-border bg-surface/60 px-3.5 py-3 min-[400px]:flex-col min-[400px]:items-center min-[400px]:justify-center min-[400px]:text-center sm:px-3"
                  }
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label} path
                  </p>
                  <p className="text-base font-semibold tabular-nums text-foreground min-[400px]:mt-1 sm:text-base">
                    {formatCurrency(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* CTA motivator — dollars + open lines, never a low /100 grade */}
        <div className="rounded-2xl border border-accent/30 bg-accent/[0.06] px-3.5 py-4 sm:px-5 sm:py-5 print:hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2 text-accent">
                <MessageCircle className="size-4 shrink-0" />
                <p className="text-xs font-semibold uppercase tracking-wider">
                  Why this is worth a conversation
                </p>
              </div>
              <p className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                {strength.label}
              </p>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {strength.urgency}
              </p>
              {!hasFullPortfolio && (
                <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  <li className="rounded-full border border-border bg-surface px-2.5 py-1 font-medium text-foreground">
                    {openCount} open line{openCount === 1 ? "" : "s"}
                  </li>
                  <li className="rounded-full border border-border bg-surface px-2.5 py-1 font-medium tabular-nums text-foreground">
                    {formatCurrency(pathCumulativeTotal.moderate)} planning path
                  </li>
                  {topLine && (
                    <li className="rounded-full border border-border bg-surface px-2.5 py-1 text-muted-foreground">
                      Largest:{" "}
                      <span className="font-medium text-foreground">{topLine.label}</span>
                    </li>
                  )}
                  {topCategory && (
                    <li className="rounded-full border border-border bg-surface px-2.5 py-1 text-muted-foreground">
                      Focus category:{" "}
                      <span className="font-medium text-foreground">{topCategory.label}</span>
                    </li>
                  )}
                </ul>
              )}
              <p className="text-[11px] text-muted-foreground">
                This is not a performance grade. It is an estimate of dollars and lines still open
                in your practice — illustrative only.
              </p>
            </div>
            <Button type="button" size="lg" className="min-h-12 w-full shrink-0 text-base sm:w-auto sm:text-sm" onClick={scrollToLead}>
              {strength.cta}
              <ArrowRight className="size-4" />
            </Button>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Conversation priority (based on planning dollars)</span>
              <span className="font-medium text-accent">{strength.label}</span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={strength.bar}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Conversation priority based on planning dollars"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${strength.bar}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Filled by estimated multi-year path size — not a test score. Larger dollars mean a
              stronger reason to book a short review.
            </p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">{DISCLAIMER_TEXT}</p>
      </CardContent>
    </Card>
  );
}
