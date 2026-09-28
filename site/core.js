// Shared logic for the spectrum atlas: band groups, totals, ARFCN maths and validation.
// Used by the page (inlined at build time) and by the Node scripts.

export const REGIONS = ["Europe", "Asia-Pacific", "Americas", "Middle East & Africa"];

export const COVERAGE = {
  "block-level": "Block-level",
  "positions-verified": "Positions verified",
  "holdings-only": "Holdings only",
  "partial": "Partial",
  "not-compiled": "Not compiled",
};

export const GROUPS = [
  { id: "450", label: "450 MHz", required: false },
  { id: "600", label: "600 MHz", required: true },
  { id: "700", label: "700 MHz", required: true },
  { id: "800", label: "800 MHz", required: true },
  { id: "850", label: "850 MHz", required: true },
  { id: "900", label: "900 MHz", required: true },
  { id: "1400", label: "1.4–1.5 GHz", required: true },
  { id: "1700", label: "AWS / 1.7 GHz", required: true },
  { id: "1800", label: "1800 MHz", required: true },
  { id: "1900", label: "PCS 1900 / 2 GHz", required: true },
  { id: "2000tdd", label: "1.9/2.0 GHz TDD", required: true },
  { id: "2100", label: "2100 MHz", required: true },
  { id: "2300", label: "2300 MHz", required: true },
  { id: "2600", label: "2.5/2.6 GHz", required: true },
  { id: "3500", label: "3.3–4.2 GHz", required: true },
  { id: "4900", label: "4.4–5.0 GHz", required: true },
  { id: "6g", label: "6 GHz", required: false },
  { id: "26g", label: "24–29 GHz", required: true, mmwave: true },
  { id: "40g", label: "37–43 GHz", required: true, mmwave: true },
  { id: "47g", label: "47 GHz", required: true, mmwave: true },
  { id: "other", label: "Other", required: false },
];
export const GROUP_IDS = GROUPS.map((g) => g.id);

export const TOTAL_COLS = [
  { id: "sub1", label: "<1 GHz" },
  { id: "low", label: "1–3 GHz" },
  { id: "mid", label: "3–6 GHz" },
  { id: "mmw", label: ">6 GHz" },
  { id: "total", label: "Total" },
  { id: "sub6", label: "Sub-6" },
];

const NON_OPERATORS = new Set(["unassigned", "guard"]);
export const isRealOp = (op) => !NON_OPERATORS.has(op);

export const round = (x, d = 1) => {
  const f = 10 ** d;
  return Math.round(x * f) / f;
};
export const width = (r) => round(r[1] - r[0], 3);

// The lowest (downlink / TDD) frequency of a band entry, used to bucket totals.
export function entryAnchor(entry) {
  const r = entry.range || {};
  if (r.dl) return r.dl[0];
  if (r.f) return r.f[0];
  const b = (entry.blocks || [])[0];
  if (b) return (b.dl || b.f)[0];
  return null;
}

export function bucketOf(freq) {
  if (freq == null) return null;
  if (freq < 1000) return "sub1";
  if (freq < 3000) return "low";
  if (freq < 6000) return "mid";
  return "mmw";
}

export const countsInTotals = (entry) =>
  !entry.future && !entry.excludeFromTotal && entry.status !== "not-assigned";

// MHz held by an operator in one entry, counting both directions of paired spectrum.
export function entryHoldings(entry) {
  const out = {};
  const add = (op, mhz) => {
    if (!isRealOp(op)) return;
    out[op] = round((out[op] || 0) + mhz, 3);
  };
  for (const b of entry.blocks || []) {
    if (b.dl) add(b.op, width(b.dl) + (b.ul ? width(b.ul) : 0));
    else if (b.f) add(b.op, width(b.f));
  }
  for (const h of entry.holdings || []) add(h.op, h.mhz * (h.paired ? 2 : 1));
  return out;
}

export function computeTotals(country) {
  const rows = {};
  for (const op of country.operators) rows[op.id] = { sub1: 0, low: 0, mid: 0, mmw: 0, total: 0, sub6: 0, approx: false };
  for (const e of country.bands) {
    if (!countsInTotals(e)) continue;
    const bucket = bucketOf(entryAnchor(e));
    if (!bucket) continue;
    for (const [op, mhz] of Object.entries(entryHoldings(e))) {
      const r = rows[op];
      if (!r) continue;
      r[bucket] = round(r[bucket] + mhz, 3);
      r.total = round(r.total + mhz, 3);
      if (bucket !== "mmw") r.sub6 = round(r.sub6 + mhz, 3);
      if (e.positions === "regional-average") r.approx = true;
    }
  }
  return rows;
}

// ---------- ARFCN maths ----------

export function earfcnToFreq(n, lte) {
  for (const b of Object.values(lte)) {
    const opts =
      b.duplexMode === "FDD"
        ? [
            [b.downlinkArfcnOffset, b.downlinkStartFrequency, b.downlinkEndFrequency, "dl"],
            [b.uplinkArfcnOffset, b.uplinkStartFrequency, b.uplinkEndFrequency, "ul"],
          ]
        : [[b.arfcnOffset, b.startFrequency, b.endFrequency, b.duplexMode === "SDL" ? "dl" : "tdd"]];
    for (const [off, lo, hi, dir] of opts) {
      if (off == null) continue;
      if (n >= off && n < off + Math.round((hi - lo) * 10)) {
        return { freq: round(lo + 0.1 * (n - off), 3), band: b.band, dir };
      }
    }
  }
  return null;
}

export function nrarfcnToFreq(n) {
  if (n < 0 || n > 3279165) return null;
  if (n < 600000) return round(0.005 * n, 3);
  if (n < 2016667) return round(3000 + 0.015 * (n - 600000), 3);
  return round(24250.08 + 0.06 * (n - 2016667), 3);
}

// ---------- validation ----------

const overlaps = (a, b) => a[0] < b[1] - 1e-6 && b[0] < a[1] - 1e-6;
const inside = (a, r) => a[0] >= r[0] - 1e-6 && a[1] <= r[1] + 1e-6;
const isRange = (r) => Array.isArray(r) && r.length === 2 && r.every((x) => typeof x === "number") && r[0] < r[1];
const isUrl = (s) => typeof s === "string" && /^https?:\/\/\S+$/.test(s);

export function validateCountry(c) {
  const errors = [];
  const warnings = [];
  const E = (m) => errors.push(`${c.code}: ${m}`);
  const W = (m) => warnings.push(`${c.code}: ${m}`);

  for (const k of ["code", "name", "region", "asOf", "coverage", "operators", "bands"]) if (c[k] == null) E(`missing field ${k}`);
  if (c.region && !REGIONS.includes(c.region)) E(`bad region ${c.region}`);
  if (c.coverage && !COVERAGE[c.coverage]) E(`bad coverage ${c.coverage}`);
  if (!Array.isArray(c.operators) || !Array.isArray(c.bands)) return { errors, warnings };

  const ops = new Set();
  for (const o of c.operators) {
    if (!/^[a-z0-9-]+$/.test(o.id || "")) E(`bad operator id ${o.id}`);
    if (ops.has(o.id)) E(`duplicate operator ${o.id}`);
    ops.add(o.id);
    if (!/^#[0-9a-fA-F]{6}$/.test(o.color || "")) E(`operator ${o.id} bad colour ${o.color}`);
    if (!o.name) E(`operator ${o.id} has no name`);
  }
  const used = new Set();

  const present = new Set(c.bands.map((b) => b.group));
  for (const g of GROUPS) if (g.required && !present.has(g.id)) E(`required band group ${g.id} missing (add a not-assigned entry)`);

  c.bands.forEach((e, i) => {
    const tag = `band[${i}] ${e.group} "${e.label || ""}"${e.future ? " (future)" : ""}`;
    if (!GROUP_IDS.includes(e.group)) E(`${tag}: unknown group`);
    if (!["assigned", "partially-assigned", "not-assigned", "unknown"].includes(e.status)) E(`${tag}: bad status ${e.status}`);
    if (!["fdd", "tdd", "sdl", "mixed"].includes(e.duplex)) E(`${tag}: bad duplex ${e.duplex}`);
    if (!Array.isArray(e.sources) || e.sources.length === 0) E(`${tag}: no sources`);
    else for (const s of e.sources) if (!isUrl(s)) E(`${tag}: bad source url ${s}`);
    const r = e.range || {};
    if (e.status !== "not-assigned" && !r.dl && !r.f) E(`${tag}: no range`);
    if (r.dl && (!isRange(r.dl) || (r.ul && !isRange(r.ul)))) E(`${tag}: bad range`);
    if (r.f && !isRange(r.f)) E(`${tag}: bad range`);
    if (r.dl && r.ul && Math.abs(width(r.dl) - width(r.ul)) > 1e-6) W(`${tag}: DL range ${width(r.dl)} != UL range ${width(r.ul)}`);
    if (e.future && !e.future.from) E(`${tag}: future without from date`);
    if (e.future && !(e.future.from > c.asOf)) W(`${tag}: future.from ${e.future.from} is not after asOf ${c.asOf} — should this be current?`);

    const blocks = e.blocks || [];
    const holdings = e.holdings || [];
    const pos = e.positions;
    if (e.status === "not-assigned") {
      if (blocks.some((b) => isRealOp(b.op)) || holdings.length) E(`${tag}: not-assigned but has holdings`);
      if (!e.note) W(`${tag}: not-assigned without a note explaining why`);
      return;
    }
    if (!["verified", "unverified", "holdings", "regional-average"].includes(pos)) E(`${tag}: bad positions ${pos}`);
    if ((pos === "verified" || pos === "unverified") && holdings.length) E(`${tag}: ${pos} entry should use blocks, not holdings`);
    if ((pos === "holdings" || pos === "regional-average") && blocks.some((b) => isRealOp(b.op))) E(`${tag}: ${pos} entry should use holdings, not blocks`);
    if (e.status !== "unknown" && blocks.length + holdings.length === 0) E(`${tag}: assigned but no blocks or holdings`);

    // blocks
    const dls = [], fs_ = [], uls = [];
    for (const b of blocks) {
      if (isRealOp(b.op)) { if (!ops.has(b.op)) E(`${tag}: unknown operator ${b.op}`); used.add(b.op); }
      const btag = `${tag} block ${b.op} ${JSON.stringify(b.dl || b.f)}`;
      if (b.dl) {
        if (!isRange(b.dl)) { E(`${btag}: bad dl`); continue; }
        if (r.dl && !inside(b.dl, r.dl)) E(`${btag}: DL outside band range ${JSON.stringify(r.dl)}`);
        if (b.ul) {
          if (!isRange(b.ul)) E(`${btag}: bad ul`);
          else {
            if (Math.abs(width(b.dl) - width(b.ul)) > 1e-6) E(`${btag}: DL width ${width(b.dl)} != UL width ${width(b.ul)}`);
            if (r.ul && !inside(b.ul, r.ul)) E(`${btag}: UL outside band range ${JSON.stringify(r.ul)}`);
            uls.push([b.ul, b.op]);
          }
        } else if (e.duplex === "fdd" && isRealOp(b.op)) E(`${btag}: FDD block without ul`);
        dls.push([b.dl, b.op]);
      } else if (b.f) {
        if (!isRange(b.f)) { E(`${btag}: bad f`); continue; }
        const rr = r.f || r.dl;
        if (rr && !inside(b.f, rr)) E(`${btag}: outside band range ${JSON.stringify(rr)}`);
        fs_.push([b.f, b.op]);
      } else E(`${btag}: block has neither dl nor f`);
      if (b.source && !isUrl(b.source)) E(`${btag}: bad source`);
      for (const k of ["earfcn", "nrarfcn"]) if (b[k] != null && !Array.isArray(b[k])) E(`${btag}: ${k} must be an array`);
    }
    for (const list of [dls, uls, fs_]) {
      for (let a = 0; a < list.length; a++)
        for (let b = a + 1; b < list.length; b++)
          if (overlaps(list[a][0], list[b][0])) E(`${tag}: overlap ${list[a][1]} ${JSON.stringify(list[a][0])} vs ${list[b][1]} ${JSON.stringify(list[b][0])}`);
    }

    // holdings
    let sum = 0;
    for (const h of holdings) {
      if (!ops.has(h.op)) E(`${tag}: unknown operator ${h.op} in holdings`);
      used.add(h.op);
      if (!(typeof h.mhz === "number" && h.mhz > 0)) E(`${tag}: holding ${h.op} bad mhz ${h.mhz}`);
      if (e.duplex === "fdd" && h.paired !== true) W(`${tag}: FDD holding ${h.op} not marked paired`);
      if (h.source && !isUrl(h.source)) E(`${tag}: holding ${h.op} bad source`);
      if (pos === "regional-average" && !h.basis) E(`${tag}: regional-average holding ${h.op} needs a basis`);
      sum += h.mhz;
    }
    const size = r.dl ? width(r.dl) : r.f ? width(r.f) : null;
    if (size != null && sum > size + 1e-6) E(`${tag}: holdings ${round(sum, 3)} MHz exceed band size ${size} MHz (paired amounts must be per direction)`);
    const blockSum = (e.duplex === "fdd" ? dls : dls.length ? dls : fs_).filter(([, op]) => isRealOp(op)).reduce((s, [x]) => s + width(x), 0);
    if (size != null && blockSum > size + 1e-6) E(`${tag}: blocks ${round(blockSum, 3)} MHz exceed band size ${size} MHz`);
  });

  for (const o of c.operators) if (!used.has(o.id) && o.kind !== "other") W(`operator ${o.id} holds nothing in any band`);
  if (!Array.isArray(c.sources) || c.sources.length === 0) W(`no country-level sources list`);
  const implied = impliedCoverage(c);
  if (COVERAGE_ORDER.indexOf(c.coverage) > COVERAGE_ORDER.indexOf(implied)) E(`coverage "${c.coverage}" is more generous than the data supports ("${implied}")`);
  return { errors, warnings };
}

// Badge implied by the data: share of current, counted entries with verified positions,
// and whether any required band's status is unknown.
export const COVERAGE_ORDER = ["not-compiled", "partial", "holdings-only", "positions-verified", "block-level"];
export function impliedCoverage(c) {
  const cur = c.bands.filter((b) => countsInTotals(b) && b.status !== "unknown");
  const unknownRequired = GROUPS.some((g) => g.required && c.bands.some((b) => b.group === g.id && !b.future && b.status === "unknown") && !c.bands.some((b) => b.group === g.id && !b.future && b.status !== "unknown"));
  if (!cur.length) return "not-compiled";
  const ver = cur.filter((b) => b.positions === "verified").length / cur.length;
  const base = ver === 1 ? "block-level" : ver >= 0.6 ? "positions-verified" : "holdings-only";
  return unknownRequired ? "partial" : base;
}
