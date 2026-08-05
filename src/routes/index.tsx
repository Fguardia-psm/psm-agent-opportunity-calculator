import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { calculateOpportunity, canCalculate } from "@/lib/calculator/calculate";
import { defaultInputs } from "@/lib/calculator/defaults";
import { buildShareUrl, decodeInputs, readShareParam } from "@/lib/calculator/share";
import type { CalculationResult, CalculatorInputs, LeadSubmission } from "@/lib/calculator/types";
import { Hero } from "@/components/calculator/Hero";
import { CalculatorWizard } from "@/components/calculator/CalculatorWizard";
import { ResultsCard } from "@/components/calculator/ResultsCard";
import { MultiLineTable } from "@/components/calculator/MultiLineTable";
import { BookPathChart } from "@/components/calculator/BookPathChart";
import { OpportunityBreakdown } from "@/components/calculator/OpportunityBreakdown";
import { ScenarioCompare } from "@/components/calculator/ScenarioCompare";
import { CustomAssumptionsEditor } from "@/components/calculator/CustomAssumptionsEditor";
import { ShareActions } from "@/components/calculator/ShareActions";
import { AgentPlaybook } from "@/components/calculator/AgentPlaybook";
import { StateCallout } from "@/components/calculator/StateCallout";
import { LeadCaptureForm } from "@/components/calculator/LeadCaptureForm";
import { AssumptionsPanel } from "@/components/calculator/AssumptionsPanel";
import { DisclaimerFooter } from "@/components/calculator/DisclaimerFooter";
import { FaqSection } from "@/components/calculator/FaqSection";
import { SeoContent } from "@/components/calculator/SeoContent";
import { JsonLd } from "@/components/calculator/JsonLd";
import { Button } from "@/components/ui/button";
import { PRIVACY_NOTE } from "@/lib/calculator/assumptions";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [inputs, setInputs] = useState<CalculatorInputs>(() => defaultInputs());
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [leads, setLeads] = useState<LeadSubmission[]>([]);
  const [restored, setRestored] = useState(false);
  const calculatorRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const param = readShareParam(window.location.search);
    if (!param) {
      setRestored(true);
      return;
    }
    const decoded = decodeInputs(param);
    if (decoded) {
      setInputs(decoded);
      const calc = calculateOpportunity(decoded);
      if (calc) {
        setResult(calc);
        setShowResults(true);
      }
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!showResults || !canCalculate(inputs) || typeof window === "undefined") return;
    const url = buildShareUrl(inputs);
    const enc = url.split("?s=")[1];
    if (enc) window.history.replaceState(null, "", `?s=${enc}`);
  }, [inputs, showResults]);

  const handleCalculate = useCallback(() => {
    const next = calculateOpportunity(inputs);
    if (!next) return;
    setResult(next);
    setShowResults(true);
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [inputs]);

  const handleReset = () => {
    setInputs(defaultInputs());
    setResult(null);
    setShowResults(false);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
    requestAnimationFrame(() => {
      calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleInputsChange = (next: CalculatorInputs) => {
    setInputs(next);
    if (showResults) {
      setResult(calculateOpportunity(next));
    }
  };

  if (!restored) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-bg text-sm text-muted-foreground">
        Loading calculator…
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-var(--grok-banner-h,0px))] bg-bg text-foreground">
      <JsonLd />

      <header className="sticky top-[var(--grok-banner-h,0px)] z-40 border-b border-border/80 bg-surface/90 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[11px] font-bold tracking-tight text-primary-foreground">
              PSM
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">PSM Brokerage</p>
              <p className="truncate text-[11px] text-muted-foreground">
                Agent Opportunity Calculator
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
            <a href="#how-it-works" className="hover:text-foreground">
              How it works
            </a>
            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>
          </nav>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() =>
              calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            Calculate
          </Button>
        </div>
      </header>

      <div className="print:hidden">
        <Hero
          onStart={() =>
            calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        />
      </div>

      <main className="mx-auto max-w-5xl space-y-14 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <section ref={calculatorRef} id="calculator" className="scroll-mt-24 print:hidden">
          <div className="mb-5 max-w-2xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Estimate Year-1 impact & multi-year compounding
            </h2>
            <p className="mt-2 text-muted-foreground">
              Tell us what you write today and your book mix. We'll size opportunity on every
              catalog line you do not offer — Medicare, ACA, life, annuity, and ancillary.
            </p>
            <p className="mt-2 text-xs font-medium text-muted-foreground">{PRIVACY_NOTE}</p>
          </div>
          <CalculatorWizard
            inputs={inputs}
            onChange={handleInputsChange}
            onCalculate={handleCalculate}
          />
        </section>

        {showResults && result && (
          <section
            ref={resultsRef}
            id="results"
            className="scroll-mt-24 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">Your results</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Change inputs or assumptions anytime — estimates recalculate live.
                  {result.usedCustomAssumptions && (
                    <span className="ml-1 font-medium text-accent">Custom assumptions on.</span>
                  )}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="size-4" />
                Start over
              </Button>
            </div>

            <div className="hidden print:block print:mb-4">
              <p className="font-display text-xl font-semibold">
                PSM Agent Opportunity Calculator — illustrative estimate
              </p>
              <p className="text-sm text-muted-foreground">
                Year-1 impact + multi-year compounding. Not a guarantee of income.
              </p>
            </div>

            <StateCallout state={inputs.state} />
            <ResultsCard result={result} />
            <CustomAssumptionsEditor
              value={inputs.customAssumptions}
              onChange={(customAssumptions) =>
                handleInputsChange({ ...inputs, customAssumptions })
              }
            />
            <BookPathChart result={result} />
            <ScenarioCompare result={result} />
            <MultiLineTable result={result} />
            <OpportunityBreakdown result={result} />
            <AgentPlaybook result={result} />
            <ShareActions inputs={inputs} result={result} />
            <div className="print:hidden">
              <AssumptionsPanel />
            </div>
            <LeadCaptureForm
              inputs={inputs}
              result={result}
              onSubmit={(lead) => setLeads((prev) => [...prev, lead])}
            />
            <span className="sr-only">{leads.length} lead submissions stored locally</span>
          </section>
        )}

        {!showResults && (
          <div className="print:hidden">
            <AssumptionsPanel />
          </div>
        )}

        <div className="print:hidden space-y-14">
          <SeoContent />
          <FaqSection />
        </div>
      </main>

      <div className="print:hidden">
        <DisclaimerFooter />
      </div>
    </div>
  );
}
