import { useCallback, useId, useRef, useState } from "react";
import { Check, Copy, Link2, Printer, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { CalculationResult, CalculatorInputs } from "@/lib/calculator/types";
import { buildEstimateSummary, buildShareUrl } from "@/lib/calculator/share";
import { copyText, isEmbeddedInIframe } from "@/lib/clipboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface ShareActionsProps {
  inputs: CalculatorInputs;
  result: CalculationResult;
}

export function ShareActions({ inputs, result }: ShareActionsProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [inIframe] = useState(() => isEmbeddedInIframe());
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const linkRef = useRef<HTMLTextAreaElement>(null);
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

  const url = buildShareUrl(inputs);
  const packageText = `${summary}\n\nSaved link (practice inputs only):\n${url}\n`;

  const flash = useCallback((kind: "link" | "summary") => {
    if (kind === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    }
  }, []);

  const copyLink = async () => {
    const mode = await copyText(url, linkRef.current);
    if (mode) {
      try {
        const enc = url.split("?s=")[1];
        if (enc) window.history.replaceState(null, "", `?s=${enc}`);
      } catch {
        /* ignore */
      }
      flash("link");
      toast.success("Save link copied — paste anywhere");
    } else {
      linkRef.current?.focus();
      linkRef.current?.select();
      toast.error("Select the link below and press Ctrl+C / ⌘C");
    }
  };

  const copySummary = async () => {
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const mode = await copyText(packageText, summaryRef.current);
    if (mode) {
      flash("summary");
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
        await navigator.share({
          title: "PSM Agent Opportunity estimate (illustrative)",
          text: summary,
          url,
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
          Copy your illustrative estimate or a save link. No private client data. We do not open
          the mail app from this page (it is unreliable on phones).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" className="min-h-12 w-full sm:w-auto" onClick={copyLink}>
            {copiedLink ? <Check className="size-4" /> : <Link2 className="size-4" />}
            {copiedLink ? "Link copied" : "Copy save link"}
          </Button>
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

        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${baseId}-link`} className="text-xs font-medium text-foreground">
              Save link
            </Label>
            <textarea
              ref={linkRef}
              id={`${baseId}-link`}
              readOnly
              rows={2}
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 font-mono text-[11px] leading-snug text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Save link"
            />
          </div>

          <div className="space-y-1.5">
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
              value={packageText}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[13px]"
              aria-label="Estimate summary text"
            />
            <p className="text-[11px] text-muted-foreground">
              If Copy does nothing: tap the box → Select all → Ctrl+C / ⌘C, or long-press → Copy.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
