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
// A full document for static hosting (Vercel); the bare fragment is what the Artifact publisher wraps itself.
const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#f3f5f4" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0e1215" media="(prefers-color-scheme: dark)">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${html.replace(/^<meta charset="utf-8">\n/, "")}
</body>
</html>
`;
fs.writeFileSync("dist/index.html", doc);
fs.mkdirSync("build", { recursive: true });
fs.writeFileSync("build/artifact.html", html);
console.log(`built ${countries.length} countries, ${(fs.statSync("dist/spectrum.json").size / 1024).toFixed(0)} KB data`);
