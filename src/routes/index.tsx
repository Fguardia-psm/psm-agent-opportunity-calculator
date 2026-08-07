import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { calculateOpportunity, canCalculate } from "@/lib/calculator/calculate";
import { defaultInputs } from "@/lib/calculator/defaults";
import { productsFromPrimaryCategories } from "@/lib/calculator/assumptions";
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
import { ResultsJumpNav } from "@/components/calculator/ResultsJumpNav";
import { NextStepCta } from "@/components/calculator/NextStepCta";
import { Button } from "@/components/ui/button";
import { EmbedBreakout } from "@/components/calculator/EmbedBreakout";
import { PRIVACY_NOTE } from "@/lib/calculator/assumptions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Insurance Agent Opportunity Calculator | Year-1 and Compounding | PSM Brokerage",
      },
    ],
  }),
  component: Home,
});

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
      const synced = {
        ...decoded,
        productsOffered: productsFromPrimaryCategories(decoded.primaryCategories),
      };
      setInputs(synced);
      const calc = calculateOpportunity(synced);
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
    const synced = {
      ...inputs,
      productsOffered: productsFromPrimaryCategories(inputs.primaryCategories),
    };
    setInputs(synced);
    const next = calculateOpportunity(synced);
    if (!next) {
      toast.error("Complete all steps to see your estimate");
      return;
    }
    setResult(next);
    setShowResults(true);
    // Scroll to results section top (not mid-card) so sticky chrome doesn't hide the header
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
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
    const synced = {
      ...next,
      productsOffered: productsFromPrimaryCategories(next.primaryCategories),
    };
    setInputs(synced);
    if (showResults) {
      setResult(calculateOpportunity(synced));
    }
  };

  if (!restored) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center bg-bg text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        Loading calculator…
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-var(--grok-banner-h,0px))] bg-bg text-foreground">
      <JsonLd />

      <header className="sticky top-[var(--grok-banner-h,0px)] z-40 border-b border-border/80 bg-surface/95 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[11px] font-bold tracking-tight text-primary-foreground"
              aria-hidden
            >
              PSM
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-foreground">
                PSM Brokerage
              </p>
              <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
                Agent Opportunity Calculator
              </p>
            </div>
          </div>
          <nav
            className="hidden items-center gap-4 text-sm text-muted-foreground md:flex"
            aria-label="Page"
          >
            <a href="#how-it-works" className="hover:text-foreground">
              How it works
            </a>
            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>
            {showResults && (
              <a href="#results" className="font-medium text-primary hover:text-primary/80">
                Results
              </a>
            )}
          </nav>
          <Button
            size="sm"
            variant="outline"
            className="min-h-10 shrink-0 px-3.5 sm:min-h-9"
            onClick={() =>
              calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            Calculate
          </Button>
        </div>
      </header>

      <EmbedBreakout />

      {showResults && result && <ResultsJumpNav />}

      <div className="print:hidden">
        <Hero
          onStart={() =>
            calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        />
      </div>

      <main className="mx-auto max-w-5xl space-y-10 px-3 py-8 sm:space-y-14 sm:px-6 sm:py-14 lg:px-8">
        <section ref={calculatorRef} id="calculator" className="scroll-offset print:hidden">
          <div className="mb-4 max-w-2xl sm:mb-5">
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Estimate Year-1 impact and multi-year compounding
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Tell us your primary markets and book mix. We treat those markets as covered and size
              opportunity on Medicare, ACA, life, and ancillary lines outside them.
            </p>
            <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground">
              {PRIVACY_NOTE}
            </p>
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
            className="scroll-offset-deep space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:space-y-6"
            aria-label="Your opportunity results"
          >
            <div className="flex flex-col gap-2 print:hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                    Your results
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Estimates recalculate live when you change inputs.
                    {result.usedCustomAssumptions && (
                      <span className="ml-1 font-medium text-accent">Custom assumptions on.</span>
                    )}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="min-h-10 shrink-0 px-3"
                >
                  <RefreshCw className="size-3.5" />
                  <span className="hidden min-[360px]:inline">Start over</span>
                  <span className="min-[360px]:hidden">Reset</span>
                </Button>
              </div>
            </div>

            <div className="hidden print:block print:mb-4">
              <p className="font-display text-xl font-semibold">
                PSM Agent Opportunity Calculator — illustrative estimate
              </p>
              <p className="text-sm text-muted-foreground">
                Year-1 impact and multi-year compounding. Not a guarantee of income.
              </p>
            </div>

            <StateCallout state={inputs.state} />
            <ResultsCard result={result} />
            <NextStepCta result={result} />
            <CustomAssumptionsEditor
              value={inputs.customAssumptions}
              onChange={(customAssumptions) =>
                handleInputsChange({ ...inputs, customAssumptions })
              }
            />
            <div id="path" className="scroll-offset-deep">
              <BookPathChart result={result} />
            </div>
            <div id="scenarios" className="scroll-offset-deep">
              <ScenarioCompare result={result} />
            </div>
            <div id="stack" className="scroll-offset-deep">
              <MultiLineTable result={result} />
            </div>
            <OpportunityBreakdown result={result} />
            <div id="playbook" className="scroll-offset-deep">
              <AgentPlaybook result={result} />
            </div>
            <div id="share" className="scroll-offset-deep">
              <ShareActions inputs={inputs} result={result} />
            </div>
            <NextStepCta result={result} />
            <div className="print:hidden">
              <AssumptionsPanel />
            </div>
            <LeadCaptureForm
              inputs={inputs}
              result={result}
              onSubmit={(lead) => setLeads((prev) => [...prev, lead])}
            />
            <span className="sr-only" aria-live="polite">
              {leads.length > 0
                ? `${leads.length} portfolio review request${leads.length === 1 ? "" : "s"} submitted this session`
                : ""}
            </span>
          </section>
        )}

        {!showResults && (
          <div className="print:hidden">
            <AssumptionsPanel />
          </div>
        )}

        <div className="print:hidden space-y-10 sm:space-y-14">
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
