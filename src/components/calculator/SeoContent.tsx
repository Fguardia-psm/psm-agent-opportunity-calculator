import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SeoContent() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 space-y-6"
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
          and leave compatible lines unoffered. This free tool estimates Year-1 first-year commission
          impact and a multi-year compounding path (new production + renewals/trails) on catalog lines
          you do not write today that PSM Brokerage can help you add.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Built for every agent",
            body: "Medicare-only, life-only, annuity, ACA, ancillary, or mixed books. Eligibility mix routes opportunity to the right segment of your clients.",
          },
          {
            title: "Year-1 and compounding",
            body: "See first-year commission impact immediately, then how residual renewals and trails stack as in-force builds over 3 or 5 years.",
          },
          {
            title: "Grounded money math",
            body: "MA defaults follow CMS national FMV structure. Annuity and other lines use transparent mid-market planning defaults you can override with your contracts.",
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
    </section>
  );
}
