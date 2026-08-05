import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CalculationResult } from "@/lib/calculator/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BookPathChartProps {
  result: CalculationResult;
}

const moneyTick = (v: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
  }).format(Number(v));

export function BookPathChart({ result }: BookPathChartProps) {
  const {
    moderatePathByYear,
    hasFullPortfolio,
    horizonYears,
    pathCumulativeTotal,
    existingBookGapTotal,
    newPipelineYear1Total,
    effectivePersistency,
    effectiveAttach,
    productLines,
  } = result;

  if (hasFullPortfolio || moderatePathByYear.length === 0) return null;

  const persPct = Math.round(effectivePersistency.moderate * 100);
  const attachPct = Math.round(effectiveAttach.moderate * 100);

  const annualData = moderatePathByYear.map((y) => ({
    name: `Year ${y.year}`,
    "One-time book attach": Math.round(y.bookAttachProduction),
    "New production": Math.round(y.pipelineProduction),
    Renewals: Math.round(y.renewalProduction),
  }));

  const cumData = moderatePathByYear.map((y) => ({
    name: `Year ${y.year}`,
    Cumulative: Math.round(y.cumulativeTotal),
    "This year": Math.round(y.total),
  }));

  // Residual-only series (years 2+) — pure compounding view
  const residualData = moderatePathByYear.map((y) => ({
    name: `Year ${y.year}`,
    Renewals: Math.round(y.renewalProduction),
    "New production": Math.round(y.pipelineProduction),
    "Annual total": Math.round(y.total),
  }));

  const y1 = moderatePathByYear[0];
  const y2 = moderatePathByYear[1];
  const last = moderatePathByYear[moderatePathByYear.length - 1];

  const y1Check =
    Math.abs(
      (y1?.firstYearProduction ?? 0) -
        (existingBookGapTotal.moderate + newPipelineYear1Total.moderate),
    ) < 1;
  const cumCheck =
    Math.abs((last?.cumulativeTotal ?? 0) - pathCumulativeTotal.moderate) < 1;

  let retentionOk = true;
  for (let i = 1; i < moderatePathByYear.length; i++) {
    const prior = moderatePathByYear[i - 1].inforceEnd;
    const expectedEnd =
      prior * effectivePersistency.moderate + moderatePathByYear[i].newPlaced;
    if (Math.abs(moderatePathByYear[i].inforceEnd - expectedEnd) > 0.05) {
      retentionOk = false;
    }
  }

  const renY2 = y2?.renewalProduction ?? 0;
  const renLast = last?.renewalProduction ?? 0;
  const renGrowing = renLast >= renY2 - 0.5;
  const renGrowthPct =
    renY2 > 0 ? Math.round(((renLast - renY2) / renY2) * 100) : renLast > 0 ? 100 : 0;

  // Medicare Advantage line for CMS residual callout
  const maLine = productLines.find(
    (l) => l.productId === "medicare-advantage" && !l.isOffered,
  );
  const maPath = maLine?.moderatePath ?? [];
  const maRenY2 = maPath[1]?.renewalProduction ?? 0;
  const maRenLast = maPath[maPath.length - 1]?.renewalProduction ?? 0;
  const maCum = maPath[maPath.length - 1]?.cumulativeTotal ?? 0;

  return (
    <Card className="print:break-inside-avoid">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">
          Compounding path — Year 1 through {horizonYears}
        </CardTitle>
        <CardDescription>
          Planning place rate {attachPct}% · book retention {persPct}% each year. Cumulative dollars
          always climb. Residual renewals (especially Medicare Advantage at about half of first-year
          compensation) are the compounding engine after Year 1.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Residual growth callout */}
        {y2 && last && last.year >= 2 && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-accent/30 bg-accent/5 px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                Residual renewals Year 2
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                {formatCurrency(renY2)}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Paid on {persPct}% of Year-1 in-force
              </p>
            </div>
            <div className="rounded-xl border border-accent/30 bg-accent/5 px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                Residual renewals Year {last.year}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                {formatCurrency(renLast)}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {renGrowing
                  ? `Up about ${renGrowthPct}% vs Year 2 — in-force still building`
                  : "Slightly lower than Year 2 if catch-up was large vs new production — still ≥85% retention"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                All renewals in path
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                {formatCurrency(
                  moderatePathByYear.reduce((s, y) => s + y.renewalProduction, 0),
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Extra dollars beyond first-year commission alone
              </p>
            </div>
          </div>
        )}

        {maLine && maPath.length >= 2 && (
          <div className="rounded-xl border border-primary/20 bg-primary/[0.03] px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Medicare Advantage residual check (CMS-style)</p>
            <p className="mt-1">
              Planning uses about{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatCurrency(maLine.firstYearRevenue)}
              </span>{" "}
              first-year and{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatCurrency(maLine.renewalRevenue)}
              </span>{" "}
              renewal per placed case (about 50% of first-year — national FMV structure). At{" "}
              {persPct}% retention, MA renewals move from{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {formatCurrency(maRenY2)}
              </span>{" "}
              in Year 2 to{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {formatCurrency(maRenLast)}
              </span>{" "}
              in Year {horizonYears}
              {maRenLast >= maRenY2 ? " (growing as in-force builds)" : ""}. MA{" "}
              {horizonYears}-year cumulative path:{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {formatCurrency(maCum)}
              </span>
              .
            </p>
            <p className="mt-1.5 font-mono text-[10px] text-foreground/80">
              retained = prior in-force × {persPct}% · ren $ = retained ×{" "}
              {formatCurrency(maLine.renewalRevenue)} · end in-force = retained + new placed
            </p>
          </div>
        )}

        {/* Cumulative — primary compounding view */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">
            1. Cumulative opportunity dollars (always rises)
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
            Running total of first-year production plus renewals through each year.
          </p>
          <div className="h-56 w-full sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cumData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--color-border)" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={moneyTick}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  formatter={(value: number | string, name: string) => [
                    formatCurrency(Number(value)),
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Cumulative"
                  fill="var(--color-accent)"
                  fillOpacity={0.12}
                  stroke="var(--color-accent)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--color-accent)" }}
                />
                <Bar
                  dataKey="This year"
                  fill="var(--color-primary)"
                  fillOpacity={0.35}
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Residual renewals growth — the compounding engine */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">
            2. Residual renewals building (compounding engine)
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
            Teal line = renewal dollars only. With {persPct}% retention and ongoing new production,
            this line should rise after Year 1 as in-force stacks (Medicare Advantage renewals are
            about half of first-year compensation each retained year).
          </p>
          <div className="h-56 w-full sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={residualData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--color-border)" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={moneyTick}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  formatter={(value: number | string, name: string) => [
                    formatCurrency(Number(value)),
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="New production"
                  fill="var(--color-primary)"
                  fillOpacity={0.35}
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
                <Line
                  type="monotone"
                  dataKey="Renewals"
                  stroke="var(--color-accent)"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "var(--color-accent)" }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Annual composition including catch-up */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">
            3. Full annual mix (includes Year-1 book attach)
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
            Year 1 is tall because of one-time attach on clients you already have. That is not
            reverse compounding — it seeds the in-force that pays the residual line above.
          </p>
          <div className="h-56 w-full sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={annualData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--color-border)" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={moneyTick}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  formatter={(value: number | string, name: string) => [
                    formatCurrency(Number(value)),
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="One-time book attach"
                  stackId="a"
                  fill="var(--color-primary)"
                  fillOpacity={0.4}
                />
                <Bar dataKey="New production" stackId="a" fill="var(--color-primary)" />
                <Bar
                  dataKey="Renewals"
                  stackId="a"
                  fill="var(--color-accent)"
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <ul className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {moderatePathByYear.map((y, i) => {
            const prior = i === 0 ? 0 : moderatePathByYear[i - 1].inforceEnd;
            const retained = prior * effectivePersistency.moderate;
            return (
              <li
                key={y.year}
                className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-xs"
              >
                <p className="font-medium text-foreground">Year {y.year}</p>
                {y.bookAttachProduction > 0.5 && (
                  <p className="mt-1 tabular-nums text-muted-foreground">
                    Book attach: {formatCurrency(y.bookAttachProduction)}
                  </p>
                )}
                <p className="mt-1 tabular-nums text-muted-foreground">
                  New: {formatCurrency(y.pipelineProduction)}
                </p>
                <p className="tabular-nums text-muted-foreground">
                  Renewals: {formatCurrency(y.renewalProduction)}
                </p>
                <p className="mt-1 font-semibold tabular-nums text-foreground">
                  Year total: {formatCurrency(y.total)}
                </p>
                <p className="font-semibold tabular-nums text-accent">
                  Cumulative: {formatCurrency(y.cumulativeTotal)}
                </p>
                <p className="mt-1.5 border-t border-border/70 pt-1.5 tabular-nums text-[10px] leading-snug text-muted-foreground">
                  {i === 0 ? (
                    <>In-force end: ~{y.inforceEnd.toFixed(1)} cases</>
                  ) : (
                    <>
                      Keep {persPct}% of ~{prior.toFixed(1)} → ~{retained.toFixed(1)} + ~
                      {y.newPlaced.toFixed(1)} new = ~{y.inforceEnd.toFixed(1)}
                    </>
                  )}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">Medicare + residual math</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4">
            <li>
              <span className="font-medium text-foreground">MA / PDP</span> — renewal defaults are
              about 50% of first-year (CMS national FMV structure). That residual repeats every year
              a case stays in force.
            </li>
            <li>
              <span className="font-medium text-foreground">Retention</span> — each year: kept cases =
              prior × {persPct}%. Renewals pay only on kept cases. New production adds to in-force.
            </li>
            <li>
              <span className="font-medium text-foreground">When renewals grow</span> — when new cases
              exceed lapses (about {100 - persPct}% of prior in-force). Field agents with steady new
              flow usually see the residual line climb.
            </li>
            <li>
              Planning total through Year {horizonYears}:{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {formatCurrency(pathCumulativeTotal.moderate)}
              </span>
              .
            </li>
          </ul>
          {(!y1Check || !cumCheck || !retentionOk) && (
            <p className="mt-2 text-danger">
              Chart integrity check failed — totals may not match the overview. Please recalculate.
            </p>
          )}
          {y1Check && cumCheck && retentionOk && (
            <p className="mt-2 text-[11px] font-medium text-accent">
              Integrity OK — Year-1 split, cumulative path, and {persPct}% retention math line up.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
