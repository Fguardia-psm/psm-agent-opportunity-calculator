import { CheckCircle2, Lightbulb, ListOrdered } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/calculator/assumptions";
import type { CalculationResult } from "@/lib/calculator/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface OpportunityBreakdownProps {
  result: CalculationResult;
}

export function OpportunityBreakdown({ result }: OpportunityBreakdownProps) {
  const { topOpportunities, hasFullPortfolio, insight, horizonYears } = result;

  return (
    <div className="space-y-5">
      {!hasFullPortfolio && topOpportunities.length > 0 && (
        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListOrdered className="size-5 text-accent" />
              Largest lines to review
            </CardTitle>
            <CardDescription>
              Ranked by illustrative {horizonYears}-year path (planning). Not a directive to sell
              any product.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topOpportunities.map((product, index) => (
              <div
                key={product.productId}
                className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3.5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">
                    {product.label}
                    <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                      {CATEGORY_LABELS[product.category]}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Y1 {formatCurrency(product.year1Impact.moderate)} ·{" "}
                    {formatCurrency(product.firstYearRevenue)} FY /{" "}
                    {formatCurrency(product.renewalRevenue)} ren per case
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(product.pathCumulative.moderate)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{horizonYears}-yr planning</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="size-5 text-accent" />
            Agent insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground sm:text-base">{insight}</p>
        </CardContent>
      </Card>

      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle className="text-lg">Recommended next steps</CardTitle>
          <CardDescription>Agent-owned actions first; partner support optional.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {[
              "Pick a scenario (top line, top 3, or full stack) and define a 30-day pilot on a slice of your book.",
              "Confirm licensing and carrier appointments in your state before presenting any new line.",
              "Add cross-line review questions to your next client touches — document suitability only.",
              "Optional: request a PSM portfolio review for contracting, training, and product mix help.",
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-sm leading-relaxed">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>
                  <span className="font-semibold text-foreground">{i + 1}. </span>
                  <span className="text-muted-foreground">{step}</span>
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
