import { ClipboardList, MessageSquareText } from "lucide-react";
import type { CalculationResult } from "@/lib/calculator/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AgentPlaybookProps {
  result: CalculationResult;
}

const REVIEW_QUESTIONS = [
  "What coverage do you have today for health, Medicare, life, retirement income, or gaps like hospital and dental — and what feels incomplete?",
  "Has anything changed with work, income, retirement timing, doctors, prescriptions, or family responsibilities since we last talked?",
  "If something unexpected happened this year, which expenses would be hardest for your household to absorb?",
  "Would you like me to check options outside what we already have in force — only if they fit your situation?",
  "When should we reconnect for a full annual review of your household protection and income plan?",
];

const CHECKLIST = [
  "Confirm line of authority / licensing for each new category in your state (including annuity suitability where required)",
  "Verify carrier appointments and product availability before presenting",
  "Complete product training and know eligibility / underwriting / suitability basics",
  "Add cross-line prompts to your review script (see questions)",
  "Pilot on a defined slice of your book — never blast unsuitable offers",
  "Document suitability and client decisions per your compliance process",
];

export function AgentPlaybook({ result }: AgentPlaybookProps) {
  const focusLines = result.topOpportunities.map((p) => p.label);

  return (
    <div className="grid gap-5 lg:grid-cols-2 print:break-inside-avoid">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquareText className="size-5 text-accent" />
            Review questions you own
          </CardTitle>
          <CardDescription>
            Agent-led prompts for any primary market — not scripts to force a sale.
            {focusLines.length > 0 && (
              <>
                {" "}
                Given your gap, listen for needs related to{" "}
                <span className="font-medium text-foreground">{focusLines.join(", ")}</span>.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {REVIEW_QUESTIONS.map((q, i) => (
              <li key={q} className="flex gap-3 text-sm leading-relaxed">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-foreground">{q}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="size-5 text-accent" />
            This-week action checklist
          </CardTitle>
          <CardDescription>
            Practical steps for an independent agent — you control the sequence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
