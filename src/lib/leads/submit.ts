/**
 * Public lead capture — server function + client-safe helpers.
 *
 * Delivery modes (first successful match):
 *  1. LEAD_WEBHOOK_URL — POST JSON (Zapier / Make / Slack / CRM)
 *  2. DATABASE_URL — insert into `leads` table (Neon)
 *
 * Never claim success unless delivery is confirmed.
 * Server-only imports stay inside the handler so the client only gets the RPC stub.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const snapshotSchema = z
  .object({
    activeClients: z.number().finite().min(0).max(100_000).optional(),
    newClientsPerYear: z.number().finite().min(0).max(100_000).optional(),
    horizonYears: z.union([z.literal(3), z.literal(5)]).optional(),
    primaryCategories: z.array(z.string().max(40)).max(10).optional(),
    state: z.string().max(8).optional(),
    productsOffered: z.array(z.string().max(64)).max(30).optional(),
    missingProducts: z.array(z.string().max(64)).max(30).optional(),
    reviewFrequency: z.string().max(40).optional(),
    year1ImpactTotal: z
      .object({
        low: z.number().finite(),
        moderate: z.number().finite(),
        high: z.number().finite(),
      })
      .optional(),
    pathCumulativeTotal: z
      .object({
        low: z.number().finite(),
        moderate: z.number().finite(),
        high: z.number().finite(),
      })
      .optional(),
    portfolioScore: z.number().finite().min(0).max(100).optional(),
    usedCustomAssumptions: z.boolean().optional(),
  })
  .optional();

export const leadInputSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(30)
    .regex(/^[0-9+().\-\s]+$/, "Enter a valid phone number"),
  state: z.string().trim().min(2).max(2),
  npn: z.string().trim().max(20).optional().default(""),
  contractedWithPsm: z.enum(["yes", "no", "not-sure"]),
  message: z.string().trim().max(2000).optional().default(""),
  calculatorSnapshot: snapshotSchema,
  /** Honeypot — real users leave empty; bots that fill it are dropped silently */
  website: z.string().max(200).optional().default(""),
});

export type LeadInput = z.infer<typeof leadInputSchema>;

export type LeadSubmitResult =
  | { ok: true; mode: "webhook" | "database"; id: string }
  | {
      ok: false;
      code: "validation" | "rate_limit" | "not_configured" | "delivery_failed" | "forbidden";
      message: string;
    };

/** In-process rate limit (server process only). */
const rateBucket = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(email: string): boolean {
  const key = email.toLowerCase();
  const now = Date.now();
  const row = rateBucket.get(key);
  if (!row || now > row.resetAt) {
    rateBucket.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (row.count >= RATE_LIMIT) return false;
  row.count += 1;
  return true;
}

export const submitLead = createServerFn({ method: "POST" })
  .validator((raw: unknown) => leadInputSchema.parse(raw))
  .handler(async ({ data }): Promise<LeadSubmitResult> => {
    // Dynamic imports keep Node/server modules out of the client bundle.
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const { createHash, randomUUID } = await import("node:crypto");

    try {
      assertSameSiteRequest();
    } catch {
      return {
        ok: false,
        code: "forbidden",
        message: "Request blocked. Please submit from the calculator page.",
      };
    }

    if (data.website && data.website.length > 0) {
      // Honeypot filled — pretend success, do not store
      return { ok: true, mode: "webhook", id: "ignored" };
    }

    if (!checkRateLimit(data.email)) {
      return {
        ok: false,
        code: "rate_limit",
        message: "Too many requests from this email. Please try again in about 15 minutes.",
      };
    }

    const request = getRequest();
    const id = randomUUID();
    const xf = request?.headers.get("x-forwarded-for");
    const ip = xf?.split(",")[0]?.trim() || request?.headers.get("x-real-ip") || null;
    const ipHash = ip ? createHash("sha256").update(ip).digest("hex").slice(0, 32) : null;
    const userAgent = request?.headers.get("user-agent")?.slice(0, 300) ?? null;

    const payload = {
      id,
      source: "agent-opportunity-calculator",
      submittedAt: new Date().toISOString(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      state: data.state,
      npn: data.npn || null,
      contractedWithPsm: data.contractedWithPsm,
      message: data.message || null,
      calculatorSnapshot: data.calculatorSnapshot ?? null,
    };

    const webhookUrl = process.env.LEAD_WEBHOOK_URL?.trim();
    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "user-agent": "psm-agent-opportunity-calculator/1.0",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10_000),
        });
        if (res.ok) {
          void tryInsertLead(id, data, userAgent, ipHash);
          return { ok: true, mode: "webhook", id };
        }
      } catch (err) {
        console.error(
          "[leads] webhook failed:",
          err instanceof Error ? err.message : "error",
        );
      }
    }

    const dbOk = await tryInsertLead(id, data, userAgent, ipHash);
    if (dbOk) {
      return { ok: true, mode: "database", id };
    }

    return {
      ok: false,
      code: "not_configured",
      message:
        "Online delivery is not configured yet. Use the email fallback below so a PSM teammate still receives your request.",
    };
  });

async function tryInsertLead(
  id: string,
  data: LeadInput,
  userAgent: string | null,
  ipHash: string | null,
): Promise<boolean> {
  if (!process.env.DATABASE_URL?.trim()) return false;
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into leads (
        id, first_name, last_name, email, phone, state, npn,
        contracted_with_psm, message, calculator_snapshot, user_agent, ip_hash
      ) values (
        ${id},
        ${data.firstName},
        ${data.lastName},
        ${data.email.toLowerCase()},
        ${data.phone},
        ${data.state},
        ${data.npn || null},
        ${data.contractedWithPsm},
        ${data.message || null},
        ${JSON.stringify(data.calculatorSnapshot ?? null)}::jsonb,
        ${userAgent},
        ${ipHash}
      )
    `;
    return true;
  } catch (err) {
    console.error("[leads] database insert failed:", err instanceof Error ? err.message : "error");
    return false;
  }
}

/** Client-safe mailto fallback when online delivery is offline. */
export function leadFallbackMailto(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  message: string;
  summary?: string;
}): string {
  const to =
    (typeof import.meta !== "undefined" &&
      (import.meta as ImportMeta & { env?: Record<string, string> }).env
        ?.VITE_LEAD_FALLBACK_EMAIL) ||
    "agents@psmbrokerage.com";
  const subject = encodeURIComponent(
    `Portfolio review request — ${data.firstName} ${data.lastName} (${data.state})`,
  );
  const body = encodeURIComponent(
    [
      "Portfolio review request from the Agent Opportunity Calculator",
      "",
      `Name: ${data.firstName} ${data.lastName}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone}`,
      `State: ${data.state}`,
      data.message ? `Focus: ${data.message}` : "",
      "",
      data.summary || "",
      "",
      "(Submitted via email fallback — online delivery was not available.)",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return `mailto:${to}?subject=${subject}&body=${body}`;
}
