/**
 * PSM Agent Opportunity Calculator — assumptions
 *
 * Compensation figures are planning defaults for independent agents.
 * - Medicare Advantage / PDP: aligned to CMS national Fair Market Value
 *   structure (initial + ~50% renewal). State special rates may differ.
 * - Other lines: carrier-set; defaults are mid-market industry illustrations
 *   at typical independent-agent contract levels — NOT official PSM schedules.
 *
 * Edit this file to update defaults without touching calculation logic.
 */

import type {
  OpportunityProductId,
  ProductId,
  ProductCategory,
  ReviewFrequency,
  HelpInterest,
  USStateCode,
  HorizonYears,
  ScenarioKey,
} from "./types";

export interface ProductDefinition {
  id: OpportunityProductId;
  label: string;
  category: ProductCategory;
  /** Estimated agent first-year commission per placed case ($) */
  firstYearRevenue: number;
  /** Estimated agent renewal / residual / trail per in-force case per year ($) */
  renewalRevenue: number;
  /**
   * Eligibility pool: which segment of the agent's book can reasonably buy this.
   * - medicare: uses medicareSharePercent
   * - under65: uses under65SharePercent
   * - broad: uses full book (life / annuity / many ancillaries)
   */
  eligibility: "medicare" | "under65" | "broad";
  /** Short note shown in assumptions / table tooltips */
  compensationSource: string;
}

/**
 * Full catalog — lines PSM can help agents add.
 * MA/PDP $ aligned to CMS CY2025 national FMV (~$626 initial / ~$313 renewal).
 */
export const PRODUCT_DEFINITIONS: ProductDefinition[] = [
  {
    id: "medicare-advantage",
    label: "Medicare Advantage",
    category: "medicare",
    firstYearRevenue: 626,
    renewalRevenue: 313,
    eligibility: "medicare",
    compensationSource:
      "CMS CY2025 national FMV approximately $626 initial / $313 renewal (one-half). CT/PA/DC, CA/NJ, and territories differ.",
  },
  {
    id: "medicare-supplement",
    label: "Medicare Supplement",
    category: "medicare",
    firstYearRevenue: 275,
    renewalRevenue: 55,
    eligibility: "medicare",
    compensationSource:
      "Carrier-set. Planning default approximately $275 first-year / $55 renewal per policy (varies widely by plan and contract).",
  },
  {
    id: "pdp",
    label: "Prescription Drug Plan (PDP)",
    category: "medicare",
    firstYearRevenue: 100,
    renewalRevenue: 50,
    eligibility: "medicare",
    compensationSource:
      "CMS sets PDP FMV (varies by year). Planning default approximately $100 initial / $50 renewal.",
  },
  {
    id: "aca-marketplace",
    label: "ACA / Marketplace",
    category: "aca",
    firstYearRevenue: 300,
    renewalRevenue: 150,
    eligibility: "under65",
    compensationSource:
      "Carrier- and state-set (often PMPM). Planning default approximately $300 first-year / $150 ongoing per enrollment.",
  },
  {
    id: "final-expense",
    label: "Final Expense Life",
    category: "life",
    firstYearRevenue: 600,
    renewalRevenue: 50,
    eligibility: "broad",
    compensationSource:
      "Typically about 80–120% of annual premium year 1; renewals about 5–10%. Default assumes about $600 premium at about 100% / about 8%.",
  },
  {
    id: "term-life",
    label: "Term Life",
    category: "life",
    firstYearRevenue: 1200,
    renewalRevenue: 80,
    eligibility: "broad",
    compensationSource:
      "Often about 80–100% of year-1 premium. Default assumes about $1,200–1,500 premium case at about 90% with a modest renewal.",
  },
  {
    id: "fixed-annuity",
    label: "Fixed / MYGA Annuity",
    category: "annuity",
    firstYearRevenue: 1800,
    renewalRevenue: 100,
    eligibility: "broad",
    compensationSource:
      "Typically a percentage of premium (often about 2–5% on MYGA/fixed). Default assumes about $60k premium at about 3% plus modest trail. Override with your schedule.",
  },
  {
    id: "fixed-indexed-annuity",
    label: "Fixed Indexed Annuity (FIA)",
    category: "annuity",
    firstYearRevenue: 2500,
    renewalRevenue: 150,
    eligibility: "broad",
    compensationSource:
      "Carrier-set percentage of premium (often higher than MYGA, product-specific). Default assumes about $75k premium mid-single-digit percentage plus optional trail. Override with your schedule.",
  },
  {
    id: "hospital-indemnity",
    label: "Hospital Indemnity",
    category: "ancillary",
    firstYearRevenue: 300,
    renewalRevenue: 90,
    eligibility: "broad",
    compensationSource:
      "Carrier-set. Planning default approximately $300 first-year / $90 renewal per policy.",
  },
  {
    id: "dental-vision-hearing",
    label: "Dental / Vision / Hearing",
    category: "ancillary",
    firstYearRevenue: 120,
    renewalRevenue: 40,
    eligibility: "broad",
    compensationSource:
      "Carrier-set (often a percentage of premium). Planning default approximately $120 first-year / $40 renewal.",
  },
  {
    id: "cancer-heart-stroke",
    label: "Cancer / Heart / Stroke",
    category: "ancillary",
    firstYearRevenue: 200,
    renewalRevenue: 60,
    eligibility: "broad",
    compensationSource:
      "Carrier-set. Planning default approximately $200 first-year / $60 renewal.",
  },
  {
    id: "short-term-care",
    label: "Short-Term Care",
    category: "ancillary",
    firstYearRevenue: 350,
    renewalRevenue: 90,
    eligibility: "broad",
    compensationSource:
      "Carrier-set. Planning default approximately $350 first-year / $90 renewal.",
  },
];

export const PRODUCT_BY_ID: Record<OpportunityProductId, ProductDefinition> =
  Object.fromEntries(PRODUCT_DEFINITIONS.map((p) => [p.id, p])) as Record<
    OpportunityProductId,
    ProductDefinition
  >;

export const FIRST_YEAR_REVENUE: Record<OpportunityProductId, number> =
  Object.fromEntries(
    PRODUCT_DEFINITIONS.map((p) => [p.id, p.firstYearRevenue]),
  ) as Record<OpportunityProductId, number>;

export const RENEWAL_REVENUE: Record<OpportunityProductId, number> =
  Object.fromEntries(
    PRODUCT_DEFINITIONS.map((p) => [p.id, p.renewalRevenue]),
  ) as Record<OpportunityProductId, number>;

/** Place-rate on eligible clients (conservative / planning / high) */
export const ATTACH_RATES: Record<ScenarioKey, number> = {
  low: 0.05,
  moderate: 0.1,
  high: 0.15,
};

/** In-force persistency (share retained each year) */
export const PERSISTENCY_RATES: Record<ScenarioKey, number> = {
  low: 0.8,
  moderate: 0.85,
  high: 0.9,
};

export const SCENARIO_KEYS: ScenarioKey[] = ["low", "moderate", "high"];

export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  low: "Conservative",
  moderate: "Planning",
  high: "High",
};

export const MAX_CLIENT_COUNT = 100_000;

export const HORIZON_OPTIONS: { value: HorizonYears; label: string }[] = [
  { value: 3, label: "3 years" },
  { value: 5, label: "5 years" },
];

export const ACTIVE_CLIENT_PRESETS = [25, 50, 100, 175, 250, 500, 1000] as const;
export const NEW_CLIENT_PRESETS = [10, 25, 40, 75, 100, 150] as const;

export const OPPORTUNITY_PRODUCT_IDS: OpportunityProductId[] =
  PRODUCT_DEFINITIONS.map((p) => p.id);

export const PRODUCT_LABELS: Record<ProductId, string> = Object.fromEntries(
  PRODUCT_DEFINITIONS.map((p) => [p.id, p.label]),
) as Record<ProductId, string>;

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  medicare: "Medicare",
  aca: "ACA / Marketplace",
  life: "Life",
  annuity: "Annuity",
  ancillary: "Ancillary health",
};

export const CATEGORY_ORDER: ProductCategory[] = [
  "medicare",
  "aca",
  "life",
  "annuity",
  "ancillary",
];

export const PRIMARY_CATEGORY_OPTIONS: {
  value: ProductCategory;
  label: string;
  hint: string;
}[] = [
  { value: "medicare", label: "Medicare", hint: "MA, Med Supp, PDP" },
  { value: "aca", label: "ACA / Marketplace", hint: "Individual and family plans" },
  { value: "life", label: "Life", hint: "Term, final expense, and related" },
  { value: "annuity", label: "Annuity", hint: "Fixed, MYGA, FIA" },
  { value: "ancillary", label: "Ancillary", hint: "HI, DVH, CI, STC, and related" },
];

export const ALL_PRODUCTS: {
  id: ProductId;
  label: string;
  category: ProductCategory;
  isOpportunity: boolean;
}[] = PRODUCT_DEFINITIONS.map((p) => ({
  id: p.id,
  label: p.label,
  category: p.category,
  isOpportunity: true,
}));

export const REVIEW_FREQUENCY_OPTIONS: { value: ReviewFrequency; label: string }[] = [
  { value: "rarely", label: "Rarely" },
  { value: "sometimes", label: "Sometimes" },
  { value: "often", label: "Often" },
  { value: "every-annual-review", label: "Every annual review" },
];

export const HELP_INTEREST_OPTIONS: { value: HelpInterest; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "not-right-now", label: "Not right now" },
];

export const US_STATES: { code: USStateCode; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export const DISCLAIMER_TEXT =
  "Results are illustrative planning estimates only and are not a guarantee of income, commissions, client suitability, product availability, persistency, or sales results. Medicare Advantage and PDP figures reference CMS Fair Market Value structures and may differ by state, plan, and year. Annuity, life, ACA, and other product compensation is carrier- and contract-set and often a percentage of premium. Actual pay varies by carrier, product, state, contract level, client eligibility, persistency, chargebacks, and compliance requirements. Multi-year figures assume illustrative persistency and do not project your actual book. Agents are responsible for suitable, compliant recommendations for each consumer.";

export const PRIVACY_NOTE =
  "Do not enter consumer names, health information, policy numbers, or private client data. Use approximate practice-level counts only.";

export const WIZARD_STEPS = [
  { id: "practice", title: "Your practice", description: "State and what you primarily write" },
  { id: "clients", title: "Your book", description: "Clients and eligibility mix" },
  { id: "products", title: "What you offer", description: "Every line you write today" },
  { id: "behavior", title: "How you work", description: "Reviews, help, and time horizon" },
] as const;

export const FAQ_ITEMS = [
  {
    question: "Who is this calculator for?",
    answer:
      "Any independent insurance agent — Medicare, ACA, life, annuity, ancillary, or mixed. It estimates what you may leave on the table by not offering lines PSM can help you add, with Year-1 impact and multi-year compounding (new production plus renewals and trails).",
  },
  {
    question: "Is this a guarantee of what I will earn?",
    answer:
      "No. Figures are planning estimates using published CMS FMV structure for MA and PDP (national defaults) and mid-market illustrations for carrier-set products — or your custom overrides. Actual commissions, renewals, chargebacks, and persistency vary.",
  },
  {
    question: "How accurate are the dollar amounts?",
    answer:
      "Medicare Advantage defaults use CMS national Fair Market Value (approximately $626 initial / $313 renewal for CY2025 national). Annuity defaults assume a mid-premium case times a mid-single-digit percentage of premium (override with your contract). Med Supp, ACA, life, and ancillary defaults are industry mid-points because carriers set those schedules.",
  },
  {
    question: "How does Year-1 versus multi-year compounding work?",
    answer:
      "Year-1 impact is first-year commission on (1) a one-time place-rate attach on eligible clients you already have, plus (2) new clients that year. Later years add new first-year production and renewal or trail on in-force cases that persist — that residual stack is the compounding effect.",
  },
  {
    question: "What client data do I need?",
    answer:
      "None that is private. Enter approximate active clients or households, new clients per year, and rough percentages for Medicare-age versus under-65. Do not enter names, dates of birth, health information, or policy numbers.",
  },
  {
    question: "Can I use my own commission assumptions?",
    answer:
      "Yes. After you calculate, open “Use my contract assumptions” to set attach rate, persistency, and per-line first-year and renewal dollars. Results update live.",
  },
  {
    question: "Can I save or share my estimate?",
    answer:
      "Yes. Copy a save link, copy a text summary, email yourself, or print to PDF. Links store practice-level inputs only — never private client data.",
  },
] as const;
