import type { CalculationResult } from "@/lib/calculator/types";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ScenarioCompareProps {
  result: CalculationResult;
}

export function ScenarioCompare({ result }: ScenarioCompareProps) {
  const { compareScenarios, hasFullPortfolio, horizonYears } = result;
  if (hasFullPortfolio || compareScenarios.length === 0) return null;

  return (
    <Card className="print:break-inside-avoid">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Scenario compare</CardTitle>
        <CardDescription>
          Plan a contracting sprint. Year-1 is first-year commission only; path includes renewals
          over {horizonYears} years.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {compareScenarios.map((scenario, i) => {
          const highlight = scenario.id === "top3" || scenario.id === "top1";
          return (
            <div
              key={scenario.id}
              className={cn(
                "rounded-xl border px-4 py-4",
                highlight ? "border-accent/35 bg-accent/[0.04]" : "border-border bg-muted/15",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-foreground">{scenario.title}</p>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {i + 1}/{compareScenarios.length}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {scenario.description}
              </p>
              {scenario.productLabels.length > 0 && scenario.id !== "open" && (
                <p className="mt-2 text-xs text-foreground">
                  <span className="text-muted-foreground">Lines: </span>
                  {scenario.productLabels.join(" · ")}
                </p>
              )}
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Y1 captured
                  </dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {scenario.id === "open"
                      ? "—"
                      : formatCurrency(scenario.capturedYear1.moderate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {horizonYears}-yr captured
                  </dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {scenario.id === "open"
                      ? "—"
                      : formatCurrency(scenario.capturedPath.moderate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Y1 still open
                  </dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(scenario.remainingYear1.moderate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Path still open
                  </dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(scenario.remainingPath.moderate)}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
