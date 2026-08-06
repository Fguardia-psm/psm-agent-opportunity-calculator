import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy | Agent Opportunity Calculator | PSM Brokerage" },
      {
        name: "description",
        content:
          "How PSM Brokerage handles agent contact information submitted through the Agent Opportunity Calculator. No consumer PHI. Practice-level estimates only.",
      },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-[calc(100dvh-var(--grok-banner-h,0px))] bg-bg text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Back to calculator
          </Link>
        </Button>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Privacy notice
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Agent Opportunity Calculator · Last updated August 2026
        </p>

        <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What this tool is for</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                The Agent Opportunity Calculator is a free, public planning tool for{" "}
                <span className="font-medium text-foreground">licensed insurance professionals</span>
                . It estimates illustrative Year-1 and multi-year opportunity on product lines you
                may not offer today.
              </p>
              <p>
                It is <span className="font-medium text-foreground">not</span> a consumer insurance
                application, quoting system, medical questionnaire, or book-of-business CRM.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What we ask you not to enter</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Do <span className="font-medium text-foreground">not</span> enter consumer names,
                dates of birth, SSNs, Medicare numbers, health conditions, diagnoses, medications,
                policy numbers, claim details, or any other private client or PHI data. Use{" "}
                <span className="font-medium text-foreground">approximate practice-level counts</span>{" "}
                only (for example, number of active households).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Information you may choose to share</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>If you request a portfolio review, you provide:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Name, work email, and mobile phone</li>
                <li>Licensed state and National Producer Number (NPN)</li>
                <li>Whether you are already contracted with PSM</li>
                <li>Confirmation that you are a licensed insurance professional</li>
                <li>Optional free-text about what you want help with</li>
                <li>
                  An illustrative calculator snapshot (practice counts, open lines, estimated
                  ranges) — not consumer files
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">How we use it</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Contact details and the estimate snapshot are used only to follow up about PSM
                contracting, appointments, training, and multi-line support for your agency. We do
                not use this form to sell consumer insurance policies to you as a customer.
              </p>
              <p>
                Save links in the URL encode practice inputs only so you can bookmark or share an
                estimate. Do not put private client data into those inputs.
              </p>
              <p>
                After a successful online submission, this browser may keep a{" "}
                <span className="font-medium text-foreground">non-identifying receipt</span> (submission
                id and time only). Email, phone, and NPN are{" "}
                <span className="font-medium text-foreground">not</span> stored in browser storage.
                Clear site data anytime to remove receipts.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Delivery and retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                When online delivery is configured, submissions may be sent to a PSM-controlled
                webhook and/or stored in a secured database for follow-up. When delivery is not
                configured, the form will not claim success and offers an email fallback you control.
              </p>
              <p>
                Retention follows PSM’s ordinary business and legal requirements for agency
                recruiting and contracting records. For deletion or access requests, contact PSM
                using the email on your follow-up correspondence or your existing PSM contact.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Third parties and security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Hosting, analytics, and CRM tools used by PSM may process submission data under PSM’s
                instruction. Do not submit consumer PHI through this form.
              </p>
              <p>
                Technical controls include server-side validation, professional consent required on
                the server, origin checks on the public form endpoint, and rate limiting (best-effort
                on serverless infrastructure). No control is perfect against determined abuse.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Questions about this notice: use the contact path on{" "}
                <a
                  href="https://www.psmbrokerage.com"
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                  rel="noreferrer"
                  target="_blank"
                >
                  psmbrokerage.com
                </a>{" "}
                or your PSM marketer.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
