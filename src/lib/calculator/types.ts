/** Primary practice categories (any independent agent) */
export type ProductCategory = "medicare" | "aca" | "life" | "annuity" | "ancillary";

export type ReviewFrequency = "rarely" | "sometimes" | "often" | "every-annual-review";

export type HelpInterest = "yes" | "maybe" | "not-right-now";

export type HorizonYears = 3 | 5;

/**
 * Full PSM opportunity catalog — anything an agent may not sell today
 * that can be added through the brokerage.
 */
export type ProductId =
  | "medicare-advantage"
  | "medicare-supplement"
  | "pdp"
  | "aca-marketplace"
  | "hospital-indemnity"
  | "dental-vision-hearing"
  | "final-expense"
  | "term-life"
  | "fixed-annuity"
  | "fixed-indexed-annuity"
  | "cancer-heart-stroke"
  | "short-term-care";

/** All catalog products participate in opportunity math */
export type OpportunityProductId = ProductId;

export type USStateCode =
  | "AL" | "AK" | "AZ" | "AR" | "CA" | "CO" | "CT" | "DE" | "FL" | "GA"
  | "HI" | "ID" | "IL" | "IN" | "IA" | "KS" | "KY" | "LA" | "ME" | "MD"
  | "MA" | "MI" | "MN" | "MS" | "MO" | "MT" | "NE" | "NV" | "NH" | "NJ"
  | "NM" | "NY" | "NC" | "ND" | "OH" | "OK" | "OR" | "PA" | "RI" | "SC"
  | "SD" | "TN" | "TX" | "UT" | "VT" | "VA" | "WA" | "WV" | "WI" | "WY"
  | "DC";

export type ScenarioKey = "low" | "moderate" | "high";

export interface ProductRevenueOverride {
  firstYearRevenue?: number;
  renewalRevenue?: number;
}

export interface CustomAssumptions {
  useCustom: boolean;
  /** Planning place rate as whole percent, e.g. 10 = 10% of eligible clients */
  attachModeratePercent: number;
  /** Planning persistency as whole percent */
  persistencyModeratePercent: number;
  productOverrides: Partial<Record<OpportunityProductId, ProductRevenueOverride>>;
}

export interface CalculatorInputs {
  state: USStateCode | "";
  /** What the agent primarily writes today (multi) */
  primaryCategories: ProductCategory[];
  /** Active client / household relationships — any market */
  activeClients: string;
  /** New clients / households per year */
  newClientsPerYear: string;
  /**
   * Approx % of book that is Medicare-age / Medicare-eligible.
   * Used for Medicare line eligibility. Free-form number string 0–100.
   */
  medicareSharePercent: string;
  /**
   * Approx % of book under 65 / marketplace-eligible.
   * Used for ACA eligibility.
   */
  under65SharePercent: string;
  productsOffered: ProductId[];
  reviewFrequency: ReviewFrequency | "";
  helpInterest: HelpInterest | "";
  horizonYears: HorizonYears;
  customAssumptions: CustomAssumptions;
}

export interface ScenarioTotals {
  low: number;
  moderate: number;
  high: number;
}

export interface YearCashflow {
  year: number;
  /** Year-1 only: first-year $ from one-time attach on existing book */
  bookAttachProduction: number;
  /** First-year $ from new clients that year (every year) */
  pipelineProduction: number;
  /**
   * Total first-year production this year
   * (= bookAttachProduction + pipelineProduction)
   */
  firstYearProduction: number;
  /** Renewal / residual / trail $ on retained in-force */
  renewalProduction: number;
  /** firstYearProduction + renewalProduction */
  total: number;
  /** Running sum of total through this year (always non-decreasing) */
  cumulativeTotal: number;
  inforceEnd: number;
  newPlaced: number;
}

export interface ProductLineResult {
  productId: OpportunityProductId;
  label: string;
  category: ProductCategory;
  isOffered: boolean;
  firstYearRevenue: number;
  renewalRevenue: number;
  usingCustomRevenue: boolean;
  compensationSource: string;
  /** Eligible book used for this line (count) */
  eligibleActive: number;
  eligibleNew: number;
  existingBookGap: ScenarioTotals;
  newClientYear1: ScenarioTotals;
  /** Year-1 total (book catch-up + new pipeline) first-year $ only */
  year1Impact: ScenarioTotals;
  pathCumulative: ScenarioTotals;
  moderatePath: YearCashflow[];
}

export type PortfolioBand = "broad" | "some" | "significant" | "high";

export interface CompareScenario {
  id: string;
  title: string;
  description: string;
  productLabels: string[];
  capturedPath: ScenarioTotals;
  remainingPath: ScenarioTotals;
  capturedYear1: ScenarioTotals;
  remainingYear1: ScenarioTotals;
}

export interface CategoryRollup {
  category: ProductCategory;
  label: string;
  missingCount: number;
  year1Impact: ScenarioTotals;
  pathCumulative: ScenarioTotals;
}

export interface CalculationResult {
  activeClients: number;
  newClientsPerYear: number;
  medicareSharePercent: number;
  under65SharePercent: number;
  horizonYears: HorizonYears;
  missingProducts: OpportunityProductId[];
  offeredProducts: OpportunityProductId[];
  productLines: ProductLineResult[];
  topOpportunities: ProductLineResult[];
  categoryRollups: CategoryRollup[];
  /** Year-1 first-year $ only (catch-up + pipeline) — missing lines */
  year1ImpactTotal: ScenarioTotals;
  existingBookGapTotal: ScenarioTotals;
  newPipelineYear1Total: ScenarioTotals;
  /** Multi-year cumulative (FY + renewals) — compounding view */
  pathCumulativeTotal: ScenarioTotals;
  moderatePathByYear: YearCashflow[];
  portfolioScore: number;
  portfolioBand: PortfolioBand;
  hasFullPortfolio: boolean;
  insight: string;
  compareScenarios: CompareScenario[];
  effectiveAttach: Record<ScenarioKey, number>;
  effectivePersistency: Record<ScenarioKey, number>;
  usedCustomAssumptions: boolean;
}

export interface LeadSubmission {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: USStateCode | "";
  npn: string;
  contractedWithPsm: "yes" | "no" | "not-sure" | "";
  message: string;
  calculatorSnapshot?: {
    activeClients: number;
    newClientsPerYear: number;
    horizonYears: number;
    primaryCategories: ProductCategory[];
    state: string;
    productsOffered: ProductId[];
    missingProducts: OpportunityProductId[];
    reviewFrequency: string;
    helpInterest: string;
    year1ImpactTotal: ScenarioTotals;
    pathCumulativeTotal: ScenarioTotals;
    portfolioScore: number;
    usedCustomAssumptions: boolean;
  };
  submittedAt: string;
}
