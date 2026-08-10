import { Link } from "@tanstack/react-router";
import { DISCLAIMER_TEXT, PRIVACY_NOTE } from "@/lib/calculator/assumptions";

export function DisclaimerFooter() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <a
              href="https://www.psmbrokerage.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img
                src="/psm-logo.png"
                alt="PSM Brokerage"
                className="h-8 w-auto sm:h-9"
                width={160}
                height={52}
              />
            </a>
            <p className="text-xs text-muted-foreground">
              Agent Opportunity Calculator · For licensed insurance professionals
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              11940 Jollyville Rd #200 South
              <br />
              Austin, TX 78759
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-brand-sage-deep">
            <a
              href="https://www.psmbrokerage.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              psmbrokerage.com
            </a>
            <a href="#calculator" className="hover:underline">
              Calculator
            </a>
            <a href="#how-it-works" className="hover:underline">
              How it works
            </a>
            <a href="#faq" className="hover:underline">
              FAQ
            </a>
            <a href="#lead-form" className="hover:underline">
              Contact PSM
            </a>
            <Link to="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link to="/disclaimer" className="hover:underline">
              Disclaimer
            </Link>
          </nav>
        </div>
        <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{DISCLAIMER_TEXT}</p>
        <p className="text-xs font-medium text-muted-foreground">{PRIVACY_NOTE}</p>
        <p className="text-[11px] text-muted-foreground/80">
          © {new Date().getFullYear()} PSM Brokerage. Illustrative tool only — not an offer of
          insurance or guarantee of compensation.
        </p>
      </div>
    </footer>
  );
}
