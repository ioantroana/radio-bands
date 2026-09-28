// One-off seed: convert the davwheat/mobile-spectrum-data snapshot (LGPL-3.0) into
// data/countries/<cc>.json skeletons. Research agents then update each file.
import fs from "node:fs";
import { GROUPS } from "../site/core.js";

const snap = JSON.parse(fs.readFileSync("data/reference/davwheat-snapshot.json", "utf8"));
const bandinfo = JSON.parse(fs.readFileSync("data/reference/bandinfo.json", "utf8"));
const META = {
  AT: "Austria", BG: "Bulgaria", DE: "Germany", DK: "Denmark", EE: "Estonia", FI: "Finland", GB: "United Kingdom",
  HU: "Hungary", IE: "Ireland", IT: "Italy", KR: "South Korea", LT: "Lithuania", LV: "Latvia", PL: "Poland",
  PT: "Portugal", RO: "Romania", RU: "Russia",
};
const GROUP_OF = {
  B1: "2100", n1: "2100", B3: "1800", n3: "1800", B5: "850", B7: "2600", n7: "2600", B8: "900", n8: "900",
  B20: "800", B28: "700", n28: "700", B31: "450", B32: "1400", n75: "1400", n76: "1400", B75: "1400", B76: "1400",
  B38: "2600", n38: "2600", B41: "2600", n41: "2600", B39: "2000tdd", B40: "2300", B67: "700", n67: "700",
  B42: "3500", B43: "3500", n77: "3500", n78: "3500", n257: "26g", n258: "26g",
};
const RANGE_OVERRIDE = { n78: [3400, 3800], n77: [3800, 4200], n258: [24250, 27500], n257: [26500, 29500], B42: [3400, 3800] };
const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const UNASSIGNED = new Set(["unallocated", "none", "?", "-", "unavailable"]);

for (const [CC, v] of Object.entries(snap)) {
  const ops = v.operators.map((o) => ({ id: slug(o.aliases.find((a) => a.length <= 12 && !/\s/.test(a)) || o.name), name: o.name, color: o.color, aliases: o.aliases, kind: "mno" }));
  const ids = new Set();
  for (const o of ops) { while (ids.has(o.id)) o.id += "-x"; ids.add(o.id); }
  const extra = [];
  const resolve = (owner) => {
    const lo = owner.toLowerCase();
    if (UNASSIGNED.has(lo)) return "unassigned";
    if (lo.startsWith("guard")) return "guard";
    const cands = v.operators.map((o, i) => [i, [o.name, ...o.aliases].map((s) => s.toLowerCase())]);
    for (const [i, names] of cands) if (names.includes(lo)) return ops[i].id;
    for (const [i, names] of cands) if (names.some((n) => n.startsWith(lo) || lo.startsWith(n))) return ops[i].id;
    let x = extra.find((e) => e.name === owner);
    if (!x) { x = { id: slug(owner) || "other", name: owner, color: "#9aa0a6", aliases: [], kind: "other" }; extra.push(x); }
    return x.id;
  };
  const bands = [];
  for (const e of v.data) {
    const names = e.names;
    const group = GROUP_OF[names.find((n) => GROUP_OF[n])] || "other";
    const sd = e.spectrumData;
    const duplex = sd.some((b) => b.type === "fddDown" || b.type === "genericPaired") ? "fdd" : sd.every((b) => b.type === "sdl" || b.type === "generic") && names.some((n) => ["B32", "B67", "n75", "n76", "B75", "B76"].includes(n)) ? "sdl" : "tdd";
    const key = names.find((n) => bandinfo.lte[n] || bandinfo.nr[n]);
    const bi = bandinfo.lte[key] || bandinfo.nr[key];
    let range;
    if (duplex === "fdd") range = { dl: [bi.downlinkStartFrequency, bi.downlinkEndFrequency], ul: [bi.uplinkStartFrequency, bi.uplinkEndFrequency] };
    else if (bi.downlinkStartFrequency && duplex === "sdl") range = { f: [bi.downlinkStartFrequency, bi.downlinkEndFrequency] };
    else range = { f: RANGE_OVERRIDE[key] || [bi.startFrequency ?? bi.downlinkStartFrequency, bi.endFrequency ?? bi.downlinkEndFrequency] };
    const lo = Math.min(...sd.map((b) => b.startFreq)), hi = Math.max(...sd.map((b) => b.endFreq));
    const rr = range.dl || range.f;
    if (lo < rr[0] || hi > rr[1]) { rr[0] = Math.min(rr[0], lo); rr[1] = Math.max(rr[1], hi); }
    if (range.ul) {
      const ulo = Math.min(...sd.filter((b) => b.pairedWith).map((b) => b.pairedWith.startFreq)), uhi = Math.max(...sd.filter((b) => b.pairedWith).map((b) => b.pairedWith.endFreq));
      if (ulo < range.ul[0] || uhi > range.ul[1]) { range.ul = [Math.min(range.ul[0], ulo), Math.max(range.ul[1], uhi)]; }
    }
    const sources = [...new Set(sd.map((b) => b.sourceInfo?.type === "url" ? b.sourceInfo.url : null).filter(Boolean))];
    const blocks = sd.map((b) => {
      const o = { op: resolve(b.owner) };
      if (b.pairedWith) { o.dl = [b.startFreq, b.endFreq]; o.ul = [b.pairedWith.startFreq, b.pairedWith.endFreq]; }
      else o.f = [b.startFreq, b.endFreq];
      const arr = (x) => (Array.isArray(x) ? x.filter((n) => typeof n === "number") : null);
      if (arr(b.earfcns)?.length) o.earfcn = arr(b.earfcns);
      if (arr(b.nrarfcns)?.length) o.nrarfcn = arr(b.nrarfcns);
      const det = [].concat(b.details || []);
      if (b.ownerLongName && !ops.some((x) => x.name === b.ownerLongName)) det.unshift(b.ownerLongName);
      if (det.length) o.notes = det.join(" · ");
      if (b.sourceInfo?.type === "url") o.source = b.sourceInfo.url;
      else if (b.sourceInfo?.type === "other") o.notes = [o.notes, "Source: " + b.sourceInfo.details].filter(Boolean).join(" · ");
      return o;
    });
    const x = e.extraInfo || {};
    const m = /(\d{4}-\d{2}-\d{2})/.exec(x.shortAddendum || "");
    const entry = {
      group, label: `${GROUPS.find((g) => g.id === group)?.label || names.join("/")} (${names.join("/")})${x.shortAddendum ? " — " + x.shortAddendum : ""}`,
      names, status: "assigned", duplex, range, positions: sources.length ? "verified" : "unverified",
      future: m ? { from: m[1], label: x.shortAddendum } : null,
      excludeFromTotal: !!x.excludeFromSpectrumTotal,
      note: x.description || "", sources: sources.length ? sources : ["https://github.com/davwheat/mobile-spectrum-data/tree/main/src/" + CC],
      blocks,
    };
    bands.push(entry);
  }
  const c = {
    code: CC.toLowerCase(), name: META[CC], region: CC === "KR" ? "Asia-Pacific" : "Europe", asOf: "2026-01-09",
    coverage: "block-level", licensing: "national", summary: "",
    operators: [...ops, ...extra], bands,
    notes: ["Seeded from davwheat/mobile-spectrum-data (LGPL-3.0), commit dc0d2d3 (2026-01-09); must be re-checked."],
    missing: [], changes: [],
    sources: [{ title: "davwheat/mobile-spectrum-data (LGPL-3.0)", url: "https://github.com/davwheat/mobile-spectrum-data" }],
  };
  fs.writeFileSync(`data/reference/seed/${CC.toLowerCase()}.json`, JSON.stringify(c, null, 1));
}
console.log("seeded", Object.keys(snap).length);
