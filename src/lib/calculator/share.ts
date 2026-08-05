/**
 * Encode / decode calculator inputs for bookmarkable share links (?s=...).
 */

import { defaultCustomAssumptions, defaultInputs } from "./defaults";
import type {
  CalculatorInputs,
  CustomAssumptions,
  HorizonYears,
  ProductCategory,
  ProductId,
  USStateCode,
} from "./types";
import { OPPORTUNITY_PRODUCT_IDS } from "./assumptions";

const SHARE_VERSION = 2;

interface SharePayload {
  v: number;
  state: string;
  primaryCategories: string[];
  activeClients: string;
  newClientsPerYear: string;
  medicareSharePercent: string;
  under65SharePercent: string;
  productsOffered: string[];
  reviewFrequency: string;
  helpInterest: string;
  horizonYears: number;
  customAssumptions?: CustomAssumptions;
}

function toBase64Url(json: string): string {
  const b64 =
    typeof btoa === "function"
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const raw = b64 + pad;
  if (typeof atob === "function") {
    return decodeURIComponent(escape(atob(raw)));
  }
  return Buffer.from(raw, "base64").toString("utf8");
}

export function encodeInputs(inputs: CalculatorInputs): string {
  const payload: SharePayload = {
    v: SHARE_VERSION,
    state: inputs.state,
    primaryCategories: inputs.primaryCategories,
    activeClients: inputs.activeClients,
    newClientsPerYear: inputs.newClientsPerYear,
    medicareSharePercent: inputs.medicareSharePercent,
    under65SharePercent: inputs.under65SharePercent,
    productsOffered: inputs.productsOffered,
    reviewFrequency: inputs.reviewFrequency,
    helpInterest: inputs.helpInterest,
    horizonYears: inputs.horizonYears,
    customAssumptions: inputs.customAssumptions.useCustom
      ? inputs.customAssumptions
      : undefined,
  };
  return toBase64Url(JSON.stringify(payload));
}

export function decodeInputs(encoded: string): CalculatorInputs | null {
  try {
    const json = fromBase64Url(encoded);
    const data = JSON.parse(json) as SharePayload;
    if (!data || (data.v !== SHARE_VERSION && data.v !== 1)) return null;

    const base = defaultInputs();
    const products = Array.isArray(data.productsOffered)
      ? (data.productsOffered.filter((id) =>
          OPPORTUNITY_PRODUCT_IDS.includes(id as ProductId),
        ) as ProductId[])
      : [];

    let custom = defaultCustomAssumptions();
    if (data.customAssumptions && typeof data.customAssumptions === "object") {
      custom = {
        ...defaultCustomAssumptions(),
        ...data.customAssumptions,
        productOverrides: data.customAssumptions.productOverrides ?? {},
      };
      const cleaned: CustomAssumptions["productOverrides"] = {};
      for (const id of OPPORTUNITY_PRODUCT_IDS) {
        if (custom.productOverrides[id]) cleaned[id] = custom.productOverrides[id];
      }
      custom.productOverrides = cleaned;
    }

    const primaryCategories = Array.isArray(data.primaryCategories)
      ? (data.primaryCategories.filter(Boolean) as ProductCategory[])
      : [];

    return {
      ...base,
      state: (data.state || "") as USStateCode | "",
      primaryCategories,
      activeClients: String(data.activeClients ?? ""),
      newClientsPerYear: String(data.newClientsPerYear ?? ""),
      medicareSharePercent: String(data.medicareSharePercent ?? base.medicareSharePercent),
      under65SharePercent: String(data.under65SharePercent ?? base.under65SharePercent),
      productsOffered: products,
      reviewFrequency: (data.reviewFrequency || "") as CalculatorInputs["reviewFrequency"],
      helpInterest: (data.helpInterest || "") as CalculatorInputs["helpInterest"],
      horizonYears: (data.horizonYears === 5 ? 5 : 3) as HorizonYears,
      customAssumptions: custom,
    };
  } catch {
    return null;
  }
}

export function buildShareUrl(inputs: CalculatorInputs, origin?: string): string {
  const enc = encodeInputs(inputs);
  const base =
    origin ||
    (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "");
  return `${base}?s=${enc}`;
}

export function readShareParam(search: string): string | null {
  try {
    const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
    return params.get("s");
  } catch {
    return null;
  }
}

export function buildEstimateSummary(
  inputs: CalculatorInputs,
  totals: {
    year1Low: number;
    year1Mod: number;
    year1High: number;
    pathLow: number;
    pathMod: number;
    pathHigh: number;
    horizonYears: number;
    activeClients: number;
    newClientsPerYear: number;
    topLines: string[];
  },
): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Math.round(n));

  return [
    "PSM Agent Opportunity Calculator — illustrative estimate",
    "",
    `State: ${inputs.state || "—"}`,
    `Primary focus: ${inputs.primaryCategories.join(", ") || "—"}`,
    `Active clients/households: ${totals.activeClients.toLocaleString()}`,
    `New clients / year: ${totals.newClientsPerYear.toLocaleString()}`,
    `Horizon: ${totals.horizonYears} years`,
    "",
    `Year-1 impact (planning): ${fmt(totals.year1Mod)}  (range ${fmt(totals.year1Low)} – ${fmt(totals.year1High)})`,
    `${totals.horizonYears}-year path (new production and renewals): ${fmt(totals.pathMod)}  (range ${fmt(totals.pathLow)} – ${fmt(totals.pathHigh)})`,
    "",
    totals.topLines.length
      ? `Top lines to review: ${totals.topLines.join(", ")}`
      : "Broad portfolio marked — focus on consistency and reviews.",
    "",
    "Illustrative only — not a guarantee of income. MA and PDP dollars reference CMS FMV structure; other lines are carrier-set planning defaults or your overrides.",
    "Do not include private client data in any follow-up.",
  ].join("\n");
}
