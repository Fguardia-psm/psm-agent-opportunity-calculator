import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * When the calculator is iframed (e.g. HubSpot) on a narrow viewport, offer a
 * full-page open so agents are not stuck in a huge fixed-size embed.
 */
export function EmbedBreakout() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const inIframe = window.self !== window.top;
    const narrow = window.matchMedia("(max-width: 640px)").matches;
    setShow(inIframe && narrow);
  }, []);

  if (!show) return null;

  const href =
    typeof window !== "undefined"
      ? window.location.href
      : "https://psm-agent-opportunity-calculator.vercel.app/";

  return (
    <div
      className="border-b border-accent/30 bg-accent/10 px-4 py-3 print:hidden"
      role="region"
      aria-label="Open full calculator"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-snug text-foreground">
          For the best experience on your phone, open the full calculator.
        </p>
        <Button asChild size="sm" className="min-h-11 w-full sm:w-auto">
          <a href={href} target="_top" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" />
            Open full screen
          </a>
        </Button>
      </div>
    </div>
  );
}
