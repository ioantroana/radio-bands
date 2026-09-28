# Research brief for country agents

You are compiling the **current** (as of **2026-09-28**) mobile-spectrum assignments for a set of countries,
for a mastdatabase.co.uk-style spectrum atlas. Read `data/SCHEMA.md` first: it defines the file format,
the band groups, and the verification standard. You write **only** `data/countries/<cc>.json` for your
countries, and nothing else in the repo. **Do not commit or push.**

## Method

1. **Seeds.** If `data/countries/<cc>.json` already exists it was converted from
   github.com/davwheat/mobile-spectrum-data (LGPL-3.0, last commit 2026-01-09; the country folder may be much
   older, see `data/reference/davwheat-snapshot.json`). Treat it as a starting point only: check every band for
   changes since then (auctions, renewals, re-farms, mergers, licence transfers, expiries), fix any validator
   errors, rename operators to their current brands, and add every missing band group. List what you changed
   in `changes`. Its `positions: "verified"` values were set automatically; keep `verified` only where you
   confirm the edges yourself against the regulator or two independent sources.
2. **Sources.** Use the regulator's own documents first: licence registers, auction results, assignment
   decisions, frequency usage plans. Then operator filings and reputable trade press (TeleGeography,
   Mobile World Live, PolicyTracker, Light Reading, RCR, national telecoms press). Use WebSearch/WebFetch
   (load them with ToolSearch if they are deferred) and `curl` for PDFs (use `pdftotext` if available, or
   python). Record a source URL on **every** band entry, and on blocks where it differs.
3. **Cross-check** every figure against a second source. If sources conflict, prefer the regulator and write
   the conflict in `notes`. Check the units each source uses (2×10 MHz vs "20 MHz").
4. **Every band group** in the schema table must appear. If nothing is assigned, add a `not-assigned` entry
   with a short reason ("used for broadcasting", "reserved for PPDR", "auction scheduled 2027", "not
   harmonised in this region") and a source (band plan, regulator page, or article). mmWave (26g, 40g, 47g)
   must be checked explicitly: many countries have assigned 26 GHz; some have assigned 28 GHz or 39 GHz
   (n260); a few have assigned 40 GHz/47 GHz.
5. **Corporate picture.** Reflect current operators and brands: completed mergers (e.g. VodafoneThree in
   the UK, True+dtac in Thailand, MasOrange in Spain, XLSmart in Indonesia, Fastweb+Vodafone in Italy,
   Indosat Ooredoo Hutchison, T-Mobile/Sprint and T-Mobile/UScellular in the US, Rogers/Shaw and Vidéotron
   in Canada, Oi's split in Brazil), rebrands (e.g. Telenor→Yettel, T-Mobile NL→Odido, Vodafone Hungary→One),
   and spectrum transferred as merger remedies. Check whether each deal has actually **closed** by
   2026-09-28. Announced but not yet effective changes go in a separate entry with `future` set (excluded
   from totals). Put the relevant history in the operator's `notes`.
6. **Regional licensing** (US, Canada, India, Brazil, Mexico, Russia, Australia for some bands, etc.): use
   `positions: "regional-average"` with holdings giving national or population-weighted averages and a
   `basis` string. Draw exact blocks only where the licence is truly national.
7. **Verification standard.** `verified` = regulator document or two independent sources confirm the exact
   edges. Otherwise `unverified` (edges from a single non-regulator source) or `holdings` (amounts only).
   For FDD bands, check each operator's amounts add up to no more than the band and that nothing overlaps.
8. **Honesty.** Never fill a gap from memory without saying so: if a figure comes from your background
   knowledge and you could not find a source, either leave it out or include it with the note
   "from background knowledge, not source-verified" and add it to `missing`. Put everything you could not
   compile in `missing`.
9. **Extra detail** where available: EARFCN/NR-ARFCN of known carriers (from reputable crowd-sourced
   sites such as cellmapper wiki, mastdatabase, or national enthusiast sites), licence expiry dates, and
   notes (auction year, price, obligations). Carrier ARFCNs are nice to have; don't spend long on them.
10. **Validate**: run `node scripts/validate.mjs <cc>` until it reports **0 errors**; read the warnings
    and fix the meaningful ones. Also sanity-check the printed totals against any published totals
    (e.g. the regulator's or an analyst's "MHz per operator" table).
11. Set `coverage` honestly (see SCHEMA.md) and `asOf` to `2026-09-28`. Fill `summary`, `sources`
    (country-level list with titles), `notes`, `missing`.

Operator colours: use the operator's brand colour, 6-digit hex. Make adjacent operators in the same country
visually distinguishable (e.g. don't give two operators near-identical reds).

## Your final message

Reply with a short report per country (≤ 200 words each): coverage badge; bands verified vs holdings-only;
key changes since the seed / notable events (mergers, auctions); conflicts between sources and how you
resolved them; what is missing and why; and the validator's final line. This report is used for the
delivery summary, so be factual and specific.
