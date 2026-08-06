import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Calculator } from "lucide-react";
import {
  ACTIVE_CLIENT_PRESETS,
  HORIZON_OPTIONS,
  MAX_CLIENT_COUNT,
  NEW_CLIENT_PRESETS,
  PRIMARY_CATEGORY_OPTIONS,
  productsFromPrimaryCategories,
  REVIEW_FREQUENCY_OPTIONS,
  US_STATES,
  WIZARD_STEPS,
} from "@/lib/calculator/assumptions";
import { canCalculate, parseClientCount, parsePercent } from "@/lib/calculator/calculate";
import type { CalculatorInputs, HorizonYears, ProductCategory } from "@/lib/calculator/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface CalculatorWizardProps {
  inputs: CalculatorInputs;
  onChange: (next: CalculatorInputs) => void;
  onCalculate: () => void;
}

function stepValid(step: number, inputs: CalculatorInputs): boolean {
  switch (step) {
    case 0:
      return Boolean(inputs.state && inputs.primaryCategories.length > 0);
    case 1:
      return (
        parseClientCount(inputs.activeClients) !== null &&
        parseClientCount(inputs.newClientsPerYear) !== null &&
        parsePercent(inputs.medicareSharePercent) !== null &&
        parsePercent(inputs.under65SharePercent) !== null
      );
    case 2:
      return Boolean(inputs.reviewFrequency && inputs.horizonYears);
    default:
      return false;
  }
}

function sanitizeCountInput(raw: string): string {
  return raw.replace(/[^\d,]/g, "");
}

function sanitizePercentInput(raw: string): string {
  return raw.replace(/[^\d.]/g, "");
}

function formatComplementPercent(raw: string): string | null {
  const n = parsePercent(raw);
  if (n === null) return null;
  const complement = Math.round((100 - n) * 100) / 100;
  if (Number.isInteger(complement)) return String(complement);
  return String(complement);
}

function clientFieldError(raw: string, show: boolean): string | null {
  if (!show && raw.trim() === "") return null;
  if (raw.trim() === "") return "Enter a number (0 or more).";
  const n = parseClientCount(raw);
  if (n === null) {
    const asNum = Number(raw.replace(/[,\s]/g, ""));
    if (Number.isFinite(asNum) && asNum > MAX_CLIENT_COUNT) {
      return `Enter a number up to ${MAX_CLIENT_COUNT.toLocaleString()}.`;
    }
    return "Enter a whole number (digits only).";
  }
  return null;
}

function percentFieldError(raw: string, show: boolean): string | null {
  if (!show && raw.trim() === "") return null;
  if (raw.trim() === "") return "Enter 0–100.";
  if (parsePercent(raw) === null) return "Enter a number from 0 to 100.";
  return null;
}

export function CalculatorWizard({ inputs, onChange, onCalculate }: CalculatorWizardProps) {
  const [step, setStep] = useState(0);
  const [attempted, setAttempted] = useState(false);

  const progress = ((step + 1) / WIZARD_STEPS.length) * 100;
  const current = WIZARD_STEPS[step];
  const valid = stepValid(step, inputs);
  const ready = useMemo(() => canCalculate(inputs), [inputs]);

  const activeError = clientFieldError(inputs.activeClients, attempted && step === 1);
  const newError = clientFieldError(inputs.newClientsPerYear, attempted && step === 1);
  const medError = percentFieldError(inputs.medicareSharePercent, attempted && step === 1);
  const u65Error = percentFieldError(inputs.under65SharePercent, attempted && step === 1);

  const medShare = parsePercent(inputs.medicareSharePercent);
  const u65Share = parsePercent(inputs.under65SharePercent);
  const shareSum =
    medShare !== null && u65Share !== null
      ? Math.round((medShare + u65Share) * 100) / 100
      : null;

  const toggleCategory = (cat: ProductCategory) => {
    const has = inputs.primaryCategories.includes(cat);
    const primaryCategories = has
      ? inputs.primaryCategories.filter((c) => c !== cat)
      : [...inputs.primaryCategories, cat];
    onChange({
      ...inputs,
      primaryCategories,
      productsOffered: productsFromPrimaryCategories(primaryCategories),
    });
  };

  const setMedicareShare = (raw: string) => {
    const cleaned = sanitizePercentInput(raw);
    const complement = formatComplementPercent(cleaned);
    onChange({
      ...inputs,
      medicareSharePercent: cleaned,
      ...(complement !== null ? { under65SharePercent: complement } : {}),
    });
  };

  const setUnder65Share = (raw: string) => {
    const cleaned = sanitizePercentInput(raw);
    const complement = formatComplementPercent(cleaned);
    onChange({
      ...inputs,
      under65SharePercent: cleaned,
      ...(complement !== null ? { medicareSharePercent: complement } : {}),
    });
  };

  const goNext = () => {
    if (!valid) {
      setAttempted(true);
      return;
    }
    setAttempted(false);
    if (step < WIZARD_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else if (ready) {
      onCalculate();
    } else {
      setAttempted(true);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/80 bg-muted/30 px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Step {step + 1} of {WIZARD_STEPS.length}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">{Math.round(progress)}%</p>
        </div>
        <Progress value={progress} className="mb-4 h-1.5" />
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {WIZARD_STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (i <= step || valid) {
                  setStep(i);
                  setAttempted(false);
                }
              }}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:min-h-9",
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              <span className="sm:hidden">{i + 1}. </span>
              {s.title}
            </button>
          ))}
        </div>
        <CardTitle className="text-lg sm:text-xl">{current.title}</CardTitle>
        <CardDescription className="text-sm">{current.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-4 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
        {step === 0 && (
          <div className="space-y-5">
            <div className="space-y-2 sm:max-w-md">
              <Label htmlFor="state">State you primarily write in</Label>
              <Select
                value={inputs.state || undefined}
                onValueChange={(v) => onChange({ ...inputs, state: v as CalculatorInputs["state"] })}
              >
                <SelectTrigger id="state" className="h-12" aria-invalid={attempted && !inputs.state}>
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {attempted && !inputs.state && (
                <p className="text-xs text-danger">Please select a state.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>What do you primarily write today? (select all that apply)</Label>
              <p className="text-xs leading-relaxed text-muted-foreground">
                We treat those markets as covered. Opportunity is everything else in the catalog
                (Medicare, ACA, life, and ancillary). Annuity is a primary focus only — it does not
                appear as a dollar opportunity in results.
              </p>
              <div className="grid gap-2">
                {PRIMARY_CATEGORY_OPTIONS.map((opt) => {
                  const on = inputs.primaryCategories.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleCategory(opt.value)}
                      className={cn(
                        "flex min-h-14 flex-col items-start justify-center rounded-xl border px-3.5 py-3 text-left transition-colors sm:min-h-12 sm:py-2.5",
                        on
                          ? "border-primary/40 bg-primary/[0.04]"
                          : "border-border hover:bg-muted/40",
                      )}
                    >
                      <span className="text-sm font-semibold">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.hint}</span>
                    </button>
                  );
                })}
              </div>
              {attempted && inputs.primaryCategories.length === 0 && (
                <p className="text-xs text-danger">Select at least one focus area.</p>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <p className="rounded-xl border border-border bg-muted/30 px-3.5 py-3 text-sm leading-relaxed text-muted-foreground sm:px-4">
              Use real practice numbers. Eligibility percentages split your book into Medicare-age
              and under-65 segments. The two percentages always total 100%.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="activeClients">Active clients / households</Label>
                <Input
                  id="activeClients"
                  inputMode="numeric"
                  placeholder="e.g. 200"
                  value={inputs.activeClients}
                  onChange={(e) =>
                    onChange({ ...inputs, activeClients: sanitizeCountInput(e.target.value) })
                  }
                  aria-invalid={Boolean(activeError)}
                  className="h-12 text-base tabular-nums"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {ACTIVE_CLIENT_PRESETS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onChange({ ...inputs, activeClients: String(n) })}
                      className={cn(
                        "inline-flex min-h-10 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        parseClientCount(inputs.activeClients) === n
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted/50",
                      )}
                    >
                      {n.toLocaleString()}
                    </button>
                  ))}
                </div>
                {activeError && <p className="text-xs text-danger">{activeError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newClientsPerYear">New clients / year</Label>
                <Input
                  id="newClientsPerYear"
                  inputMode="numeric"
                  placeholder="e.g. 40"
                  value={inputs.newClientsPerYear}
                  onChange={(e) =>
                    onChange({ ...inputs, newClientsPerYear: sanitizeCountInput(e.target.value) })
                  }
                  aria-invalid={Boolean(newError)}
                  className="h-12 text-base tabular-nums"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {NEW_CLIENT_PRESETS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onChange({ ...inputs, newClientsPerYear: String(n) })}
                      className={cn(
                        "inline-flex min-h-10 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        parseClientCount(inputs.newClientsPerYear) === n
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted/50",
                      )}
                    >
                      {n.toLocaleString()}
                    </button>
                  ))}
                </div>
                {newError && <p className="text-xs text-danger">{newError}</p>}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="medicareSharePercent">Medicare-age share of book (%)</Label>
                <Input
                  id="medicareSharePercent"
                  inputMode="decimal"
                  placeholder="e.g. 60"
                  value={inputs.medicareSharePercent}
                  onChange={(e) => setMedicareShare(e.target.value)}
                  aria-invalid={Boolean(medError)}
                  className="h-12 text-base tabular-nums"
                />
                {medError && <p className="text-xs text-danger">{medError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="under65SharePercent">Under-65 share of book (%)</Label>
                <Input
                  id="under65SharePercent"
                  inputMode="decimal"
                  placeholder="e.g. 40"
                  value={inputs.under65SharePercent}
                  onChange={(e) => setUnder65Share(e.target.value)}
                  aria-invalid={Boolean(u65Error)}
                  className="h-12 text-base tabular-nums"
                />
                {u65Error && <p className="text-xs text-danger">{u65Error}</p>}
              </div>
            </div>
            {shareSum !== null && shareSum !== 100 && (
              <p className="text-xs text-danger">
                Shares currently total {shareSum}%. They should total 100% (auto-adjusts when you
                edit one field).
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>How often do you review existing clients for additional coverage?</Label>
              <RadioGroup
                value={inputs.reviewFrequency || undefined}
                onValueChange={(v) =>
                  onChange({
                    ...inputs,
                    reviewFrequency: v as CalculatorInputs["reviewFrequency"],
                  })
                }
                className="grid gap-2"
              >
                {REVIEW_FREQUENCY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors",
                      inputs.reviewFrequency === opt.value
                        ? "border-primary/40 bg-primary/[0.04]"
                        : "border-border hover:bg-muted/40",
                    )}
                  >
                    <RadioGroupItem value={opt.value} />
                    <span className="text-sm font-medium leading-snug">{opt.label}</span>
                  </label>
                ))}
              </RadioGroup>
              {attempted && !inputs.reviewFrequency && (
                <p className="text-xs text-danger">Please select a review frequency.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Compounding horizon</Label>
              <p className="text-xs text-muted-foreground">
                How far to project residual renewals and trails. Choose 3 years for a near-term plan
                or 5 years for a fuller path.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {HORIZON_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onChange({ ...inputs, horizonYears: opt.value as HorizonYears })
                    }
                    className={cn(
                      "min-h-14 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                      inputs.horizonYears === opt.value
                        ? "border-primary/40 bg-primary/[0.04] text-primary"
                        : "border-border hover:bg-muted/40",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mobile-sticky-actions flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:border-t sm:border-border/80 sm:pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setAttempted(false);
              setStep((s) => Math.max(0, s - 1));
            }}
            disabled={step === 0}
            className="min-h-12 w-full sm:min-h-11 sm:w-auto"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          {step < WIZARD_STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={goNext}
              className="min-h-12 w-full text-base sm:min-h-11 sm:w-auto sm:text-sm"
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="accent"
              size="lg"
              onClick={goNext}
              className="min-h-12 w-full text-base sm:w-auto"
            >
              <Calculator className="size-4" />
              Show My Opportunity
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
