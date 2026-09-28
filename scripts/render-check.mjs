// Render every country in headless Chromium and report page errors / empty diagrams.
// Usage: node scripts/render-check.mjs [--shots dir]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve("dist");
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split("?")[0]).replace(/^\/$/, "/index.html"));
  if (!p.startsWith(root) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": p.endsWith(".json") ? "application/json" : "text/html; charset=utf-8" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;
const shotsIdx = process.argv.indexOf("--shots");
const shots = shotsIdx > 0 ? process.argv[shotsIdx + 1] : null;
if (shots) fs.mkdirSync(shots, { recursive: true });

const data = JSON.parse(fs.readFileSync("dist/spectrum.json", "utf8"));
const browser = await chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
let problems = 0;
for (const [label, vp] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport: vp });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  page.on("requestfailed", (r) => { if (!/fonts\.g|favicon/.test(r.url())) errs.push(`request failed: ${r.url()}`); });
  await page.goto(`http://localhost:${port}/#${data.countries[0].code}`);
  await page.waitForSelector("h1");
  for (const c of data.countries) {
    await page.evaluate((cc) => { location.hash = cc; }, c.code);
    await page.waitForFunction((name) => document.querySelector("h1")?.textContent === name, c.name, { timeout: 5000 }).catch(() => errs.push(`${c.code}: heading never rendered`));
    const r = await page.evaluate(() => ({
      bands: document.querySelectorAll(".band").length,
      blocks: document.querySelectorAll(".blk").length,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      nan: /NaN|undefined/.test(document.querySelector("#main").innerText),
    }));
    const assigned = c.coverage === "not-compiled" ? 0 : c.bands.filter((b) => b.status !== "not-assigned" && b.status !== "unknown").length;
    const issues = [];
    if (assigned && !r.bands) issues.push("no band diagrams rendered");
    if (assigned && !r.blocks) issues.push("no blocks drawn");
    if (r.overflow > 1) issues.push(`page scrolls horizontally by ${r.overflow}px`);
    if (r.nan) issues.push("NaN/undefined in page text");
    if (issues.length) { problems += issues.length; console.log(`${label} ${c.code}: ${issues.join("; ")}`); }
    if (shots && label === "desktop") await page.screenshot({ path: `${shots}/${c.code}.png`, fullPage: false });
  }
  for (const e of errs) { problems++; console.log(`${label} error: ${e}`); }
  if (shots) {
    await page.evaluate(() => { location.hash = "gb"; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${shots}/_${label}-gb-full.png`, fullPage: true });
  }
  await page.close();
}
await browser.close();
server.close();
console.log(`render check: ${data.countries.length} countries x 2 viewports, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);
