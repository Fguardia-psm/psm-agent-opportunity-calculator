import { useState } from "react";
import { Check, Copy, Link2, Printer, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { CalculationResult, CalculatorInputs } from "@/lib/calculator/types";
import { buildEstimateSummary, buildShareUrl } from "@/lib/calculator/share";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ShareActionsProps {
  inputs: CalculatorInputs;
  result: CalculationResult;
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  // Fallback for in-app browsers / non-secure contexts (common in mobile iframes)
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function ShareActions({ inputs, result }: ShareActionsProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

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

  const shareUrl = () => buildShareUrl(inputs);

  const copyLink = async () => {
    const url = shareUrl();
    const ok = await writeClipboard(url);
    if (ok) {
      if (typeof window !== "undefined") {
        const enc = url.split("?s=")[1];
        if (enc) window.history.replaceState(null, "", `?s=${enc}`);
      }
      setCopiedLink(true);
      toast.success("Save link copied");
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      toast.error("Could not copy — long-press and copy the address bar link");
    }
  };

  const copySummary = async () => {
    const text = `${summary}\n\nSaved link:\n${shareUrl()}\n`;
    const ok = await writeClipboard(text);
    if (ok) {
      setCopiedSummary(true);
      toast.success("Estimate summary copied");
      setTimeout(() => setCopiedSummary(false), 2000);
    } else {
      toast.error("Could not copy on this device — try Share instead");
    }
  };

  /** Native share sheet (works on mobile). No mailto — URL length breaks email apps. */
  const shareNative = async () => {
    const url = shareUrl();
    const text = `${summary}\n\n${url}`;
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
        // User cancelled — not an error
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    // Fallback: copy full package
    const ok = await writeClipboard(text);
    if (ok) {
      toast.success("Estimate copied — paste into Messages or email");
    } else {
      toast.error("Sharing is not available in this browser");
    }
  };

  return (
    <Card className="print:hidden border-primary/15">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Take this with you</CardTitle>
        <CardDescription>
          Copy a save link, share your illustrative estimate, or print a one-pager — practice
          numbers only, no private client data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" className="min-h-12 w-full sm:w-auto" onClick={copyLink}>
            {copiedLink ? <Check className="size-4" /> : <Link2 className="size-4" />}
            {copiedLink ? "Link copied" : "Copy save link"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-12 w-full sm:w-auto"
            onClick={copySummary}
          >
            {copiedSummary ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copiedSummary ? "Summary copied" : "Copy estimate summary"}
          </Button>
          <Button
            type="button"
            variant="accent"
            className="min-h-12 w-full sm:w-auto"
            onClick={shareNative}
          >
            <Share2 className="size-4" />
            Share estimate
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-12 w-full sm:w-auto"
            onClick={() => window.print()}
          >
            <Printer className="size-4" />
            Print / save PDF
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          On phones, use <span className="font-medium text-foreground">Share estimate</span> or
          copy — we do not open the mail app from this page (mobile email links are unreliable).
        </p>
      </CardContent>
    </Card>
  );
}
