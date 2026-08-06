/**
 * Agent Opportunity Calculator — pure math
 *
 * Primary markets → treated as covered (products in those categories offered).
 * Opportunity catalog excludes annuity (primary-identity only).
 *
 * Persistency (book retention):
 *   renewed = priorInforce × persistency
 *   Default floor = 85% (agent retains at least 85% of in-force each year)
 *   Planning = 88%, high = 92%
 *
 * Cash flow:
 *   Year 1 placed  = eligibleActive × attach + eligibleNew × attach
 *   Year t>1 placed = eligibleNew × attach
 *   Year-1 impact  = Year-1 placed × firstYearCommission
 *   Renewals (t)   = renewed × renewalCommission
 *   Inforce end    = renewed + placed
 *   Path cumulative = Σ (firstYear + renewal) — always climbs
 */

import {
  ATTACH_RATES,
  CATEGORY_LABELS,
  FIRST_YEAR_REVENUE,
  MAX_CLIENT_COUNT,
  MIN_PERSISTENCY,
  OPPORTUNITY_CATEGORIES,
  OPPORTUNITY_PRODUCT_IDS,
  PERSISTENCY_RATES,
  PRODUCT_BY_ID,
  PRODUCT_LABELS,
  productsFromPrimaryCategories,
  RENEWAL_REVENUE,
  SCENARIO_KEYS,
} from "./assumptions";
import type {
  CalculationResult,
  CalculatorInputs,
  CategoryRollup,
  CompareScenario,
  CustomAssumptions,
  HorizonYears,
  OpportunityProductId,
  PortfolioBand,
  ProductCategory,
  ProductLineResult,
  ScenarioKey,
  ScenarioTotals,
  YearCashflow,
} from "./types";

export function parseClientCount(raw: string): number | null {
  const cleaned = raw.trim().replace(/[,\s]/g, "");
  if (cleaned === "") return null;
  if (!/^\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0 || n > MAX_CLIENT_COUNT) return null;
  return n;
}

/** 0–100 whole percent */
export function parsePercent(raw: string): number | null {
  const cleaned = raw.trim().replace(/%/g, "");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n;
}

function emptyTotals(): ScenarioTotals {
  return { low: 0, moderate: 0, high: 0 };
}

function addTotals(a: ScenarioTotals, b: ScenarioTotals): ScenarioTotals {
  return {
    low: a.low + b.low,
    moderate: a.moderate + b.moderate,
    high: a.high + b.high,
  };
}

function subTotals(a: ScenarioTotals, b: ScenarioTotals): ScenarioTotals {
  return {
    low: Math.max(0, a.low - b.low),
    moderate: Math.max(0, a.moderate - b.moderate),
    high: Math.max(0, a.high - b.high),
  };
}

function sumLinePath(lines: ProductLineResult[]): ScenarioTotals {
  return lines.reduce((acc, p) => addTotals(acc, p.pathCumulative), emptyTotals());
}

function sumLineYear1(lines: ProductLineResult[]): ScenarioTotals {
  return lines.reduce((acc, p) => addTotals(acc, p.year1Impact), emptyTotals());
}

function portfolioBand(score: number): PortfolioBand {
  if (score <= 25) return "broad";
  if (score <= 50) return "some";
  if (score <= 75) return "significant";
  return "high";
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function resolveRates(custom: CustomAssumptions | undefined): {
  attach: Record<ScenarioKey, number>;
  persistency: Record<ScenarioKey, number>;
  usedCustom: boolean;
} {
  if (!custom?.useCustom) {
    return {
      attach: { ...ATTACH_RATES },
      persistency: { ...PERSISTENCY_RATES },
      usedCustom: false,
    };
  }

  const modAttach = clamp(custom.attachModeratePercent, 1, 40) / 100;
  // Floor at MIN_PERSISTENCY (85%) — agent retains at least 85% of book
  const modPers = clamp(custom.persistencyModeratePercent, MIN_PERSISTENCY * 100, 98) / 100;

  return {
    attach: {
      low: clamp(modAttach * 0.5, 0.01, 0.5),
      moderate: modAttach,
      high: clamp(modAttach * 1.5, 0.02, 0.6),
    },
    persistency: {
      low: Math.max(MIN_PERSISTENCY, clamp(modPers - 0.03, MIN_PERSISTENCY, 0.97)),
      moderate: Math.max(MIN_PERSISTENCY, modPers),
      high: Math.max(MIN_PERSISTENCY, clamp(modPers + 0.04, MIN_PERSISTENCY, 0.98)),
    },
    usedCustom: true,
  };
}

function resolveProductRevenue(
  productId: OpportunityProductId,
  custom: CustomAssumptions | undefined,
): { firstYearRevenue: number; renewalRevenue: number; usingCustomRevenue: boolean } {
  const baseFy = FIRST_YEAR_REVENUE[productId];
  const baseRen = RENEWAL_REVENUE[productId];
  if (!custom?.useCustom) {
    return { firstYearRevenue: baseFy, renewalRevenue: baseRen, usingCustomRevenue: false };
  }
  const o = custom.productOverrides[productId];
  // Cap custom overrides so share links / typos cannot invent absurd commissions
  const MAX_FY = 25_000;
  const MAX_REN = 15_000;
  const firstYearRevenue =
    o?.firstYearRevenue != null && o.firstYearRevenue >= 0
      ? Math.min(MAX_FY, o.firstYearRevenue)
      : baseFy;
  const renewalRevenue =
    o?.renewalRevenue != null && o.renewalRevenue >= 0
      ? Math.min(MAX_REN, o.renewalRevenue)
      : baseRen;
  return {
    firstYearRevenue,
    renewalRevenue,
    usingCustomRevenue:
      (o?.firstYearRevenue != null && o.firstYearRevenue !== baseFy) ||
      (o?.renewalRevenue != null && o.renewalRevenue !== baseRen),
  };
}

export function eligibleCounts(
  productId: OpportunityProductId,
  activeClients: number,
  newClientsPerYear: number,
  medicareSharePercent: number,
  under65SharePercent: number,
): { eligibleActive: number; eligibleNew: number } {
  const def = PRODUCT_BY_ID[productId];
  const med = medicareSharePercent / 100;
  const u65 = under65SharePercent / 100;

  let share = 1;
  if (def.eligibility === "medicare") share = med;
  else if (def.eligibility === "under65") share = u65;
  else share = 1;

  return {
    eligibleActive: activeClients * share,
    eligibleNew: newClientsPerYear * share,
  };
}

/**
 * Build multi-year cash path for one product under one attach/persistency pair.
 * Persistency is applied as: renewedCases = priorInforce × persistency (≥ 85% by default).
 */
export function buildProductPath(
  eligibleActive: number,
  eligibleNew: number,
  firstYearRevenue: number,
  renewalRevenue: number,
  attach: number,
  persistency: number,
  horizonYears: HorizonYears,
  existingBookAttach: boolean,
): YearCashflow[] {
  const years: YearCashflow[] = [];
  let inforce = 0;
  let cumulative = 0;
  // Never allow modeled retention below the business floor
  const pers = Math.max(MIN_PERSISTENCY, persistency);

  for (let year = 1; year <= horizonYears; year++) {
    const pipelinePlaced = eligibleNew * attach;
    const catchUpPlaced = year === 1 && existingBookAttach ? eligibleActive * attach : 0;
    const newPlaced = pipelinePlaced + catchUpPlaced;

    const renewed = inforce * pers;
    const renewalProduction = renewed * renewalRevenue;
    const bookAttachProduction = catchUpPlaced * firstYearRevenue;
    const pipelineProduction = pipelinePlaced * firstYearRevenue;
    const firstYearProduction = bookAttachProduction + pipelineProduction;
    const total = firstYearProduction + renewalProduction;
    const inforceEnd = renewed + newPlaced;
    cumulative += total;

    years.push({
      year,
      bookAttachProduction,
      pipelineProduction,
      firstYearProduction,
      renewalProduction,
      total,
      cumulativeTotal: cumulative,
      inforceEnd,
      newPlaced,
    });

    inforce = inforceEnd;
  }

  return years;
}

function sumPath(years: YearCashflow[]): number {
  return years.reduce((s, y) => s + y.total, 0);
}

function year1FromPath(path: YearCashflow[]): number {
  return path[0]?.firstYearProduction ?? 0;
}

function scenarioPathTotals(
  eligibleActive: number,
  eligibleNew: number,
  firstYearRevenue: number,
  renewalRevenue: number,
  horizonYears: HorizonYears,
  existingBookAttach: boolean,
  attach: Record<ScenarioKey, number>,
  persistency: Record<ScenarioKey, number>,
): { cumulative: ScenarioTotals; year1: ScenarioTotals; moderatePath: YearCashflow[] } {
  const cumulative = emptyTotals();
  const year1 = emptyTotals();
  let moderatePath: YearCashflow[] = [];

  for (const key of SCENARIO_KEYS) {
    const path = buildProductPath(
      eligibleActive,
      eligibleNew,
      firstYearRevenue,
      renewalRevenue,
      attach[key],
      persistency[key],
      horizonYears,
      existingBookAttach,
    );
    cumulative[key] = sumPath(path);
    year1[key] = year1FromPath(path);
    if (key === "moderate") moderatePath = path;
  }

  return { cumulative, year1, moderatePath };
}

function bookGapTotals(
  eligibleActive: number,
  firstYearRevenue: number,
  attach: Record<ScenarioKey, number>,
): ScenarioTotals {
  return {
    low: eligibleActive * attach.low * firstYearRevenue,
    moderate: eligibleActive * attach.moderate * firstYearRevenue,
    high: eligibleActive * attach.high * firstYearRevenue,
  };
}

function pipelineTotals(
  eligibleNew: number,
  firstYearRevenue: number,
  attach: Record<ScenarioKey, number>,
): ScenarioTotals {
  return {
    low: eligibleNew * attach.low * firstYearRevenue,
    moderate: eligibleNew * attach.moderate * firstYearRevenue,
    high: eligibleNew * attach.high * firstYearRevenue,
  };
}

function buildInsight(
  result: Pick<
    CalculationResult,
    "hasFullPortfolio" | "topOpportunities" | "horizonYears" | "year1ImpactTotal" | "pathCumulativeTotal"
  >,
  reviewFrequency: CalculatorInputs["reviewFrequency"],
  usedCustom: boolean,
  primaryCategories: ProductCategory[],
  persistencyModerate: number,
): string {
  if (result.hasFullPortfolio) {
    return "Your primary markets already cover every line in this opportunity catalog. Next gains usually come from review consistency, persistency, carrier mix, and case quality.";
  }

  const names = result.topOpportunities
    .slice(0, 3)
    .map((p) => p.label)
    .join(", ")
    .replace(/, ([^,]+)$/, ", or $1");

  const primary =
    primaryCategories.length > 0
      ? ` With a primary focus on ${primaryCategories.map((c) => CATEGORY_LABELS[c]).join(" + ")}, `
      : " ";

  const reviewHint =
    reviewFrequency === "rarely" || reviewFrequency === "sometimes"
      ? " More consistent client reviews often surface needs outside your current toolkit."
      : "";

  const customHint = usedCustom
    ? " Figures use your custom attach, persistency, and/or per-line commission overrides."
    : "";

  const persPct = Math.round(persistencyModerate * 100);

  return `${primary}the largest illustrative Year-1 and multi-year opportunities outside those markets appear to be ${names}. Year-1 includes a one-time attach on your existing book; later years add renewals on the retained in-force (planning retention ${persPct}% — at least 85%). Cumulative dollars climb even when the Year-1 bar is largest.${customHint}${reviewHint}`;
}

function mergeYearPaths(paths: YearCashflow[][]): YearCashflow[] {
  if (paths.length === 0) return [];
  const years = paths[0].length;
  const merged: YearCashflow[] = [];
  let cumulative = 0;
  for (let i = 0; i < years; i++) {
    const bookAttachProduction = paths.reduce((s, p) => s + p[i].bookAttachProduction, 0);
    const pipelineProduction = paths.reduce((s, p) => s + p[i].pipelineProduction, 0);
    const firstYearProduction = paths.reduce((s, p) => s + p[i].firstYearProduction, 0);
    const renewalProduction = paths.reduce((s, p) => s + p[i].renewalProduction, 0);
    const total = paths.reduce((s, p) => s + p[i].total, 0);
    cumulative += total;
    merged.push({
      year: i + 1,
      bookAttachProduction,
      pipelineProduction,
      firstYearProduction,
      renewalProduction,
      total,
      cumulativeTotal: cumulative,
      inforceEnd: paths.reduce((s, p) => s + p[i].inforceEnd, 0),
      newPlaced: paths.reduce((s, p) => s + p[i].newPlaced, 0),
    });
  }
  return merged;
}

function buildCompareScenarios(
  topOpportunities: ProductLineResult[],
  allMissing: ProductLineResult[],
  pathCumulativeTotal: ScenarioTotals,
  year1ImpactTotal: ScenarioTotals,
  horizonYears: number,
): CompareScenario[] {
  if (allMissing.length === 0) return [];

  const top1 = topOpportunities.slice(0, 1);
  const top3 = topOpportunities.slice(0, 3);
  const top1Path = sumLinePath(top1);
  const top3Path = sumLinePath(top3);
  const top1Y1 = sumLineYear1(top1);
  const top3Y1 = sumLineYear1(top3);

  return [
    {
      id: "open",
      title: "Open opportunity today",
      description: `All lines outside your primary markets — full Year-1 and ${horizonYears}-year path still on the table.`,
      productLabels: allMissing.map((p) => p.label),
      capturedPath: emptyTotals(),
      remainingPath: pathCumulativeTotal,
      capturedYear1: emptyTotals(),
      remainingYear1: year1ImpactTotal,
    },
    ...(top1.length
      ? [
          {
            id: "top1",
            title: `If you add only ${top1[0].label}`,
            description: "Capture your single largest line; rest of the gap stays open.",
            productLabels: top1.map((p) => p.label),
            capturedPath: top1Path,
            remainingPath: subTotals(pathCumulativeTotal, top1Path),
            capturedYear1: top1Y1,
            remainingYear1: subTotals(year1ImpactTotal, top1Y1),
          } satisfies CompareScenario,
        ]
      : []),
    ...(top3.length > 1
      ? [
          {
            id: "top3",
            title: "If you add your top 3 lines",
            description: "Focus a contracting + training sprint on the three highest-value categories.",
            productLabels: top3.map((p) => p.label),
            capturedPath: top3Path,
            remainingPath: subTotals(pathCumulativeTotal, top3Path),
            capturedYear1: top3Y1,
            remainingYear1: subTotals(year1ImpactTotal, top3Y1),
          } satisfies CompareScenario,
        ]
      : []),
    {
      id: "all",
      title: "If you add the full open stack",
      description: "Illustrative path if every missing catalog line is added over time.",
      productLabels: allMissing.map((p) => p.label),
      capturedPath: pathCumulativeTotal,
      remainingPath: emptyTotals(),
      capturedYear1: year1ImpactTotal,
      remainingYear1: emptyTotals(),
    },
  ];
}

function buildCategoryRollups(missingLines: ProductLineResult[]): CategoryRollup[] {
  return OPPORTUNITY_CATEGORIES.map((category) => {
    const lines = missingLines.filter((l) => l.category === category);
    return {
      category,
      label: CATEGORY_LABELS[category],
      missingCount: lines.length,
      year1Impact: sumLineYear1(lines),
      pathCumulative: sumLinePath(lines),
    };
  }).filter((r) => r.missingCount > 0);
}

export function calculateOpportunity(inputs: CalculatorInputs): CalculationResult | null {
  const activeClients = parseClientCount(inputs.activeClients);
  const newClientsPerYear = parseClientCount(inputs.newClientsPerYear);
  const medicareSharePercent = parsePercent(inputs.medicareSharePercent);
  const under65SharePercent = parsePercent(inputs.under65SharePercent);
  const horizonYears = inputs.horizonYears === 5 ? 5 : 3;

  if (
    !inputs.state ||
    inputs.primaryCategories.length === 0 ||
    activeClients === null ||
    newClientsPerYear === null ||
    medicareSharePercent === null ||
    under65SharePercent === null ||
    !inputs.reviewFrequency
  ) {
    return null;
  }

  const { attach, persistency, usedCustom } = resolveRates(inputs.customAssumptions);

  // Guard: every scenario retains ≥ 85%
  for (const key of SCENARIO_KEYS) {
    if (persistency[key] < MIN_PERSISTENCY) {
      persistency[key] = MIN_PERSISTENCY;
    }
  }

  const productsOffered = productsFromPrimaryCategories(inputs.primaryCategories);
  const offered = new Set(productsOffered);

  const missingProducts = OPPORTUNITY_PRODUCT_IDS.filter((id) => !offered.has(id));
  const offeredProducts = OPPORTUNITY_PRODUCT_IDS.filter((id) => offered.has(id));
  const hasFullPortfolio = missingProducts.length === 0;

  const productLines: ProductLineResult[] = OPPORTUNITY_PRODUCT_IDS.map((productId) => {
    const def = PRODUCT_BY_ID[productId];
    const isOffered = offered.has(productId);
    const { firstYearRevenue, renewalRevenue, usingCustomRevenue } = resolveProductRevenue(
      productId,
      inputs.customAssumptions,
    );
    const { eligibleActive, eligibleNew } = eligibleCounts(
      productId,
      activeClients,
      newClientsPerYear,
      medicareSharePercent,
      under65SharePercent,
    );
    const existingBookAttach = !isOffered;

    const { cumulative, year1, moderatePath } = scenarioPathTotals(
      eligibleActive,
      eligibleNew,
      firstYearRevenue,
      renewalRevenue,
      horizonYears,
      existingBookAttach,
      attach,
      persistency,
    );


    return {
      productId,
      label: PRODUCT_LABELS[productId],
      category: def.category,
      isOffered,
      firstYearRevenue,
      renewalRevenue,
      usingCustomRevenue,
      compensationSource: def.compensationSource,
      eligibleActive: Math.round(eligibleActive * 10) / 10,
      eligibleNew: Math.round(eligibleNew * 10) / 10,
      existingBookGap: isOffered
        ? emptyTotals()
        : bookGapTotals(eligibleActive, firstYearRevenue, attach),
      newClientYear1: isOffered
        ? emptyTotals()
        : pipelineTotals(eligibleNew, firstYearRevenue, attach),
      year1Impact: isOffered ? emptyTotals() : year1,
      // Covered lines are not open opportunity — show zero path (not residual on already-written book)
      pathCumulative: isOffered ? emptyTotals() : cumulative,
      moderatePath: isOffered
        ? buildProductPath(0, 0, firstYearRevenue, renewalRevenue, 0, persistency.moderate, horizonYears, false)
        : moderatePath,
    };
  });

  const missingLines = productLines.filter((p) => !p.isOffered);
  const topOpportunities = [...missingLines].sort(
    (a, b) => b.pathCumulative.moderate - a.pathCumulative.moderate,
  );

  const existingBookGapTotal = missingLines.reduce(
    (acc, p) => addTotals(acc, p.existingBookGap),
    emptyTotals(),
  );
  const newPipelineYear1Total = missingLines.reduce(
    (acc, p) => addTotals(acc, p.newClientYear1),
    emptyTotals(),
  );
  const year1ImpactTotal = missingLines.reduce(
    (acc, p) => addTotals(acc, p.year1Impact),
    emptyTotals(),
  );
  const pathCumulativeTotal = missingLines.reduce(
    (acc, p) => addTotals(acc, p.pathCumulative),
    emptyTotals(),
  );

  const moderatePathByYear = mergeYearPaths(missingLines.map((p) => p.moderatePath));
  const portfolioScore = Math.round(
    (missingProducts.length / Math.max(1, OPPORTUNITY_PRODUCT_IDS.length)) * 100,
  );

  const partial = {
    hasFullPortfolio,
    topOpportunities: topOpportunities.slice(0, 3),
    horizonYears: horizonYears as HorizonYears,
    year1ImpactTotal,
    pathCumulativeTotal,
  };

  return {
    activeClients,
    newClientsPerYear,
    medicareSharePercent,
    under65SharePercent,
    horizonYears: horizonYears as HorizonYears,
    missingProducts,
    offeredProducts,
    productLines: [...productLines].sort(
      (a, b) =>
        Number(a.isOffered) - Number(b.isOffered) ||
        b.pathCumulative.moderate - a.pathCumulative.moderate,
    ),
    topOpportunities: topOpportunities.slice(0, 3),
    categoryRollups: buildCategoryRollups(missingLines),
    year1ImpactTotal,
    existingBookGapTotal,
    newPipelineYear1Total,
    pathCumulativeTotal,
    moderatePathByYear,
    portfolioScore,
    portfolioBand: portfolioBand(portfolioScore),
    hasFullPortfolio,
    insight: buildInsight(
      partial,
      inputs.reviewFrequency,
      usedCustom,
      inputs.primaryCategories,
      persistency.moderate,
    ),
    compareScenarios: buildCompareScenarios(
      topOpportunities,
      missingLines,
      pathCumulativeTotal,
      year1ImpactTotal,
      horizonYears,
    ),
    effectiveAttach: attach,
    effectivePersistency: persistency,
    usedCustomAssumptions: usedCustom,
  };
}

export function canCalculate(inputs: CalculatorInputs): boolean {
  return (
    Boolean(inputs.state && inputs.reviewFrequency) &&
    inputs.primaryCategories.length > 0 &&
    parseClientCount(inputs.activeClients) !== null &&
    parseClientCount(inputs.newClientsPerYear) !== null &&
    parsePercent(inputs.medicareSharePercent) !== null &&
    parsePercent(inputs.under65SharePercent) !== null
  );
}
