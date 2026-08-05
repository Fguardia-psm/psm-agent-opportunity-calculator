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
      <CardHeader className="border-b border-border/80 bg-muted/30">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Step {step + 1} of {WIZARD_STEPS.length}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">{Math.round(progress)}%</p>
        </div>
        <Progress value={progress} className="mb-4 h-1.5" />
        <div className="mb-1 flex flex-wrap gap-1.5">
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
                "min-h-8 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {s.title}
            </button>
          ))}
        </div>
        <CardTitle className="text-xl">{current.title}</CardTitle>
        <CardDescription>{current.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {step === 0 && (
          <div className="space-y-5">
            <div className="space-y-2 sm:max-w-md">
              <Label htmlFor="state">State you primarily write in</Label>
              <Select
                value={inputs.state || undefined}
                onValueChange={(v) => onChange({ ...inputs, state: v as CalculatorInputs["state"] })}
              >
                <SelectTrigger id="state" aria-invalid={attempted && !inputs.state}>
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
              <p className="text-xs text-muted-foreground">
                We treat those markets as covered. Opportunity is everything else in the catalog
                (Medicare, ACA, life, and ancillary). Annuity is a primary focus only — it does not
                appear as a dollar opportunity in results.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {PRIMARY_CATEGORY_OPTIONS.map((opt) => {
                  const on = inputs.primaryCategories.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleCategory(opt.value)}
                      className={cn(
                        "flex min-h-12 flex-col items-start rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                        on
                          ? "border-primary/40 bg-primary/[0.04]"
                          : "border-border hover:bg-muted/40",
                      )}
                    >
                      <span className="text-sm font-medium">{opt.label}</span>
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
            <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Use real practice numbers. Eligibility percentages split your book into Medicare-age
              and under-65 segments so Medicare lines and ACA size to the right pool. The two
              percentages always total 100%.
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
                        "min-h-8 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
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
                <Label htmlFor="newClientsPerYear">New clients / households per year</Label>
                <Input
                  id="newClientsPerYear"
                  inputMode="numeric"
                  placeholder="e.g. 50"
                  value={inputs.newClientsPerYear}
                  onChange={(e) =>
                    onChange({
                      ...inputs,
                      newClientsPerYear: sanitizeCountInput(e.target.value),
                    })
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
                        "min-h-8 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
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

              <div className="space-y-2">
                <Label htmlFor="medicareShare">% of book Medicare-age / Medicare-eligible</Label>
                <Input
                  id="medicareShare"
                  inputMode="decimal"
                  placeholder="e.g. 40"
                  value={inputs.medicareSharePercent}
                  onChange={(e) => setMedicareShare(e.target.value)}
                  className="h-12 text-base tabular-nums"
                />
                <p className="text-[11px] text-muted-foreground">
                  Used for MA, Med Supp, and PDP opportunity sizing. Under-65 adjusts so both total
                  100%.
                </p>
                {medError && <p className="text-xs text-danger">{medError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="under65Share">% of book under 65 / marketplace-eligible</Label>
                <Input
                  id="under65Share"
                  inputMode="decimal"
                  placeholder="e.g. 60"
                  value={inputs.under65SharePercent}
                  onChange={(e) => setUnder65Share(e.target.value)}
                  className="h-12 text-base tabular-nums"
                />
                <p className="text-[11px] text-muted-foreground">
                  Used for ACA / Marketplace opportunity sizing. Medicare-age adjusts so both total
                  100%.
                </p>
                {u65Error && <p className="text-xs text-danger">{u65Error}</p>}
              </div>
            </div>

            {shareSum !== null && (
              <p
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs tabular-nums",
                  shareSum === 100
                    ? "border-border bg-muted/30 text-muted-foreground"
                    : "border-danger/30 bg-danger/5 text-danger",
                )}
              >
                Book split: Medicare-age {medShare}% + under 65 {u65Share}% = {shareSum}%
                {shareSum === 100 ? " (balanced)" : " — enter a value 0–100 to rebalance"}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>How often do you review additional product needs with existing clients?</Label>
              <p className="text-xs text-muted-foreground">
                Shapes your playbook — not a sales pitch. Agents who review more often usually
                attach more lines over time.
              </p>
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
                      "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors",
                      inputs.reviewFrequency === opt.value
                        ? "border-primary/40 bg-primary/[0.04]"
                        : "border-border hover:bg-muted/40",
                    )}
                  >
                    <RadioGroupItem value={opt.value} />
                    <span className="text-sm font-medium">{opt.label}</span>
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
                How far to project residual renewals and trails on top of new production. Choose 3
                years for a near-term plan or 5 years for a fuller path.
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
                      "min-h-14 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
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

        <div className="flex flex-col-reverse gap-3 border-t border-border/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setAttempted(false);
              setStep((s) => Math.max(0, s - 1));
            }}
            disabled={step === 0}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          {step < WIZARD_STEPS.length - 1 ? (
            <Button type="button" onClick={goNext} className="w-full sm:w-auto">
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="accent"
              size="lg"
              onClick={goNext}
              className="w-full sm:w-auto"
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
