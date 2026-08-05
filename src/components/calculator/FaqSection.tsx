import { FAQ_ITEMS } from "@/lib/calculator/assumptions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FaqSection() {
  return (
    <section id="faq" className="scroll-offset" aria-labelledby="faq-heading">
      <h2
        id="faq-heading"
        className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      >
        Frequently asked questions
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Straight answers for independent agents evaluating cross-sell opportunity and multi-year
        practice path illustrations.
      </p>
      <div className="mt-6 grid gap-3">
        {FAQ_ITEMS.map((item) => (
          <Card key={item.question}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold leading-snug sm:text-lg">
                {item.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {item.answer}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
