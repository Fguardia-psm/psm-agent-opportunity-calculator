import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/provider";
import { CreatedWithGrokBanner } from "@/components/created-with-grok-banner";
import appCss from "../styles.css?url";

const APP_NAME =
  "Insurance Agent Opportunity Calculator | Year-1 and Compounding | PSM Brokerage";
const DESCRIPTION =
  "Free calculator for any independent insurance agent. Estimate Year-1 commission impact and multi-year compounding on Medicare, ACA, life, annuity, and ancillary lines you do not offer. CMS-aligned MA defaults. No login, no client data.";

const host = import.meta.env.VITE_PUBLIC_HOSTNAME;
const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
const ogImage = host
  ? `https://og.grok.me/v1/card.png?host=${encodeURIComponent(host)}&title=${encodeURIComponent("Agent Opportunity Calculator")}`
  : undefined;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "description", content: DESCRIPTION },
      {
        name: "keywords",
        content:
          "insurance agent commission calculator, cross sell opportunity, Medicare Advantage commission, annuity agent, fixed annuity commission, ACA agent, life insurance residual, independent agent FMO, compounding renewals",
      },
      { name: "robots", content: "index, follow" },
      { name: "author", content: "PSM Brokerage" },
      { name: "theme-color", content: "#0b3a5c" },
      { title: APP_NAME },
      { property: "og:type", content: "website" },
      { property: "og:title", content: APP_NAME },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:site_name", content: "PSM Brokerage" },
      ...(siteUrl ? [{ property: "og:url", content: siteUrl }] : []),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: APP_NAME },
      { name: "twitter:description", content: DESCRIPTION },
      ...(ogImage
        ? [
            { property: "og:image", content: ogImage },
            { property: "og:image:width", content: "1200" },
            { property: "og:image:height", content: "630" },
            { name: "twitter:image", content: ogImage },
          ]
        : []),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      ...(siteUrl ? [{ rel: "canonical", href: siteUrl }] : []),
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <a href="#calculator" className="sr-only skip-link">
          Skip to calculator
        </a>
        <CreatedWithGrokBanner />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{ className: "font-sans" }}
        />
        <Scripts />
      </body>
    </html>
  );
}
