/**
 * Calculator math integrity checks (Node, no browser).
 * Run: node scripts/math-integrity.mjs
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { register } from "node:module";

// Prefer tsx if available via dynamic import of compiled path is hard;
// use process spawn through npx in package.json instead.
console.error("Use: npx tsx scripts/math-integrity.ts");
process.exit(1);
