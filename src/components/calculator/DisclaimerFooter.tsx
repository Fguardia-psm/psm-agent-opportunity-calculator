import { Link } from "@tanstack/react-router";
import { DISCLAIMER_TEXT, PRIVACY_NOTE } from "@/lib/calculator/assumptions";

export function DisclaimerFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="font-display text-sm font-semibold text-foreground">PSM Brokerage</p>
          <p className="text-xs text-muted-foreground">
            Agent Opportunity Calculator · For licensed insurance professionals
          </p>
        </div>
        <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{DISCLAIMER_TEXT}</p>
        <p className="text-xs font-medium text-muted-foreground">{PRIVACY_NOTE}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <a href="#calculator" className="hover:text-foreground">
            Calculator
          </a>
          <a href="#how-it-works" className="hover:text-foreground">
            How it works
          </a>
          <a href="#faq" className="hover:text-foreground">
            FAQ
          </a>
          <a href="#lead-form" className="hover:text-foreground">
            Contact PSM
          </a>
          <Link to="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link to="/disclaimer" className="hover:text-foreground">
            Disclaimer
          </Link>
        </nav>
        <p className="text-[11px] text-muted-foreground/80">
          © {new Date().getFullYear()} PSM Brokerage. Illustrative tool only — not an offer of
          insurance or guarantee of compensation.
        </p>
      </div>
    </footer>
  );
}
