import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Auth is not required for the public Opportunity Calculator.
 * Keep a minimal route so platform auth scaffolding does not 404,
 * but steer agents back to the product. robots: noindex.
 */
export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in not required | PSM Agent Opportunity Calculator" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "The PSM Agent Opportunity Calculator is public. No sign-in is required.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  return (
    <main className="grid min-h-[calc(100dvh-var(--grok-banner-h,0px))] place-items-center bg-bg px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>No sign-in required</CardTitle>
          <CardDescription>
            The Agent Opportunity Calculator is a public tool for independent agents. You do not
            need an account to estimate Year-1 impact, multi-year compounding, or request a PSM
            portfolio review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link to="/">Go to the calculator</Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Optional platform sign-in is not part of this beta experience.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
