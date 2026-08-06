import type { CustomAssumptions, CalculatorInputs } from "./types";

export function defaultCustomAssumptions(): CustomAssumptions {
  return {
    useCustom: false,
    attachModeratePercent: 35,
    /** Planning default 90% — face-to-face independent field agent */
    persistencyModeratePercent: 90,
    productOverrides: {},
  };
}

export function defaultInputs(): CalculatorInputs {
  return {
    state: "",
    primaryCategories: [],
    activeClients: "",
    newClientsPerYear: "",
    // Complementary book split (always total 100%)
    medicareSharePercent: "40",
    under65SharePercent: "60",
    productsOffered: [],
    reviewFrequency: "",
    helpInterest: "",
    horizonYears: 3,
    customAssumptions: defaultCustomAssumptions(),
  };
}
