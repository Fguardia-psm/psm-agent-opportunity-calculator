import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#overview", label: "Overview", short: "Overview" },
  { href: "#path", label: "Path", short: "Path" },
  { href: "#scenarios", label: "Scenarios", short: "Scenarios" },
  { href: "#stack", label: "Stack", short: "Stack" },
  { href: "#playbook", label: "Playbook", short: "Playbook" },
  { href: "#share", label: "Copy", short: "Copy" },
  { href: "#lead-form", label: "Work with PSM", short: "Talk to PSM", primary: true },
] as const;

interface ResultsJumpNavProps {
  className?: string;
}

export function ResultsJumpNav({ className }: ResultsJumpNavProps) {
  return (
    <nav
      aria-label="Jump to results section"
      className={cn(
        "sticky z-30 border-b border-border/80 bg-surface/95 backdrop-blur-md print:hidden",
        className,
      )}
      style={{ top: "var(--app-sticky-offset)" }}
    >
      <div
        className={cn(
          "mx-auto flex max-w-5xl gap-2 overflow-x-auto overscroll-x-contain px-3 py-2.5 sm:gap-1.5 sm:px-6 sm:py-2 lg:px-8",
          "snap-x snap-mandatory scroll-smooth",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={cn(
              "snap-start shrink-0 rounded-full border px-3.5 text-xs font-semibold transition-colors",
              "inline-flex min-h-11 items-center justify-center sm:min-h-9 sm:px-3 sm:py-1.5 sm:text-xs sm:font-medium",
              "primary" in link && link.primary
                ? "border-primary/30 bg-primary text-primary-foreground hover:bg-primary/90"
                : "border-border bg-muted/40 text-muted-foreground hover:border-primary/30 hover:bg-primary/[0.04] hover:text-foreground",
            )}
          >
            <span className="sm:hidden">{link.short}</span>
            <span className="hidden sm:inline">{link.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
