/**
 * Public lead capture — server function + client-safe helpers.
 *
 * Delivery: LEAD_WEBHOOK_URL and/or DATABASE_URL.
 * Abuse: fail-closed Origin allowlist (no Origin → reject unless same-origin),
 * email+IP rate limits (best-effort on serverless), honeypot.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { US_STATES } from "@/lib/calculator/assumptions";

const US_STATE_CODES = new Set(US_STATES.map((s) => s.code));

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

export const leadInputSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(7).max(40),
    state: z
      .string()
      .trim()
      .transform((s) => s.toUpperCase())
      .refine((s) => US_STATE_CODES.has(s as never), "Select a valid U.S. state"),
    /** Digits 5–10, or empty when npnPending */
    npn: z.string().trim().max(15).optional().default(""),
    /** Recruit / pre-license path when NPN not yet issued */
    npnPending: z.boolean().optional().default(false),
    contractedWithPsm: z.enum(["yes", "no", "not-sure"]),
    message: z.string().trim().max(2000).optional().default(""),
    consent: z.literal(true, { message: "Professional consent is required" }),
    calculatorSnapshot: snapshotSchema,
    website: z.string().max(200).optional().default(""),
  })
  .superRefine((data, ctx) => {
    const digits = data.npn.replace(/\D/g, "");
    if (data.npnPending) {
      if (digits.length > 0 && (digits.length < 5 || digits.length > 10)) {
        ctx.addIssue({
          code: "custom",
          path: ["npn"],
          message: "If entered, NPN must be 5–10 digits",
        });
      }
      return;
    }
    if (digits.length < 5 || digits.length > 10) {
      ctx.addIssue({
        code: "custom",
        path: ["npn"],
        message: "Enter your NPN (5–10 digits) or mark NPN pending",
      });
    }
  });

export type LeadInput = z.infer<typeof leadInputSchema>;

export type LeadSubmitResult =
  | { ok: true; mode: "webhook" | "database"; id: string }
  | {
      ok: false;
      code:
        | "validation"
        | "rate_limit"
        | "not_configured"
        | "delivery_failed"
        | "forbidden";
      message: string;
    };

const rateBucket = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_EMAIL = 5;
const RATE_LIMIT_IP = 15;
const RATE_WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const row = rateBucket.get(key);
  if (!row || now > row.resetAt) {
    rateBucket.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (row.count >= limit) return false;
  row.count += 1;
  return true;
}

export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function formatPhoneInput(raw: string): string {
  let d = digitsOnly(raw).slice(0, 11);
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  else d = d.slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function normalizePhone(raw: string): string | null {
  let d = digitsOnly(raw);
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  if (d.length !== 10) return null;
  return formatPhoneInput(d);
}

export function formatNpnInput(raw: string): string {
  return digitsOnly(raw).slice(0, 10);
}

export function normalizeNpn(raw: string): string | null {
  const d = digitsOnly(raw);
  if (d.length < 5 || d.length > 10) return null;
  return d;
}

export function formatNameInput(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{M}\s'’.-]/gu, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

export function formatEmailInput(raw: string): string {
  return raw.replace(/\s/g, "").slice(0, 200);
}

/** Explicit production / marketing hosts (not every *.vercel.app preview). */
function builtInAllowedHosts(): Set<string> {
  const hosts = new Set<string>([
    "localhost",
    "127.0.0.1",
    "psmbrokerage.com",
    "www.psmbrokerage.com",
    "psm-agent-opportunity-calculator.vercel.app",
  ]);

  const addHost = (raw: string | undefined) => {
    if (!raw?.trim()) return;
    try {
      const h = raw.includes("://")
        ? new URL(raw).hostname.toLowerCase()
        : raw.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
      if (h) hosts.add(h);
    } catch {
      /* ignore */
    }
  };

  addHost(process.env.VITE_PUBLIC_SITE_URL);
  addHost(process.env.VITE_PUBLIC_APP_URL);
  addHost(process.env.VERCEL_URL);
  addHost(process.env.VERCEL_PROJECT_PRODUCTION_URL);

  for (const item of process.env.LEAD_ALLOWED_ORIGINS?.split(",") ?? []) {
    addHost(item.trim());
  }

  return hosts;
}

/**
 * Fail-closed origin gate for public lead POST.
 * - Browser POSTs send Origin → must match allowlist.
 * - Missing Origin: only same-origin (browser navigation quirks), NOT scripts with no headers.
 */
export function isAllowedLeadOrigin(origin: string | null, site: string | null): boolean {
  if (!origin) {
    // Reject curl/scripts that omit Origin. Allow only true same-origin browser cases.
    return site === "same-origin";
  }

  let host: string;
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }

  const allowed = builtInAllowedHosts();
  if (allowed.has(host)) return true;

  // Preview deployments: only exact VERCEL_URL host already added — not wildcard *.vercel.app
  return false;
}

/** Unwrap TanStack server-fn / seroval-ish client payloads into LeadSubmitResult. */
export function unwrapLeadResult(raw: unknown): LeadSubmitResult | null {
  if (!raw || typeof raw !== "object") return null;

  const asResult = (v: unknown): LeadSubmitResult | null => {
    if (!v || typeof v !== "object") return null;
    if (!("ok" in v)) return null;
    const ok = Boolean((v as { ok: unknown }).ok);
    if (ok) {
      const mode = (v as { mode?: string }).mode;
      const id = (v as { id?: string }).id;
      if ((mode === "webhook" || mode === "database") && typeof id === "string") {
        return { ok: true, mode, id };
      }
      // Honeypot / partial success shapes
      if (typeof id === "string") {
        return { ok: true, mode: "webhook", id };
      }
      return null;
    }
    const codeRaw = (v as { code?: unknown }).code;
    const codes = [
      "validation",
      "rate_limit",
      "not_configured",
      "delivery_failed",
      "forbidden",
    ] as const;
    const code = codes.includes(codeRaw as (typeof codes)[number])
      ? (codeRaw as (typeof codes)[number])
      : "delivery_failed";
    const messageRaw = (v as { message?: unknown }).message;
    return {
      ok: false,
      code,
      message: typeof messageRaw === "string" ? messageRaw : "Submission failed",
    };
  };

  const direct = asResult(raw);
  if (direct) return direct;

  if ("result" in raw) {
    const nested = asResult((raw as { result: unknown }).result);
    if (nested) return nested;
  }

  // Some clients nest under data
  if ("data" in raw) {
    const nested = asResult((raw as { data: unknown }).data);
    if (nested) return nested;
  }

  return null;
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
          npnPending:
            (candidate as { npnPending?: unknown }).npnPending === true ||
            (candidate as { npnPending?: unknown }).npnPending === "true",
          consent:
            (candidate as { consent?: unknown }).consent === true ||
            (candidate as { consent?: unknown }).consent === "true",
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
              ? "Select a valid U.S. state."
              : field === "npn"
                ? "Enter your NPN (5–10 digits) or check “NPN pending”."
                : field === "consent"
                  ? "Please confirm you are a licensed insurance professional."
                  : `Please check ${field}: ${msg}`,
    };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return { ok: false, message: "Enter a valid 10-digit U.S. phone number." };
  }

  const npnPending = Boolean(parsed.data.npnPending);
  const npnDigits = formatNpnInput(parsed.data.npn || "");
  const npn = npnPending ? npnDigits || "" : normalizeNpn(npnDigits);
  if (!npnPending && !npn) {
    return { ok: false, message: "Enter your NPN (5–10 digits) or check “NPN pending”." };
  }

  return {
    ok: true,
    data: {
      ...parsed.data,
      phone,
      npn: npn || "",
      npnPending,
      email: parsed.data.email.toLowerCase(),
      consent: true as const,
    },
  };
}

export const submitLead = createServerFn({ method: "POST" })
  .validator((raw: unknown) => raw)
  .handler(async ({ data }): Promise<LeadSubmitResult> => {
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const { createHash, randomUUID } = await import("node:crypto");
      const request = getRequest();

      const origin = request?.headers.get("origin") ?? null;
      const site = request?.headers.get("sec-fetch-site") ?? null;
      if (!isAllowedLeadOrigin(origin, site)) {
        console.error("[leads] forbidden origin", {
          host: origin ? safeHost(origin) : null,
          site,
        });
        return {
          ok: false,
          code: "forbidden",
          message: "Request blocked. Please submit from the official calculator page.",
        };
      }

      const parsed = parseLeadInput(data);
      if (!parsed.ok) {
        return { ok: false, code: "validation", message: parsed.message };
      }
      const lead = parsed.data;

      if (lead.website && lead.website.length > 0) {
        return { ok: true, mode: "webhook", id: "ignored" };
      }

      const xf = request?.headers.get("x-forwarded-for");
      const ip = xf?.split(",")[0]?.trim() || request?.headers.get("x-real-ip") || null;
      const ipHash = ip ? createHash("sha256").update(ip).digest("hex").slice(0, 32) : "unknown";

      if (!checkRateLimit(`email:${lead.email.toLowerCase()}`, RATE_LIMIT_EMAIL)) {
        return {
          ok: false,
          code: "rate_limit",
          message: "Too many requests from this email. Please try again in about 15 minutes.",
        };
      }
      if (!checkRateLimit(`ip:${ipHash}`, RATE_LIMIT_IP)) {
        return {
          ok: false,
          code: "rate_limit",
          message: "Too many requests from this network. Please try again in about 15 minutes.",
        };
      }

      const id = randomUUID();
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
        npn: lead.npn || null,
        npnPending: Boolean(lead.npnPending),
        contractedWithPsm: lead.contractedWithPsm,
        message: lead.message || null,
        consent: true,
        consentAt: new Date().toISOString(),
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
            void tryInsertLead(id, lead, userAgent, ipHash === "unknown" ? null : ipHash);
            console.error("[leads] delivered", { mode: "webhook", id, status: res.status });
            return { ok: true, mode: "webhook", id };
          }
          webhookFailed = true;
          console.error("[leads] webhook HTTP", res.status);
        } catch (err) {
          webhookFailed = true;
          console.error(
            "[leads] webhook failed:",
            err instanceof Error ? err.message : "error",
          );
        }
      }

      const dbOk = await tryInsertLead(
        id,
        lead,
        userAgent,
        ipHash === "unknown" ? null : ipHash,
      );
      if (dbOk) {
        console.error("[leads] delivered", { mode: "database", id });
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

function safeHost(origin: string): string | null {
  try {
    return new URL(origin).hostname;
  } catch {
    return null;
  }
}

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
        ${JSON.stringify({
          ...(data.calculatorSnapshot ?? {}),
          consent: true,
          npnPending: Boolean(data.npnPending),
        })}::jsonb,
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

export function leadFallbackMailto(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  npn?: string;
  npnPending?: boolean;
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
      data.npnPending ? "NPN: pending / not yet issued" : data.npn ? `NPN: ${data.npn}` : "",
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
