import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { US_STATES } from "@/lib/calculator/assumptions";
import type {
  CalculationResult,
  CalculatorInputs,
  LeadSubmission,
  USStateCode,
} from "@/lib/calculator/types";
import { formatCurrency } from "@/lib/utils";
import { leadFallbackMailto, submitLead } from "@/lib/leads/submit";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  website: string;
  consent: boolean;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
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
    website: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "consent", string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fallbackMailto, setFallbackMailto] = useState<string | null>(null);

  const set =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState | "consent", string>> = {};
    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (!form.lastName.trim()) next.lastName = "Last name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!isValidEmail(form.email.trim())) next.email = "Enter a valid email";
    if (!form.phone.trim()) next.phone = "Phone is required";
    else if (!isValidPhone(form.phone)) next.phone = "Enter a valid 10+ digit phone number";
    if (!form.state) next.state = "State is required";
    if (!form.contractedWithPsm) next.contractedWithPsm = "Please select an option";
    if (!form.consent) next.consent = "Please confirm you are an insurance professional";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildLead = (): LeadSubmission => ({
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
          helpInterest: inputs.helpInterest || "",
          year1ImpactTotal: result.year1ImpactTotal,
          pathCumulativeTotal: result.pathCumulativeTotal,
          portfolioScore: result.portfolioScore,
          usedCustomAssumptions: result.usedCustomAssumptions,
        }
      : undefined,
    submittedAt: new Date().toISOString(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFallbackMailto(null);
    if (!validate()) return;

    const lead = buildLead();
    setSubmitting(true);

    try {
      const res = await submitLead({
        data: {
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          state: lead.state as string,
          npn: lead.npn,
          contractedWithPsm: lead.contractedWithPsm as "yes" | "no" | "not-sure",
          message: lead.message,
          website: form.website,
          calculatorSnapshot: lead.calculatorSnapshot
            ? {
                activeClients: lead.calculatorSnapshot.activeClients,
                newClientsPerYear: lead.calculatorSnapshot.newClientsPerYear,
                horizonYears: lead.calculatorSnapshot.horizonYears as 3 | 5,
                primaryCategories: lead.calculatorSnapshot.primaryCategories,
                state: lead.calculatorSnapshot.state,
                productsOffered: lead.calculatorSnapshot.productsOffered,
                missingProducts: lead.calculatorSnapshot.missingProducts,
                reviewFrequency: lead.calculatorSnapshot.reviewFrequency,
                year1ImpactTotal: lead.calculatorSnapshot.year1ImpactTotal,
                pathCumulativeTotal: lead.calculatorSnapshot.pathCumulativeTotal,
                portfolioScore: lead.calculatorSnapshot.portfolioScore,
                usedCustomAssumptions: lead.calculatorSnapshot.usedCustomAssumptions,
              }
            : undefined,
        },
      });

      if (res.ok) {
        try {
          const key = "psm-opportunity-leads";
          const existing = JSON.parse(localStorage.getItem(key) || "[]") as LeadSubmission[];
          existing.push(lead);
          localStorage.setItem(key, JSON.stringify(existing.slice(-20)));
        } catch {
          /* ignore quota */
        }
        onSubmit(lead);
        setSubmitted(true);
        toast.success("Request delivered to PSM");
        return;
      }

      setServerError(res.message);
      const mailto = leadFallbackMailto({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        state: lead.state || "",
        message: lead.message,
        summary: result
          ? `Year-1 planning: ${formatCurrency(result.year1ImpactTotal.moderate)}; ${result.horizonYears}-year path: ${formatCurrency(result.pathCumulativeTotal.moderate)}`
          : undefined,
      });
      setFallbackMailto(mailto);
      toast.error("Online delivery unavailable — use email fallback");
    } catch {
      setServerError(
        "We could not reach the server. Use the email fallback so a PSM teammate still gets your request.",
      );
      setFallbackMailto(
        leadFallbackMailto({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          state: form.state || "",
          message: form.message.trim(),
        }),
      );
      toast.error("Could not submit online");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-accent/25 bg-accent/[0.04] print:hidden">
        <CardContent className="flex flex-col items-center gap-3 px-4 py-10 text-center sm:px-6">
          <CheckCircle2 className="size-10 text-accent" strokeWidth={1.75} />
          <h3 className="font-display text-xl font-semibold text-foreground">
            Request received — a PSM teammate will follow up
          </h3>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Bring your estimate (or the save link above). We will focus on the open lines that
            matter for your practice, not a generic pitch.
          </p>
        </CardContent>
      </Card>
    );
  }

  const y1 = result ? formatCurrency(result.year1ImpactTotal.moderate) : null;
  const path = result ? formatCurrency(result.pathCumulativeTotal.moderate) : null;
  const top = result?.topOpportunities.slice(0, 3).map((p) => p.label) ?? [];

  return (
    <Card id="lead-form" className="scroll-offset-deep print:hidden border-primary/15">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-xl leading-snug sm:text-2xl">
          Request a portfolio review with PSM
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {result && !result.hasFullPortfolio && y1 && path ? (
            <>
              You have seen the math — about {y1} Year-1 planning impact and about {path} over{" "}
              {result.horizonYears} years on open lines
              {top.length > 0 ? ` (${top.join(", ")})` : ""}. Tell us how to reach you. No
              obligation to contract.
            </>
          ) : (
            <>
              Independent agents use PSM for appointments, training, and multi-line support. Share
              how to reach you — no obligation to contract.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => set("website")(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => set("firstName")(e.target.value)}
                autoComplete="given-name"
                maxLength={80}
                className="h-12 text-base"
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
                maxLength={80}
                className="h-12 text-base"
              />
              {errors.lastName && <p className="text-xs text-danger">{errors.lastName}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email")(e.target.value)}
                autoComplete="email"
                maxLength={200}
                className="h-12 text-base"
              />
              {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Mobile phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone")(e.target.value)}
                autoComplete="tel"
                maxLength={30}
                className="h-12 text-base"
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
                <SelectTrigger id="lead-state" className="h-12">
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
                maxLength={20}
                className="h-12 text-base"
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
              className="grid grid-cols-1 gap-2"
            >
              {(
                [
                  ["yes", "Yes — already with PSM"],
                  ["no", "No — not yet"],
                  ["not-sure", "Not sure"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-3 py-3 text-center text-sm font-medium transition-colors",
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
              What should we focus on?{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="message"
              value={form.message}
              onChange={(e) => set("message")(e.target.value)}
              placeholder="Example: Medicare add-ons, ACA training, life residual path…"
              rows={3}
              maxLength={2000}
              className="min-h-[5.5rem] text-base"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/20 px-3.5 py-3.5">
            <Checkbox
              checked={form.consent}
              onCheckedChange={(v) => set("consent")(v === true)}
              className="mt-0.5 size-5"
              id="agent-consent"
            />
            <span className="text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
              I am a licensed insurance professional (or agency principal). PSM may contact me about
              contracting and multi-line support using the details above. I will not submit consumer
              PHI or private client data. See{" "}
              <Link
                to="/privacy"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                Privacy
              </Link>
              .
            </span>
          </label>
          {errors.consent && <p className="text-xs text-danger">{errors.consent}</p>}

          {serverError && (
            <div className="rounded-xl border border-danger/30 bg-danger/5 px-3.5 py-3 text-sm text-foreground">
              <p className="font-medium text-danger">Submission not delivered online</p>
              <p className="mt-1 text-xs text-muted-foreground">{serverError}</p>
              {fallbackMailto && (
                <Button asChild type="button" variant="outline" size="sm" className="mt-3 min-h-11">
                  <a href={fallbackMailto}>
                    <Mail className="size-3.5" />
                    Email my request to PSM
                  </a>
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-1">
            <Button
              type="submit"
              size="lg"
              className="min-h-12 w-full text-base sm:w-auto"
              disabled={submitting}
            >
              <Send className="size-4" />
              {submitting ? "Sending…" : "Request my portfolio review"}
            </Button>
            <p className="text-xs leading-relaxed text-muted-foreground">
              We use this to follow up on your estimate — not to sell consumer policies to you.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
