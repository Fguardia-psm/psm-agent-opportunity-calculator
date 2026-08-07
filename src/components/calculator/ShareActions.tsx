import { useCallback, useId, useRef, useState } from "react";
import { Check, Copy, Printer, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { CalculationResult, CalculatorInputs } from "@/lib/calculator/types";
import { buildEstimateSummary } from "@/lib/calculator/share";
import { copyText, isEmbeddedInIframe } from "@/lib/clipboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface ShareActionsProps {
  inputs: CalculatorInputs;
  result: CalculationResult;
}

export function ShareActions({ inputs, result }: ShareActionsProps) {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [inIframe] = useState(() => isEmbeddedInIframe());
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const baseId = useId();

  const summary = buildEstimateSummary(inputs, {
    year1Low: result.year1ImpactTotal.low,
    year1Mod: result.year1ImpactTotal.moderate,
    year1High: result.year1ImpactTotal.high,
    pathLow: result.pathCumulativeTotal.low,
    pathMod: result.pathCumulativeTotal.moderate,
    pathHigh: result.pathCumulativeTotal.high,
    horizonYears: result.horizonYears,
    activeClients: result.activeClients,
    newClientsPerYear: result.newClientsPerYear,
    topLines: result.topOpportunities.map((p) => p.label),
  });

  const flash = useCallback(() => {
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  }, []);

  const copySummary = async () => {
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const mode = await copyText(summary, summaryRef.current);
    if (mode) {
      flash();
      toast.success("Estimate copied — paste into email or notes");
    } else {
      summaryRef.current?.focus();
      summaryRef.current?.select();
      toast.error("Select the text below and press Ctrl+C / ⌘C");
    }
  };

  const shareNative = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        // Text only — no save URL (HubSpot/marketing URLs do not restore calculator state)
        await navigator.share({
          title: "PSM Agent Opportunity estimate (illustrative)",
          text: summary,
        });
        toast.success("Shared");
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    await copySummary();
  };

  const handlePrint = () => {
    if (isEmbeddedInIframe()) {
      toast.message("Open full screen to print", {
        description: "Print is limited inside the website embed.",
      });
      return;
    }
    try {
      window.print();
    } catch {
      toast.error("Print is not available in this browser");
    }
  };

  return (
    <Card className="print:hidden border-primary/15">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Take this with you</CardTitle>
        <CardDescription>
          Copy or share your illustrative estimate text. No private client data. We do not offer
          save links — they do not restore reliably from the marketing site.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="accent"
            className="min-h-12 w-full sm:w-auto"
            onClick={copySummary}
          >
            {copiedSummary ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copiedSummary ? "Estimate copied" : "Copy estimate"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-12 w-full sm:w-auto"
            onClick={shareNative}
          >
            <Share2 className="size-4" />
            Share
          </Button>
          {!inIframe && (
            <Button
              type="button"
              variant="outline"
              className="min-h-12 w-full sm:w-auto"
              onClick={handlePrint}
            >
              <Printer className="size-4" />
              Print / PDF
            </Button>
          )}
        </div>

        <div className="space-y-1.5 rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={`${baseId}-summary`} className="text-xs font-medium text-foreground">
              Estimate text
            </Label>
            <button
              type="button"
              className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => {
                summaryRef.current?.focus();
                summaryRef.current?.select();
              }}
            >
              Select all
            </button>
          </div>
          <textarea
            ref={summaryRef}
            id={`${baseId}-summary`}
            readOnly
            rows={10}
            value={summary}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[13px]"
            aria-label="Estimate summary text"
          />
          <p className="text-[11px] text-muted-foreground">
            If Copy does nothing: tap the box → Select all → Ctrl+C / ⌘C, or long-press → Copy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
