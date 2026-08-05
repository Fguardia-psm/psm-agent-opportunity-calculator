import type { CustomAssumptions, CalculatorInputs } from "./types";

export function defaultCustomAssumptions(): CustomAssumptions {
  return {
    useCustom: false,
    attachModeratePercent: 10,
    persistencyModeratePercent: 85,
    productOverrides: {},
  };
}

export function defaultInputs(): CalculatorInputs {
  return {
    state: "",
    primaryCategories: [],
    activeClients: "",
    newClientsPerYear: "",
    medicareSharePercent: "40",
    under65SharePercent: "55",
    productsOffered: [],
    reviewFrequency: "",
    helpInterest: "",
    horizonYears: 3,
    customAssumptions: defaultCustomAssumptions(),
  };
}
