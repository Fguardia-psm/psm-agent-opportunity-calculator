import { useState } from "react";
import { Check, Copy, Link2, Mail, Printer } from "lucide-react";
import type { CalculationResult, CalculatorInputs } from "@/lib/calculator/types";
import { buildEstimateSummary, buildShareUrl } from "@/lib/calculator/share";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShareActionsProps {
  inputs: CalculatorInputs;
  result: CalculationResult;
}

export function ShareActions({ inputs, result }: ShareActionsProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [email, setEmail] = useState("");

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
    try {
      await navigator.clipboard.writeText(url);
      if (typeof window !== "undefined") {
        const enc = url.split("?s=")[1];
        if (enc) window.history.replaceState(null, "", `?s=${enc}`);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const emailEstimate = () => {
    const to = email.trim();
    const subject = encodeURIComponent("My PSM Agent Opportunity estimate (illustrative)");
    const body = encodeURIComponent(
      `${summary}\n\nSaved link (practice inputs only):\n${shareUrl()}\n`,
    );
    window.location.href = to
      ? `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <Card className="print:hidden border-primary/15">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Take this with you</CardTitle>
        <CardDescription>
          Bookmark your numbers, email yourself, or print a one-pager — no private client data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" onClick={copyLink}>
            {copiedLink ? <Check className="size-4" /> : <Link2 className="size-4" />}
            {copiedLink ? "Link copied" : "Copy save link"}
          </Button>
          <Button type="button" variant="outline" onClick={copySummary}>
            {copiedSummary ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copiedSummary ? "Summary copied" : "Copy estimate summary"}
          </Button>
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print / save PDF
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <Label htmlFor="email-estimate" className="text-sm">
            Email me this estimate
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Opens your email app with Year-1 and multi-year figures pre-filled.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              id="email-estimate"
              type="email"
              placeholder="you@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="sm:max-w-xs"
            />
            <Button type="button" variant="accent" onClick={emailEstimate}>
              <Mail className="size-4" />
              Open email
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
