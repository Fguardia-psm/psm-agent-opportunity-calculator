import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#overview", label: "Overview" },
  { href: "#path", label: "Path" },
  { href: "#scenarios", label: "Scenarios" },
  { href: "#stack", label: "Stack" },
  { href: "#playbook", label: "Playbook" },
  { href: "#share", label: "Save" },
  { href: "#lead-form", label: "Work with PSM" },
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
      <div className="mx-auto flex max-w-5xl gap-1.5 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              link.href === "#lead-form"
                ? "border-primary/30 bg-primary text-primary-foreground hover:bg-primary/90"
                : "border-border bg-muted/40 text-muted-foreground hover:border-primary/30 hover:bg-primary/[0.04] hover:text-foreground",
            )}
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
