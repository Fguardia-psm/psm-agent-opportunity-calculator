import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SeoContent() {
  return (
    <section
      id="how-it-works"
      className="scroll-offset space-y-6"
      aria-labelledby="how-it-works-heading"
    >
      <div>
        <h2
          id="how-it-works-heading"
          className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          Insurance agent opportunity calculator — any primary market
        </h2>
        <p className="mt-3 max-w-3xl text-muted-foreground leading-relaxed">
          Independent agents often master one lane — Medicare, ACA, life, annuity, or ancillary —
          and leave compatible lines unoffered. Pick your primary markets; this free tool treats those
          as covered and estimates Year-1 first-year commission impact plus a multi-year compounding
          path on Medicare, ACA, life, and ancillary lines outside them that PSM Brokerage can help
          you add.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Built for every agent",
            body: "Medicare-only, life-only, annuity, ACA, ancillary, or mixed books. One question for primary markets — no second product checklist.",
          },
          {
            title: "Year-1 and compounding",
            body: "See first-year commission impact immediately, then how residual renewals and trails stack as in-force builds over 3 or 5 years.",
          },
          {
            title: "Grounded money math",
            body: "MA defaults follow CMS national FMV structure. Other opportunity lines use transparent mid-market planning defaults you can override.",
          },
        ].map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{card.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-foreground">Ready to size your gap?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Run the calculator first. Request a portfolio review only if the numbers warrant a
            conversation.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <a href="#calculator">
            Start the calculator
            <ArrowRight className="size-4" />
          </a>
        </Button>
      </div>
    </section>
  );
}
