import { MapPin } from "lucide-react";
import { US_STATES } from "@/lib/calculator/assumptions";
import type { USStateCode } from "@/lib/calculator/types";

interface StateCalloutProps {
  state: USStateCode | "";
}

export function StateCallout({ state }: StateCalloutProps) {
  if (!state) return null;
  const name = US_STATES.find((s) => s.code === state)?.name ?? state;

  return (
    <div className="flex gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3.5 text-sm leading-relaxed text-muted-foreground print:break-inside-avoid">
      <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
      <p>
        <span className="font-medium text-foreground">Modeling for {name}. </span>
        Product availability, licensing, carrier appointments, and compensation vary by state and
        contract. Confirm what you can offer in {name} before presenting any complementary product
        to a consumer.
      </p>
    </div>
  );
}
