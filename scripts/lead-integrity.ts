/**
 * Lead validation / origin allowlist integrity (no network).
 * Run: npx tsx scripts/lead-integrity.ts
 */

import {
  formatNpnInput,
  formatPhoneInput,
  isAllowedLeadOrigin,
  normalizeNpn,
  normalizePhone,
} from "../src/lib/leads/submit.ts";
import { leadInputSchema } from "../src/lib/leads/submit.ts";

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

ok("phone formats", formatPhoneInput("5125550142") === "(512) 555-0142");
ok("phone strips +1", formatPhoneInput("15125550142") === "(512) 555-0142");
ok("phone normalize", normalizePhone("(512) 555-0142") === "(512) 555-0142");
ok("phone reject short", normalizePhone("5551234") === null);

ok("npn digits only", formatNpnInput("12ab345") === "12345");
ok("npn normalize", normalizeNpn("1234567") === "1234567");
ok("npn reject short", normalizeNpn("1234") === null);

ok("origin vercel", isAllowedLeadOrigin("https://psm-agent-opportunity-calculator.vercel.app", "cross-site"));
ok("origin hubspot host", isAllowedLeadOrigin("https://www.psmbrokerage.com", "cross-site"));
ok("origin localhost", isAllowedLeadOrigin("http://localhost:8080", "same-origin"));
ok("origin evil blocked", !isAllowedLeadOrigin("https://evil.example", "cross-site"));
ok("origin missing + cross-site blocked", !isAllowedLeadOrigin(null, "cross-site"));
ok("origin missing + same-origin ok", isAllowedLeadOrigin(null, "same-origin"));

const good = leadInputSchema.safeParse({
  firstName: "Jane",
  lastName: "Agent",
  email: "jane@agency.com",
  phone: "(512) 555-0142",
  state: "TX",
  npn: "1234567",
  contractedWithPsm: "no",
  message: "",
  consent: true,
  website: "",
  calculatorSnapshot: null,
});
ok("schema accepts good lead", good.success, good.success ? undefined : good.error.issues);

const noConsent = leadInputSchema.safeParse({
  firstName: "Jane",
  lastName: "Agent",
  email: "jane@agency.com",
  phone: "(512) 555-0142",
  state: "TX",
  npn: "1234567",
  contractedWithPsm: "no",
  consent: false,
});
ok("schema rejects consent false", !noConsent.success);

const badState = leadInputSchema.safeParse({
  firstName: "Jane",
  lastName: "Agent",
  email: "jane@agency.com",
  phone: "(512) 555-0142",
  state: "XX",
  npn: "1234567",
  contractedWithPsm: "no",
  consent: true,
});
ok("schema rejects invalid state", !badState.success);

const noNpn = leadInputSchema.safeParse({
  firstName: "Jane",
  lastName: "Agent",
  email: "jane@agency.com",
  phone: "(512) 555-0142",
  state: "TX",
  npn: "",
  contractedWithPsm: "no",
  consent: true,
});
ok("schema requires npn", !noNpn.success);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
