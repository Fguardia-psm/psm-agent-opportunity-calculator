import { CATEGORY_LABELS } from "@/lib/calculator/assumptions";
import type { CalculationResult } from "@/lib/calculator/types";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MultiLineTableProps {
  result: CalculationResult;
}

export function MultiLineTable({ result }: MultiLineTableProps) {
  const { productLines, horizonYears, effectiveAttach } = result;
  const attachPct = Math.round(effectiveAttach.moderate * 100);

  return (
    <Card className="print:break-inside-avoid">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Opportunity product stack</CardTitle>
        <CardDescription>
          Medicare, ACA, life, and ancillary lines only. Primary markets you selected are marked
          covered. Annuity is a primary-focus choice and does not appear here. Year-1 equals
          first-year commission; path equals multi-year new production and renewals. Planning place
          rate {attachPct}%.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="space-y-3 px-6 sm:hidden">
          {productLines.map((line) => {
            const y1Cases = line.isOffered
              ? 0
              : (line.eligibleActive + line.eligibleNew) * effectiveAttach.moderate;
            return (
              <div
                key={line.productId}
                className={cn(
                  "rounded-xl border px-4 py-3.5",
                  line.isOffered
                    ? "border-border bg-muted/20"
                    : "border-primary/15 bg-primary/[0.02]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{line.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {CATEGORY_LABELS[line.category]}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      line.isOffered
                        ? "bg-muted text-muted-foreground"
                        : "bg-accent/15 text-accent",
                    )}
                  >
                    {line.isOffered ? "Covered" : "Gap"}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Year-1 impact</dt>
                    <dd className="font-semibold tabular-nums text-foreground">
                      {line.isOffered ? "—" : formatCurrency(line.year1Impact.moderate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{horizonYears}-year open path</dt>
                    <dd className="font-semibold tabular-nums text-foreground">
                      {line.isOffered ? "—" : formatCurrency(line.pathCumulative.moderate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">First-year dollars per case</dt>
                    <dd className="tabular-nums">{formatCurrency(line.firstYearRevenue)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Est. Year-1 cases</dt>
                    <dd className="tabular-nums">
                      {line.isOffered ? "—" : `about ${y1Cases.toFixed(1)}`}
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-3 font-medium sm:px-0">Product</th>
                <th className="px-2 py-3 font-medium">Category</th>
                <th className="px-2 py-3 font-medium">Status</th>
                <th className="px-2 py-3 font-medium text-right">1st-yr $</th>
                <th className="px-2 py-3 font-medium text-right">Ren. $</th>
                <th className="px-2 py-3 font-medium text-right">Y1 cases</th>
                <th className="px-2 py-3 font-medium text-right">Year-1</th>
                <th className="px-2 py-3 font-medium text-right sm:pr-0">{horizonYears}-yr path</th>
              </tr>
            </thead>
            <tbody>
              {productLines.map((line) => {
                const y1Cases = line.isOffered
                  ? 0
                  : (line.eligibleActive + line.eligibleNew) * effectiveAttach.moderate;
                return (
                  <tr key={line.productId} className="border-b border-border/70 last:border-0">
                    <td className="px-2 py-3.5 font-medium text-foreground sm:px-0">
                      {line.label}
                      {line.usingCustomRevenue && (
                        <span className="ml-1.5 text-[10px] font-semibold uppercase text-accent">
                          Your $
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3.5 text-muted-foreground">
                      {CATEGORY_LABELS[line.category]}
                    </td>
                    <td className="px-2 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          line.isOffered
                            ? "bg-muted text-muted-foreground"
                            : "bg-accent/15 text-accent",
                        )}
                      >
                        {line.isOffered ? "Covered" : "Open"}
                      </span>
                    </td>
                    <td className="px-2 py-3.5 text-right tabular-nums text-muted-foreground">
                      {formatCurrency(line.firstYearRevenue)}
                    </td>
                    <td className="px-2 py-3.5 text-right tabular-nums text-muted-foreground">
                      {formatCurrency(line.renewalRevenue)}
                    </td>
                    <td className="px-2 py-3.5 text-right tabular-nums text-muted-foreground">
                      {line.isOffered ? "—" : y1Cases.toFixed(1)}
                    </td>
                    <td className="px-2 py-3.5 text-right tabular-nums font-medium text-foreground">
                      {line.isOffered ? "—" : formatCurrency(line.year1Impact.moderate)}
                    </td>
                    <td className="px-2 py-3.5 text-right tabular-nums font-semibold text-foreground sm:pr-0">
                      {line.isOffered ? (
                        "—"
                      ) : (
                        <>
                          {formatCurrency(line.pathCumulative.moderate)}
                          <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                            {formatCurrency(line.pathCumulative.low)}–
                            {formatCurrency(line.pathCumulative.high)}
                          </span>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 px-6 text-xs text-muted-foreground sm:px-0">
          MA defaults follow CMS national FMV structure. Other lines use mid-market planning
          defaults — override with your contract levels above.
        </p>
      </CardContent>
    </Card>
  );
}
