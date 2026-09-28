// Validate data/countries/*.json. Usage: node scripts/validate.mjs [cc ...] [--quiet]
import fs from "node:fs";
import path from "node:path";
import { validateCountry, computeTotals } from "../site/core.js";

const dir = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "data", "countries");
const args = process.argv.slice(2);
const quiet = args.includes("--quiet");
const want = args.filter((a) => !a.startsWith("--")).map((s) => s.toLowerCase());
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && (!want.length || want.includes(f.slice(0, -5))));

let nErr = 0, nWarn = 0;
for (const f of files.sort()) {
  let c;
  try { c = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); }
  catch (e) { console.log(`ERROR ${f}: invalid JSON: ${e.message}`); nErr++; continue; }
  if (c.code !== f.slice(0, -5)) { console.log(`ERROR ${f}: code "${c.code}" does not match filename`); nErr++; }
  const { errors, warnings } = validateCountry(c);
  nErr += errors.length; nWarn += warnings.length;
  for (const e of errors) console.log("ERROR " + e);
  if (!quiet) for (const w of warnings) console.log("warn  " + w);
  if (!quiet && want.length) {
    const t = computeTotals(c);
    console.log(`\n${c.name} totals (MHz, paired counted both ways):`);
    for (const o of c.operators) { const r = t[o.id]; console.log(`  ${o.name.padEnd(28)} <1G ${r.sub1}  1-3G ${r.low}  3-6G ${r.mid}  >6G ${r.mmw}  total ${r.total}${r.approx ? " (approx.)" : ""}`); }
  }
}
console.log(`\n${files.length} file(s): ${nErr} error(s), ${nWarn} warning(s)`);
process.exit(nErr ? 1 : 0);
