/**
 * Calculator math integrity checks.
 * Run: npx tsx scripts/math-integrity.ts
 */

import { buildProductPath, calculateOpportunity, canCalculate, resolveRates } from "../src/lib/calculator/calculate.ts";
import { defaultInputs } from "../src/lib/calculator/defaults.ts";
import {
  MIN_PERSISTENCY,
  OPPORTUNITY_PRODUCT_IDS,
  PERSISTENCY_RATES,
  productsFromPrimaryCategories,
} from "../src/lib/calculator/assumptions.ts";

let pass = 0;
let fail = 0;

function ok(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    pass += 1;
    console.log("PASS", name);
  } else {
    fail += 1;
    console.error("FAIL", name, detail ?? "");
  }
}

ok("no annuity in opportunity", !OPPORTUNITY_PRODUCT_IDS.some((id) => id.includes("annuity")));
ok("persistency floor", MIN_PERSISTENCY === 0.85);
ok(
  "all default pers >= floor",
  Object.values(PERSISTENCY_RATES).every((p) => p >= MIN_PERSISTENCY),
);

const ma = buildProductPath(200, 40, 626, 313, 0.1, 0.9, 5, true);
ok("MA Y1 ren 0", ma[0].renewalProduction === 0);
ok("MA Y2 ren formula", Math.abs(ma[1].renewalProduction - 24 * 0.9 * 313) < 0.01);
ok("MA ren grows", ma[4].renewalProduction > ma[1].renewalProduction);
ok(
  "MA cum climbs",
  ma.every((y, i, a) => i === 0 || y.cumulativeTotal >= a[i - 1].cumulativeTotal),
);

const life = productsFromPrimaryCategories(["life"]);
ok("life covers FE", life.includes("final-expense"));

const inputs = {
  ...defaultInputs(),
  state: "TX" as const,
  primaryCategories: ["life" as const],
  activeClients: "200",
  newClientsPerYear: "40",
  medicareSharePercent: "40",
  under65SharePercent: "60",
  reviewFrequency: "often" as const,
  horizonYears: 3 as const,
};
ok("canCalculate", canCalculate(inputs));
const r = calculateOpportunity(inputs)!;
ok("result", !!r);
ok("no annuity lines", !r.productLines.some((l) => l.category === "annuity"));
ok(
  "Y1 = book+pipe",
  Math.abs(
    r.year1ImpactTotal.moderate -
      r.existingBookGapTotal.moderate -
      r.newPipelineYear1Total.moderate,
  ) < 1,
);
ok(
  "path = last cum",
  Math.abs(
    r.pathCumulativeTotal.moderate -
      r.moderatePathByYear[r.moderatePathByYear.length - 1].cumulativeTotal,
  ) < 1,
);

const floored = resolveRates({
  useCustom: true,
  attachModeratePercent: 10,
  persistencyModeratePercent: 50,
  productOverrides: {},
});
ok("custom pers floor", floored.persistency.moderate >= MIN_PERSISTENCY);

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
