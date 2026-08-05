import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { US_STATES } from "@/lib/calculator/assumptions";
import type {
  CalculationResult,
  CalculatorInputs,
  LeadSubmission,
  USStateCode,
} from "@/lib/calculator/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface LeadCaptureFormProps {
  inputs: CalculatorInputs;
  result: CalculationResult | null;
  onSubmit: (lead: LeadSubmission) => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: USStateCode | "";
  npn: string;
  contractedWithPsm: "yes" | "no" | "not-sure" | "";
  message: string;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LeadCaptureForm({ inputs, result, onSubmit }: LeadCaptureFormProps) {
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    state: inputs.state || "",
    npn: "",
    contractedWithPsm: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const set =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (!form.lastName.trim()) next.lastName = "Last name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!isValidEmail(form.email.trim())) next.email = "Enter a valid email";
    if (!form.phone.trim()) next.phone = "Phone is required";
    if (!form.state) next.state = "State is required";
    if (!form.contractedWithPsm) next.contractedWithPsm = "Please select an option";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const lead: LeadSubmission = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      state: form.state,
      npn: form.npn.trim(),
      contractedWithPsm: form.contractedWithPsm,
      message: form.message.trim(),
      calculatorSnapshot: result
        ? {
            activeClients: result.activeClients,
            newClientsPerYear: result.newClientsPerYear,
            horizonYears: result.horizonYears,
            primaryCategories: inputs.primaryCategories,
            state: form.state,
            productsOffered: inputs.productsOffered,
            missingProducts: result.missingProducts,
            reviewFrequency: inputs.reviewFrequency,
            helpInterest: inputs.helpInterest,
            year1ImpactTotal: result.year1ImpactTotal,
            pathCumulativeTotal: result.pathCumulativeTotal,
            portfolioScore: result.portfolioScore,
            usedCustomAssumptions: result.usedCustomAssumptions,
          }
        : undefined,
      submittedAt: new Date().toISOString(),
    };

    try {
      const key = "psm-opportunity-leads";
      const existing = JSON.parse(localStorage.getItem(key) || "[]") as LeadSubmission[];
      existing.push(lead);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {
      /* ignore */
    }

    onSubmit(lead);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="border-accent/25 bg-accent/[0.04] print:hidden">
        <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <CheckCircle2 className="size-10 text-accent" strokeWidth={1.75} />
          <h3 className="font-display text-xl font-semibold text-foreground">
            Thank you — we received your request
          </h3>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            A PSM team member can help with contracting, training, and adding lines outside your
            current toolkit.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="lead-form" className="scroll-offset-deep print:hidden">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Want help from PSM?</CardTitle>
        <CardDescription>
          Optional. You already have save link, print, and email-yourself above. Use this if you
          want a marketer follow-up on contracting or product mix.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => set("firstName")(e.target.value)}
                autoComplete="given-name"
              />
              {errors.firstName && <p className="text-xs text-danger">{errors.firstName}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => set("lastName")(e.target.value)}
                autoComplete="family-name"
              />
              {errors.lastName && <p className="text-xs text-danger">{errors.lastName}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email")(e.target.value)}
                autoComplete="email"
              />
              {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone")(e.target.value)}
                autoComplete="tel"
              />
              {errors.phone && <p className="text-xs text-danger">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lead-state">State</Label>
              <Select
                value={form.state || undefined}
                onValueChange={(v) => set("state")(v as USStateCode)}
              >
                <SelectTrigger id="lead-state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && <p className="text-xs text-danger">{errors.state}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="npn">
                NPN <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="npn"
                value={form.npn}
                onChange={(e) => set("npn")(e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Are you currently contracted with PSM?</Label>
            <RadioGroup
              value={form.contractedWithPsm || undefined}
              onValueChange={(v) =>
                set("contractedWithPsm")(v as FormState["contractedWithPsm"])
              }
              className="grid grid-cols-1 gap-2 sm:grid-cols-3"
            >
              {(
                [
                  ["yes", "Yes"],
                  ["no", "No"],
                  ["not-sure", "Not sure"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-2 py-2 text-sm font-medium transition-colors",
                    form.contractedWithPsm === value
                      ? "border-primary/40 bg-primary/[0.04]"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <RadioGroupItem value={value} className="sr-only" />
                  {label}
                </label>
              ))}
            </RadioGroup>
            {errors.contractedWithPsm && (
              <p className="text-xs text-danger">{errors.contractedWithPsm}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">
              Message <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="message"
              value={form.message}
              onChange={(e) => set("message")(e.target.value)}
              placeholder="Lines you are considering, training needs, market questions…"
              rows={3}
            />
          </div>

          <Button type="submit" size="lg" className="w-full sm:w-auto">
            <Send className="size-4" />
            Request a portfolio review
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
