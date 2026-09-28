// Page logic. Relies on the helpers from core.js, which the build inlines above this file.

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = (x) => {
  if (x == null) return "";
  const r = round(x, 3);
  return (Number.isInteger(r) ? r.toFixed(1) : String(r));
};
const fmtW = (x) => { const r = round(x, 3); return Number.isInteger(r) ? String(r) : String(r); };
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

let DATA = null;
let COUNTRY = null;
let HL = null; // { freq, label }

function textColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.4 ? "#111" : "#fff";
}

// ---------- boot ----------
fetch("spectrum.json")
  .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
  .then((d) => { DATA = d; init(); })
  .catch((e) => { $("#main").innerHTML = `<div class="err">Could not load spectrum.json (${esc(e.message)}). Reload the page to try again.</div>`; });

function init() {
  $("#asof").textContent = `Data as of ${DATA.asOf} · ${DATA.countries.length} countries`;
  const theme = store.get("theme");
  if (theme) document.documentElement.dataset.theme = theme;
  $("#themeBtn").addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    store.set("theme", next);
  });
  const reg = $("#region");
  reg.innerHTML = `<option value="">All regions</option>` + REGIONS.map((r) => `<option>${esc(r)}</option>`).join("");
  reg.addEventListener("change", () => {
    fillCountries();
    const first = $("#country").value;
    if (first && (!COUNTRY || (reg.value && COUNTRY.region !== reg.value))) go(first);
  });
  $("#country").addEventListener("change", (e) => go(e.target.value));
  $("#hlk").addEventListener("change", runHighlight);
  $("#hlv").addEventListener("input", runHighlight);
  $("#hlclear").addEventListener("click", () => { $("#hlv").value = ""; runHighlight(); });
  window.addEventListener("hashchange", fromHash);
  const bar = $(".bar"), tog = $("#hlToggle");
  tog.addEventListener("click", () => {
    const open = !bar.classList.contains("find");
    bar.classList.toggle("find", open);
    tog.setAttribute("aria-expanded", String(open));
    if (open) $("#hlv").focus();
  });
  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (COUNTRY && Math.abs(measureTrack() - TRACK_PX) > 40) { const y = scrollY; render(COUNTRY); scrollTo(0, y); } }, 200);
  });
  fromHash();
}

function fillCountries() {
  const r = $("#region").value;
  const list = DATA.countries.filter((c) => !r || c.region === r).sort((a, b) => a.name.localeCompare(b.name));
  $("#country").innerHTML = list.map((c) => `<option value="${c.code}">${esc(c.name)}</option>`).join("");
  if (COUNTRY && list.some((c) => c.code === COUNTRY.code)) $("#country").value = COUNTRY.code;
}

function fromHash() {
  const h = decodeURIComponent(location.hash.slice(1)).toLowerCase();
  const [cc, ...rest] = h.split("-");
  const c = DATA.countries.find((x) => x.code === cc) || DATA.countries.find((x) => x.code === (store.get("country") || "gb")) || DATA.countries[0];
  render(c);
  const anchor = rest.length ? `${c.code}-${rest.join("-")}` : null;
  if (anchor) requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView());
}

function go(cc) {
  if (location.hash.slice(1) === cc) return;
  location.hash = cc;
}

// ---------- render country ----------
// Width of a diagram track in px; label density depends on it.
let TRACK_PX = 800;
function measureTrack() {
  const w = document.querySelector("#main")?.clientWidth || 1000;
  return w <= 640 ? Math.max(240, w - 24 - 30 - 10) : Math.max(620, w - 36 - 40);
}

function render(c) {
  COUNTRY = c;
  TRACK_PX = measureTrack();
  store.set("country", c.code);
  if ($("#region").value && $("#region").value !== c.region) $("#region").value = c.region;
  fillCountries();
  $("#country").value = c.code;
  document.title = `${c.name} · Mobile Spectrum Atlas`;
  const opById = Object.fromEntries(c.operators.map((o) => [o.id, o]));
  const current = c.bands.filter((b) => !b.future && b.status !== "not-assigned");
  const future = c.bands.filter((b) => b.future);
  const na = c.bands.filter((b) => !b.future && b.status === "not-assigned");
  const order = (a, b) => GROUP_IDS.indexOf(a.group) - GROUP_IDS.indexOf(b.group) || (entryAnchor(a) ?? 0) - (entryAnchor(b) ?? 0);
  current.sort(order); future.sort(order); na.sort(order);
  c.bands.forEach((b, i) => (b._id = `${c.code}-b${i}`));

  const html = [];
  html.push(`<div class="head">
    <h1>${esc(c.name)}</h1>
    <div class="meta"><span class="badge cov-${c.coverage}">${esc(COVERAGE[c.coverage])}</span>
      <span>${esc(c.region)}</span><span>Checked ${esc(c.asOf)}</span>
      <span>${c.licensing === "national" ? "National licences" : c.licensing === "regional" ? "Regional licences — figures are averages" : "Mixed national / regional licences"}</span>
      <a href="#${c.code}-notes">Notes &amp; sources</a></div>
    ${c.summary ? `<p class="summary">${esc(c.summary)}</p>` : ""}
  </div>`);

  // band index
  const chips = [];
  for (const g of GROUPS) {
    const cur = current.filter((b) => b.group === g.id);
    const fut = future.filter((b) => b.group === g.id);
    const nas = na.filter((b) => b.group === g.id);
    for (const b of cur) chips.push(chip(b, g, ""));
    if (!cur.length && nas.length) chips.push(`<a class="chip na${g.mmwave ? " mmw" : ""}" data-go="${nas[0]._id}" title="Not assigned">${esc(g.label)} <small>not assigned</small></a>`);
    for (const b of fut) chips.push(chip(b, g, " fut"));
  }
  function chip(b, g, cls) {
    const names = (b.names || []).slice(0, 3).join("/");
    const sub = b.future ? `from ${b.future.from}` : names;
    const lbl = b.duplex === "fdd" || b.duplex === "sdl" || b.duplex === "tdd" ? (b.duplex === "tdd" ? " TDD" : b.duplex === "sdl" ? " SDL" : "") : "";
    const sameGroup = current.filter((x) => x.group === b.group).length > 1;
    return `<a class="chip${g.mmwave ? " mmw" : ""}${cls}" data-go="${b._id}">${esc(g.label)}${sameGroup ? esc(lbl) : ""} <small>${esc(sub)}</small></a>`;
  }
  html.push(`<section class="card" aria-label="Band index"><div class="sech"><h2>Bands</h2><p>Jump to a band. Dashed chips are bands with no assignment; dotted chips are scheduled changes.</p></div><nav class="index">${chips.join("")}</nav></section>`);

  // totals
  const t = computeTotals(c);
  const isMno = (o) => !o.kind || o.kind === "mno";
  const byTotal = (a, b) => t[b.id].total - t[a.id].total;
  const mnoRows = c.operators.filter((o) => isMno(o) && t[o.id].total > 0).sort(byTotal);
  const otherRows = c.operators.filter((o) => !isMno(o) && t[o.id].total > 0).sort(byTotal);
  const rows = [...mnoRows, ...otherRows];
  const max = Math.max(1, ...rows.map((o) => t[o.id].total));
  const anyApprox = rows.some((o) => t[o.id].approx);
  html.push(`<section class="card"><div class="sech"><h2>Spectrum totals</h2><p>MHz held today. Paired spectrum counts both directions (2×10 MHz = 20 MHz). Scheduled changes are excluded.</p></div>
  <div class="scroll"><table class="totals"><thead><tr><th>Operator</th>${TOTAL_COLS.map((k) => `<th class="n">${k.label}</th>`).join("")}</tr></thead><tbody>
  ${rows.map((o, ix) => { const r = t[o.id]; return `${ix === mnoRows.length && ix > 0 ? `<tr class="grp"><th colspan="7" style="padding-top:14px">Other licensees (regional, private, government)</th></tr>` : ""}<tr><td><span class="opcell"><span class="sw" style="background:${o.color}"></span>${esc(o.name)}${r.approx ? " ≈" : ""}<b class="phtot">${fmtW(r.total)} MHz</b></span></td>${TOTAL_COLS.map((k) => `<td data-l="${k.label}" class="n${k.id === "total" ? " total" : ""}${r[k.id] ? "" : " zero"}">${fmtW(r[k.id])}${k.id === "total" ? `<div class="tbar" style="width:${(r.total / max) * 100}%;background:${o.color}"></div>` : ""}</td>`).join("")}</tr>`; }).join("")}
  </tbody></table></div>
  ${anyApprox ? `<p class="foot">≈ includes population-weighted or national averages for regionally licensed bands; see each band for the basis.</p>` : ""}
  ${rows.length === 0 ? `<p class="foot">No holdings compiled yet.</p>` : ""}
  </section>`);

  // legend + bands
  html.push(`<section class="card"><div class="sech"><h2>Band allocations</h2><p>Each diagram is to scale within its band. Click a block or a table row to link the two.</p></div>
    <div class="legend"><span><i class="lk solid"></i>Exact position, verified</span><span><i class="lk dashed"></i>Position not verified or amount only</span><span><i class="lk free"></i>Unassigned</span><span><span class="tag avg">avg</span> Regional licences, averaged</span></div>
    ${current.map((b) => bandHTML(b, opById)).join("") || `<p class="foot">No assigned bands compiled.</p>`}
  </section>`);

  if (future.length) {
    html.push(`<section class="card"><div class="sech"><h2>Scheduled changes</h2><p>Announced assignments that take effect after ${esc(c.asOf)}. Not counted in the totals.</p></div>${future.map((b) => bandHTML(b, opById)).join("")}</section>`);
  }

  html.push(`<section class="card"><div class="sech"><h2>Not assigned</h2><p>Bands with no mobile licence in ${esc(c.name)}, and why.</p></div>
    ${na.length ? `<div class="nalist">${na.map((b) => `<div class="naitem" id="${b._id}"><b>${esc(b.label || GROUPS.find((g) => g.id === b.group)?.label)}</b>${b.names?.length ? `<span class="mono">${esc(b.names.join(" / "))}${b.range ? " · " + rangeText(b.range) : ""}</span>` : ""}<p>${esc(b.note || "Not assigned.")}</p>${(b.sources || []).map((s) => `<a href="${esc(s)}" target="_blank" rel="noopener">${esc(host(s))}</a>`).join(" ")}</div>`).join("")}</div>` : `<p class="foot">Every band group has at least one assignment.</p>`}
  </section>`);

  // notes
  const li = (arr) => (arr || []).map((x) => `<li>${esc(x)}</li>`).join("");
  html.push(`<section class="card notes" id="${c.code}-notes"><h2>Notes</h2>
    ${(() => { const unk = c.bands.filter((b) => !b.future && b.status === "unknown").map((b) => `${b.label || b.group}: status could not be established${b.note ? " — " + b.note : ""}`); const all = [...unk, ...(c.missing || [])]; return all.length ? `<h3>Missing or unverified</h3><ul>${li(all)}</ul>` : ""; })()}
    ${c.notes?.length ? `<h3>Notes</h3><ul>${li(c.notes)}</ul>` : ""}
    ${c.changes?.length ? `<h3>Changes since the davwheat dataset</h3><ul>${li(c.changes)}</ul>` : ""}
    <h3>Operators</h3><ul>${c.operators.map((o) => `<li><span class="opcell" style="display:inline-flex"><span class="sw" style="background:${o.color}"></span><b>${esc(o.name)}</b></span>${o.legal ? ` — ${esc(o.legal)}` : ""}${o.notes ? `. ${esc(o.notes)}` : ""}</li>`).join("")}</ul>
    <h3>Sources</h3><ul class="srcs">${(c.sources || []).map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title || s.url)}</a></li>`).join("")}</ul>
  </section>`);

  html.push(overviewHTML(c));
  html.push(`<footer><p>Seeded from <a href="https://github.com/davwheat/mobile-spectrum-data" target="_blank" rel="noopener">davwheat/mobile-spectrum-data</a> (LGPL-3.0) for the countries it covers, then re-checked and extended from regulator documents and trade press. Layout modelled on <a href="https://mastdatabase.co.uk/gb/spectrum/" target="_blank" rel="noopener">mastdatabase.co.uk</a>. Block positions are only drawn solid when a regulator document or two independent sources confirm them.</p></footer>`);

  $("#main").innerHTML = html.join("");
  wire();
  runHighlight();
}

const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
const rangeText = (r) => r.dl ? `DL ${fmt(r.dl[0])}–${fmt(r.dl[1])} / UL ${fmt(r.ul?.[0])}–${fmt(r.ul?.[1])} MHz` : r.f ? `${fmt(r.f[0])}–${fmt(r.f[1])} MHz` : "";

function bandHTML(b, opById) {
  const r = b.range || {};
  const isHold = b.positions === "holdings" || b.positions === "regional-average";
  const tags = [];
  if (b.names?.length) tags.push(`<span class="tag">${esc(b.names.join(" / "))}</span>`);
  tags.push(`<span class="tag">${b.duplex.toUpperCase()}</span>`);
  if (b.positions === "verified") tags.push(`<span class="tag ok">positions verified</span>`);
  else if (b.positions === "regional-average") tags.push(`<span class="tag avg">avg · regional licences</span><span class="tag warn">positions not verified</span>`);
  else tags.push(`<span class="tag warn">positions not verified</span>`);
  if (b.status === "partially-assigned") tags.push(`<span class="tag">partly assigned</span>`);
  if (b.status === "unknown") tags.push(`<span class="tag warn">status unknown</span>`);
  if (b.future) tags.push(`<span class="tag fut">${esc(b.future.label || "from " + b.future.from)}</span>`);
  else if (b.excludeFromTotal) tags.push(`<span class="tag">not in totals</span>`);

  // Build drawable items: [{op, rows:{dl|ul|f:[a,b]}, idx, kind}]
  const items = [];
  (b.blocks || []).forEach((k, i) => items.push({ k, i, dl: k.dl, ul: k.ul, f: k.f, hold: false }));
  if (isHold) {
    // Lay holdings out side by side from the bottom of the band, to scale.
    const base = r.dl || r.f;
    let pos = base ? base[0] : 0;
    let upos = r.ul ? r.ul[0] : 0;
    (b.holdings || []).forEach((h, i) => {
      const it = { k: h, i: `h${i}`, hold: true };
      if (r.dl) { it.dl = [pos, pos + h.mhz]; if (r.ul) it.ul = [upos, upos + h.mhz]; }
      else it.f = [pos, pos + h.mhz];
      pos += h.mhz; upos += h.mhz;
      items.push(it);
    });
  }

  const rowsSpec = r.dl ? [["DL", r.dl, "dl"], ...(r.ul ? [["UL", r.ul, "ul"]] : [])] : r.f ? [[b.duplex === "sdl" ? "SDL" : "TDD", r.f, "f"]] : [];
  const diag = rowsSpec.map(([lab, rr, key]) => {
    const span = rr[1] - rr[0];
    const pct = (x) => ((x - rr[0]) / span) * 100;
    const blocks = items.filter((it) => it[key] || (key === "f" && it.dl)).map((it) => {
      const seg = it[key] || it.dl;
      const o = opById[it.k.op];
      const special = it.k.op === "unassigned" || it.k.op === "guard";
      const w = pct(seg[1]) - pct(seg[0]);
      const name = special ? (it.k.op === "guard" ? "guard" : "free") : (o?.short || o?.name || it.k.op);
      const mhz = fmtW(seg[1] - seg[0]);
      const col = o?.color || "#999";
      const dashed = it.hold || b.positions === "unverified";
      const px = (w / 100) * TRACK_PX;
      const inner = px >= 58 ? `${esc(name)}<small>${it.hold && it.k.paired ? "2×" : ""}${mhz}</small>` : px >= 24 ? `<small>${mhz}</small>` : "";
      const style = special ? "" : dashed ? `background:color-mix(in srgb, ${col} 55%, var(--surface));color:${textColor(col) === "#fff" ? "var(--ink)" : "#111"};border-color:${col}` : `background:${col};color:${textColor(col)}`;
      const title = `${special ? name : o?.name || it.k.op}: ${fmt(seg[0])}–${fmt(seg[1])} MHz (${mhz} MHz)${it.hold ? " — amount only, position not verified" : ""}`;
      return `<div class="blk${special ? " " + it.k.op : ""}${dashed ? " dash" : ""}${it.hold ? " hold" : ""}" data-b="${b._id}" data-i="${it.i}" style="left:${pct(seg[0])}%;width:${w}%;${style}" title="${esc(title)}">${inner}</div>`;
    }).join("");
    return `<div class="drow"><div class="dlab">${lab}</div><div class="track" data-lo="${rr[0]}" data-hi="${rr[1]}" data-row="${key}" data-b="${b._id}">${blocks}</div></div>
      <div class="edges">${edgeLabels(rr, items, key)}</div>`;
  }).join("");

  // allocation table
  const trs = items.map((it) => {
    const k = it.k, o = opById[k.op];
    const special = k.op === "unassigned" || k.op === "guard";
    const nm = special ? (k.op === "guard" ? "Guard band" : "Unassigned") : o?.name || k.op;
    let dl = "", ul = "", wid = "";
    if (it.hold) {
      wid = `${k.paired ? "2×" : ""}${fmtW(k.mhz)}`;
      dl = `<span class="dim">${k.basis && k.basis !== "exact" ? esc(k.basis) : "position not published"}</span>`;
    } else if (k.dl) {
      dl = `${fmt(k.dl[0])}–${fmt(k.dl[1])}`; ul = k.ul ? `${fmt(k.ul[0])}–${fmt(k.ul[1])}` : "";
      wid = `${k.ul ? "2×" : ""}${fmtW(k.dl[1] - k.dl[0])}`;
    } else if (k.f) {
      dl = `${fmt(k.f[0])}–${fmt(k.f[1])}`; wid = fmtW(k.f[1] - k.f[0]);
    }
    const notes = [k.notes, k.source && !(b.sources || []).includes(k.source) ? `<a href="${esc(k.source)}" target="_blank" rel="noopener">source</a>` : ""].filter(Boolean);
    return `<tr data-b="${b._id}" data-i="${it.i}"><td><span class="opcell"><span class="sw" style="background:${special ? "var(--unassigned)" : o?.color || "#999"}"></span>${esc(nm)}</span></td><td class="n" data-l="${it.hold ? "Position" : k.f ? "Frequency" : "Downlink"}">${dl}</td><td class="n" data-l="Uplink">${ul}</td><td class="n" data-l="Width (MHz)">${wid}</td>
<td class="arf" data-l="EARFCN">${(k.earfcn || []).join(", ")}</td><td class="arf" data-l="NR-ARFCN">${(k.nrarfcn || []).join(", ")}</td>
<td class="n" data-l="Expiry">${esc(k.expiry || "")}</td><td class="notes">${notes.map((n) => (n.startsWith("<a") ? n : esc(n))).join(" · ")}</td></tr>`;
  }).join("");
  const hasUL = items.some((it) => it.ul);
  const table = `<details class="alloct" open><summary>Allocation table (${items.length})</summary><div class="scroll"><table class="alloc"><thead><tr><th>Operator</th><th class="n">${r.f ? "Frequency" : "Downlink"} (MHz)</th><th class="n">${hasUL ? "Uplink (MHz)" : ""}</th><th class="n">Width (MHz)</th><th>EARFCN</th><th>NR-ARFCN</th><th class="n">Expiry</th><th>Notes</th></tr></thead><tbody>${trs}</tbody></table></div></details>`;

  const srcs = (b.sources || []).map((s) => `<a href="${esc(s)}" target="_blank" rel="noopener">${esc(host(s))}</a>`).join(", ");
  const sameLabel = b.label || GROUPS.find((g) => g.id === b.group)?.label;
  return `<div class="band" id="${b._id}">
    <div class="bandh"><h3>${esc(sameLabel)}</h3>${tags.join("")}</div>
    ${b.note ? `<p class="bnote">${esc(b.note)}</p>` : ""}
    ${diag ? `<div class="scroll"><div class="diag">${diag}</div></div>` : ""}
    ${table}
    <p class="src">Sources: ${srcs || "none recorded"}</p>
  </div>`;
}

function edgeLabels(rr, items, key) {
  const span = rr[1] - rr[0];
  const pts = new Set([rr[0], rr[1]]);
  for (const it of items) {
    if (it.hold) continue;
    const seg = it[key] || (key === "f" ? it.dl : null);
    if (seg) { pts.add(round(seg[0], 3)); pts.add(round(seg[1], 3)); }
  }
  const sorted = [...pts].filter((x) => x >= rr[0] - 1e-6 && x <= rr[1] + 1e-6).sort((a, b) => a - b);
  const out = [];
  let last = -99;
  const minGap = (13 / TRACK_PX) * 100; // keep ~13px between vertical labels
  sorted.forEach((x, i) => {
    const p = ((x - rr[0]) / span) * 100;
    const isEnd = i === 0 || i === sorted.length - 1;
    if (!isEnd && (p - last < minGap || 100 - p < minGap)) return;
    last = p;
    out.push(`<i style="left:${p}%"></i><span class="${isEnd ? "end" : ""}" style="left:${p}%">${fmt(x)}</span>`);
  });
  return out.join("");
}

function wire() {
  $("#main").addEventListener("click", onClick);
}
function onClick(e) {
  const go_ = e.target.closest("[data-go]");
  if (go_) { e.preventDefault(); document.getElementById(go_.dataset.go)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); return; }
  const el = e.target.closest(".blk[data-i], tr[data-i]");
  if (!el || e.target.closest("a")) return;
  const { b, i } = el.dataset;
  const was = el.classList.contains("sel");
  document.querySelectorAll(".sel").forEach((x) => x.classList.remove("sel"));
  if (was) return;
  document.querySelectorAll(`[data-b="${b}"][data-i="${i}"]`).forEach((x) => x.classList.add("sel"));
  const partner = el.tagName === "TR" ? document.querySelector(`.blk[data-b="${b}"][data-i="${i}"]`) : document.querySelector(`tr[data-b="${b}"][data-i="${i}"]`);
  if (partner && el.tagName !== "TR") {
    partner.closest("details")?.setAttribute("open", "");
    partner.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

// ---------- highlighter ----------
function runHighlight() {
  document.querySelectorAll(".mark").forEach((m) => m.remove());
  document.querySelectorAll(".hit").forEach((m) => m.classList.remove("hit"));
  const kind = $("#hlk").value;
  const raw = $("#hlv").value.trim();
  const msg = $("#hlmsg");
  $("#hlv").placeholder = kind === "earfcn" ? "e.g. 1300" : kind === "nr" ? "e.g. 632628" : "e.g. 3550.5";
  if (!raw) { msg.textContent = ""; return; }
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n)) { msg.textContent = "Enter a number."; return; }
  let freq, desc;
  if (kind === "earfcn") {
    if (!Number.isInteger(n)) { msg.textContent = "An EARFCN is a whole number."; return; }
    const r = earfcnToFreq(n, DATA.lte);
    if (!r) { msg.textContent = `EARFCN ${n} is not in any LTE band this atlas knows.`; return; }
    freq = r.freq; desc = `EARFCN ${n} = Band ${r.band.replace(/^B/, "")} ${r.dir === "ul" ? "uplink" : r.dir === "tdd" ? "TDD" : "downlink"} ${fmt(freq)} MHz`;
  } else if (kind === "nr") {
    if (!Number.isInteger(n)) { msg.textContent = "An NR-ARFCN is a whole number."; return; }
    freq = nrarfcnToFreq(n);
    if (freq == null) { msg.textContent = "NR-ARFCN must be between 0 and 3279165."; return; }
    desc = `NR-ARFCN ${n} = ${fmt(freq)} MHz`;
  } else { freq = n; desc = `${fmt(n)} MHz`; }

  const hits = [];
  document.querySelectorAll(".track").forEach((t) => {
    const lo = +t.dataset.lo, hi = +t.dataset.hi;
    if (freq < lo || freq > hi) return;
    const m = document.createElement("div");
    m.className = "mark";
    m.style.left = `${((freq - lo) / (hi - lo)) * 100}%`;
    t.appendChild(m);
    t.querySelectorAll(".blk").forEach((bk) => {
      const l = parseFloat(bk.style.left), w = parseFloat(bk.style.width);
      const p = ((freq - lo) / (hi - lo)) * 100;
      if (p >= l - 1e-9 && p <= l + w + 1e-9 && !bk.classList.contains("hold")) {
        bk.classList.add("hit");
        document.querySelector(`tr[data-b="${bk.dataset.b}"][data-i="${bk.dataset.i}"]`)?.classList.add("hit");
        hits.push(bk.title.split(":")[0]);
      }
    });
  });
  const first = document.querySelector(".mark");
  const where = hits.length ? ` — inside ${[...new Set(hits)].map(esc).join(", ")}` : first ? " — inside a drawn band, no exact block matches" : ` — no band in ${esc(COUNTRY.name)} covers this frequency`;
  msg.innerHTML = `<b>▼</b> ${esc(desc)}${where}`;
  if (first && document.activeElement === $("#hlv")) first.closest(".band")?.scrollIntoView({ block: "nearest" });
}

// ---------- overview ----------
function overviewHTML(cur) {
  const rows = REGIONS.map((reg) => {
    const cs = DATA.countries.filter((c) => c.region === reg).sort((a, b) => a.name.localeCompare(b.name));
    return `<tr><th colspan="6" style="padding-top:14px">${esc(reg)}</th></tr>` + cs.map((c) => {
      const assigned = new Set(c.bands.filter((b) => !b.future && b.status !== "not-assigned").map((b) => b.group));
      const mmw = ["26g", "40g", "47g"].filter((g) => assigned.has(g)).map((g) => GROUPS.find((x) => x.id === g).label);
      return `<tr class="${c.code === cur.code ? "cur" : ""}"><td><a href="#${c.code}">${esc(c.name)}</a></td><td><span class="badge cov-${c.coverage}">${esc(COVERAGE[c.coverage])}</span></td><td class="n">${c.operators.filter((o) => o.kind === "mno" || !o.kind).length}</td><td class="n">${assigned.size}</td><td>${mmw.length ? esc(mmw.join(", ")) : `<span class="dim" style="color:var(--ink-3)">none</span>`}</td><td class="n">${esc(c.asOf)}</td></tr>`;
    }).join("");
  }).join("");
  return `<section class="card ov"><div class="sech"><h2>All countries</h2><p>Coverage of the atlas. Band groups counts assigned groups (of ${GROUPS.length}).</p></div>
  <div class="scroll"><table><thead><tr><th>Country</th><th>Coverage</th><th class="n">MNOs</th><th class="n">Band groups</th><th>mmWave assigned</th><th class="n">Checked</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}
