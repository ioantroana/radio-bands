// Merge data/countries/*.json into dist/spectrum.json and inline site/core.js + site/app.js into dist/index.html.
import fs from "node:fs";
import { validateCountry, computeTotals } from "../site/core.js";

const countries = fs.readdirSync("data/countries").filter((f) => f.endsWith(".json")).sort()
  .map((f) => JSON.parse(fs.readFileSync(`data/countries/${f}`, "utf8")));
let errors = 0;
for (const c of countries) errors += validateCountry(c).errors.length;
if (errors && !process.argv.includes("--force")) { console.error(`${errors} validation error(s); run node scripts/validate.mjs`); process.exit(1); }

const lte = JSON.parse(fs.readFileSync("data/reference/bandinfo.json", "utf8")).lte;
// Bands missing from the upstream table that some countries use.
Object.assign(lte, {
  B9: { band: "B9", duplexMode: "FDD", downlinkStartFrequency: 1844.9, downlinkEndFrequency: 1879.9, uplinkStartFrequency: 1749.9, uplinkEndFrequency: 1784.9, downlinkArfcnOffset: 3800, uplinkArfcnOffset: 21800 },
  B33: { band: "B33", duplexMode: "TDD", startFrequency: 1900, endFrequency: 1920, arfcnOffset: 36000 },
  B35: { band: "B35", duplexMode: "TDD", startFrequency: 1850, endFrequency: 1910, arfcnOffset: 36350 },
});
const asOf = countries.reduce((m, c) => (c.asOf > m ? c.asOf : m), "");
const out = { asOf, generated: new Date().toISOString(), countries, lte };
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/spectrum.json", JSON.stringify(out));
// totals snapshot, useful for diffs and review
const totals = Object.fromEntries(countries.map((c) => [c.code, computeTotals(c)]));
fs.writeFileSync("dist/totals.json", JSON.stringify(totals, null, 1));

const core = fs.readFileSync("site/core.js", "utf8").replace(/^export /gm, "");
const app = fs.readFileSync("site/app.js", "utf8");
const html = fs.readFileSync("site/template.html", "utf8").replace("/*CORE*/", () => core).replace("/*APP*/", () => app);
fs.writeFileSync("dist/index.html", html);
console.log(`built ${countries.length} countries, ${(fs.statSync("dist/spectrum.json").size / 1024).toFixed(0)} KB data`);
