import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { DISCLAIMER_TEXT } from "@/lib/calculator/assumptions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer | Agent Opportunity Calculator | PSM Brokerage" },
      {
        name: "description",
        content:
          "Illustrative estimate disclaimer for the PSM Agent Opportunity Calculator. Not a guarantee of income, commissions, or client suitability.",
      },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <main className="min-h-[calc(100dvh-var(--grok-banner-h,0px))] bg-bg text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Back to calculator
          </Link>
        </Button>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Estimate disclaimer
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Read before relying on any dollar figures from this tool.
        </p>

        <div className="mt-8 space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Core statement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{DISCLAIMER_TEXT}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What the numbers mean</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <span className="font-medium text-foreground">Year-1 impact</span> is first-year
                  commission style dollars on open lines (book attach plus new pipeline), not your
                  total agency income.
                </li>
                <li>
                  <span className="font-medium text-foreground">Multi-year path</span> stacks new
                  production plus residual renewals under illustrative attach and retention rates.
                </li>
                <li>
                  Ranges (conservative / planning / high) are scenario bands, not confidence intervals
                  from your actual book.
                </li>
                <li>
                  Custom assumptions let you override defaults with your own contract economics —
                  still planning estimates only.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your professional duties</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              <p>
                You remain responsible for licensing, appointments, product suitability, advertising
                rules, and compliant consumer recommendations in every state where you practice. PSM
                support does not replace your judgment or carrier guidelines.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
