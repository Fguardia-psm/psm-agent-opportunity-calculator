/**
 * Public lead capture — server function + client-safe helpers.
 *
 * Delivery modes (first successful match):
 *  1. LEAD_WEBHOOK_URL — POST JSON (Zapier / Make / Slack / CRM)
 *  2. DATABASE_URL — insert into `leads` table (Neon)
 *
 * Never claim success unless delivery is confirmed.
 * This endpoint is intentionally public (no session). Do NOT run
 * assertSameSiteRequest here — HubSpot embeds and marketing-site posts
 * are cross-site by design.
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
  .optional()
  .nullable();

export const leadInputSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(40),
  state: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .pipe(z.string().length(2)),
  /** NPN is required — digits only, 5–10 characters after strip */
  npn: z
    .string()
    .trim()
    .min(1, "NPN is required")
    .max(15)
    .regex(/^\d{5,10}$/, "Enter a valid NPN (5–10 digits)"),
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
const RATE_LIMIT = 8;
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

/** Strip to digits only. */
export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Format as US tel display while typing: (555) 555-5555
 * Keeps leading +1 if 11 digits starting with 1.
 */
export function formatPhoneInput(raw: string): string {
  let d = digitsOnly(raw).slice(0, 11);
  if (d.length === 11 && d.startsWith("1")) {
    d = d.slice(1);
  } else {
    d = d.slice(0, 10);
  }
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Valid phone → E.164-ish US storage string or null. */
export function normalizePhone(raw: string): string | null {
  let d = digitsOnly(raw);
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  if (d.length !== 10) return null;
  // Store as formatted tel for CRM readability
  return formatPhoneInput(d);
}

/** NPN: digits only, 5–10 length (NIPR national producer number). */
export function formatNpnInput(raw: string): string {
  return digitsOnly(raw).slice(0, 10);
}

export function normalizeNpn(raw: string): string | null {
  const d = digitsOnly(raw);
  if (d.length < 5 || d.length > 10) return null;
  return d;
}

/** Names: letters, spaces, hyphens, apostrophes — collapse whitespace. */
export function formatNameInput(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{M}\s'’.\-]/gu, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

export function formatEmailInput(raw: string): string {
  return raw.replace(/\s/g, "").slice(0, 200);
}

function parseLeadInput(raw: unknown):
  | { ok: true; data: LeadInput }
  | { ok: false; message: string } {
  const candidate =
    raw &&
    typeof raw === "object" &&
    "data" in raw &&
    (raw as { data: unknown }).data &&
    typeof (raw as { data: unknown }).data === "object" &&
    !("firstName" in (raw as object))
      ? (raw as { data: unknown }).data
      : raw;

  const pre =
    candidate && typeof candidate === "object"
      ? {
          ...(candidate as Record<string, unknown>),
          firstName:
            typeof (candidate as { firstName?: unknown }).firstName === "string"
              ? formatNameInput((candidate as { firstName: string }).firstName).trim()
              : (candidate as { firstName?: unknown }).firstName,
          lastName:
            typeof (candidate as { lastName?: unknown }).lastName === "string"
              ? formatNameInput((candidate as { lastName: string }).lastName).trim()
              : (candidate as { lastName?: unknown }).lastName,
          email:
            typeof (candidate as { email?: unknown }).email === "string"
              ? formatEmailInput((candidate as { email: string }).email).toLowerCase()
              : (candidate as { email?: unknown }).email,
          phone:
            typeof (candidate as { phone?: unknown }).phone === "string"
              ? normalizePhone((candidate as { phone: string }).phone) ??
                (candidate as { phone: string }).phone
              : (candidate as { phone?: unknown }).phone,
          npn:
            typeof (candidate as { npn?: unknown }).npn === "string"
              ? formatNpnInput((candidate as { npn: string }).npn)
              : (candidate as { npn?: unknown }).npn,
        }
      : candidate;

  const parsed = leadInputSchema.safeParse(pre);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const field = first?.path?.join(".") || "form";
    const msg = first?.message || "Invalid input";
    return {
      ok: false,
      message:
        field === "phone"
          ? "Enter a valid 10-digit U.S. phone number."
          : field === "email"
            ? "Enter a valid work email."
            : field === "state"
              ? "Select your state."
              : field === "npn"
                ? "Enter your NPN (5–10 digits, numbers only)."
                : `Please check ${field}: ${msg}`,
    };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return { ok: false, message: "Enter a valid 10-digit U.S. phone number." };
  }
  const npn = normalizeNpn(parsed.data.npn);
  if (!npn) {
    return { ok: false, message: "Enter your NPN (5–10 digits, numbers only)." };
  }

  return {
    ok: true,
    data: {
      ...parsed.data,
      phone,
      npn,
      email: parsed.data.email.toLowerCase(),
    },
  };
}

/**
 * Pass-through validator so Zod never throws at the framework layer.
 * We validate inside the handler and return { ok:false } instead.
 */
export const submitLead = createServerFn({ method: "POST" })
  .validator((raw: unknown) => raw)
  .handler(async ({ data }): Promise<LeadSubmitResult> => {
    try {
      const parsed = parseLeadInput(data);
      if (!parsed.ok) {
        return { ok: false, code: "validation", message: parsed.message };
      }
      const lead = parsed.data;

      const { getRequest } = await import("@tanstack/react-start/server");
      const { createHash, randomUUID } = await import("node:crypto");

      if (lead.website && lead.website.length > 0) {
        return { ok: true, mode: "webhook", id: "ignored" };
      }

      if (!checkRateLimit(lead.email)) {
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
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email.toLowerCase(),
        phone: lead.phone,
        state: lead.state,
        npn: lead.npn,
        contractedWithPsm: lead.contractedWithPsm,
        message: lead.message || null,
        calculatorSnapshot: lead.calculatorSnapshot ?? null,
      };

      const webhookUrl = process.env.LEAD_WEBHOOK_URL?.trim();
      let webhookAttempted = false;
      let webhookFailed = false;

      if (webhookUrl) {
        webhookAttempted = true;
        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              accept: "application/json",
              "user-agent": "psm-agent-opportunity-calculator/1.0",
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(12_000),
          });
          if (res.ok) {
            void tryInsertLead(id, lead, userAgent, ipHash);
            return { ok: true, mode: "webhook", id };
          }
          webhookFailed = true;
          const detail = await res.text().catch(() => "");
          console.error("[leads] webhook HTTP", res.status, detail.slice(0, 200));
        } catch (err) {
          webhookFailed = true;
          console.error(
            "[leads] webhook failed:",
            err instanceof Error ? err.message : "error",
          );
        }
      }

      const dbOk = await tryInsertLead(id, lead, userAgent, ipHash);
      if (dbOk) {
        return { ok: true, mode: "database", id };
      }

      if (webhookAttempted && webhookFailed) {
        return {
          ok: false,
          code: "delivery_failed",
          message:
            "We could not deliver your request to the CRM webhook just now. Use the email fallback below so a PSM teammate still receives it.",
        };
      }

      return {
        ok: false,
        code: "not_configured",
        message:
          "Online delivery is not configured yet. Use the email fallback below so a PSM teammate still receives your request.",
      };
    } catch (err) {
      console.error("[leads] unexpected error:", err instanceof Error ? err.message : err);
      return {
        ok: false,
        code: "delivery_failed",
        message:
          "Something went wrong submitting your request. Use the email fallback below so a PSM teammate still receives it.",
      };
    }
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
  npn?: string;
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
      data.npn ? `NPN: ${data.npn}` : "",
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
