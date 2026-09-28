# Spectrum atlas data schema

Each country's data is kept in its own file, `data/countries/<cc>.json` (ISO 3166-1 alpha-2, lower case).
`node scripts/build.mjs` merges them into a single `site/spectrum.json`, which the page reads.
`node scripts/validate.mjs [cc ...]` checks the files. Every file must pass with **0 errors**.

All frequencies are in **MHz** and use decimals, e.g. `3410.0`, `26500`.

## Country file

```jsonc
{
  "code": "fr",                    // lower-case ISO code, same as the filename
  "name": "France",
  "region": "Europe",              // Europe | Asia-Pacific | Americas | Middle East & Africa
  "asOf": "2026-09-28",            // date this file was last checked against sources
  "coverage": "block-level",       // see "Coverage badges" below
  "licensing": "national",         // national | regional | mixed. Explain regional licensing in "notes".
  "summary": "One or two sentences about the market.",
  "operators": [
    {
      "id": "orange",              // short id, lowercase, [a-z0-9-]
      "name": "Orange",            // display name (current brand)
      "legal": "Orange SA",        // licensee legal name (optional)
      "color": "#ff7900",          // brand colour, 6-digit hex
      "aliases": ["Orange France"],
      "kind": "mno",               // mno | regional | private | government | other
      "notes": "Formerly ..., merged with ... on YYYY-MM-DD" // optional
    }
  ],
  "bands": [ /* see "Band entries" */ ],
  "notes": ["Free-text notes for the Notes section (conflicts, caveats, merger remedies)."],
  "missing": ["Anything not compiled or unverified, e.g. '26 GHz: block positions not published'."],
  "changes": ["Changes applied since the davwheat dataset (only for countries seeded from it)."],
  "sources": [ { "title": "ARCEP – Observatoire des fréquences", "url": "https://..." } ]
}
```

## Band groups

Every country must have **at least one entry for every required group**, even when nothing is
assigned (then use `"status": "not-assigned"` with a note saying why, e.g. "used for DTT",
"reserved, auction planned 2027", "band plan incompatible with B3").

| group     | covers                                                                  | required |
|-----------|-------------------------------------------------------------------------|----------|
| `450`     | 450 MHz (B31/B72/B87/B88)                                               | optional |
| `600`     | 600 MHz (B71/n71, 617–652 / 663–698)                                    | yes |
| `700`     | 700 MHz: EU/APT/US 700 FDD (B28, B12/B13/B14/B17), 700 SDL (B29, B67)   | yes |
| `800`     | 800 MHz: EU B20; Japan B18/B19/B26                                      | yes |
| `850`     | 850 MHz (B5/B26)                                                        | yes |
| `900`     | 900 MHz (B8)                                                            | yes |
| `1400`    | 1400–1500 MHz: L-band SDL (B32/B75/B76/n75/n76), Japan 1.5 GHz (B11/B21), 1.4 GHz TDD | yes |
| `1700`    | AWS 1.7/2.1 GHz (B4/B66/B70, AWS-3), Japan 1.7 GHz (B3 subset/B9), 1.7 GHz TDD | yes |
| `1800`    | 1800 MHz (B3)                                                           | yes |
| `1900`    | PCS 1900 (B2/B25), 2 GHz AWS-4/B23/n70, 1.9 GHz US H-block              | yes |
| `2000tdd` | 1900/2000 MHz unpaired TDD (B33/B34/B39)                                | yes |
| `2100`    | 2100 MHz (B1)                                                           | yes |
| `2300`    | 2300 MHz (B40, US WCS B30)                                              | yes |
| `2600`    | 2500/2600 MHz FDD+TDD (B7, B38, B41, n41)                               | yes |
| `3500`    | 3.3–4.2 GHz (B42/B43/B48, n77/n78, CBRS, C-band, 3.45 GHz)              | yes |
| `4900`    | 4.4–5.0 GHz (n79)                                                       | yes |
| `26g`     | 24.25–29.5 GHz (n257/n258/n261)                                         | yes |
| `40g`     | 37–43.5 GHz (n259/n260)                                                 | yes |
| `47g`     | 47.2–48.2 GHz (n262)                                                    | yes |
| `6g`      | 6 GHz (6425–7125, n104)                                                 | optional |
| `other`   | anything else carrying IMT licences (e.g. 2 GHz MSS/CGC, 1.5 GHz TDD)   | optional |

A group can have several entries: e.g. `2600` FDD and `2600` TDD as two diagrams, or a
future-dated variant of `2100`.

## Band entries

```jsonc
{
  "group": "700",
  "label": "700 MHz FDD",          // diagram title
  "names": ["B28", "n28"],         // 3GPP bands used
  "status": "assigned",            // assigned | partially-assigned | not-assigned | unknown
  "duplex": "fdd",                 // fdd | tdd | sdl | mixed
  "range": { "dl": [758, 788], "ul": [703, 733] },   // FDD: band edges drawn in the diagram
  //  or "range": { "f": [3400, 3800] }              // TDD/SDL
  "positions": "verified",         // verified | unverified | holdings | regional-average
  "future": null,                  // or { "from": "2027-01-01", "label": "from 1 Jan 2027" }
  "excludeFromTotal": false,       // true for future / alternative views (future ⇒ always excluded)
  "note": "Paired with ...",       // shown under the diagram
  "sources": ["https://regulator.example/decision.pdf"],   // REQUIRED for every band entry, ≥1
  "blocks": [ /* for verified / unverified */ ],
  "holdings": [ /* for holdings / regional-average */ ]
}
```

### `positions` — verification standard

* `verified` — exact block edges confirmed by the **regulator** or by **two independent sources**.
  Drawn with a solid outline.
* `unverified` — edges are known from one non-regulator source only. Drawn dashed with a
  "positions not verified" tag.
* `holdings` — only the amount each operator holds is known. Use `holdings`, not `blocks`. The
  page draws correctly sized dashed blocks side by side with a "positions not verified" tag.
* `regional-average` — licences are regional (US, CA, IN, BR, MX, RU, some AU bands).
  Use `holdings` with national or population-weighted averages and set `"basis"` on each holding
  (e.g. `"pop-weighted average"`, `"national average across 22 LSAs"`, `"licensed in most
  metros"`). Totals include these averages and are labelled as such.

For a `not-assigned` entry, give `range` when a band plan exists, leave `blocks`/`holdings` empty and
say why in `note`. `sources` is still required (a regulator page/band plan or trade-press article).

### Blocks (exact positions)

```jsonc
{
  "op": "orange",                  // operator id from "operators"
  "dl": [758, 768], "ul": [703, 713],   // FDD (downlink and uplink edges)
  //  or "f": [3490, 3570]         // TDD / SDL
  "earfcn": [9360],                // optional, known LTE carriers
  "nrarfcn": [152690],             // optional, known NR carriers
  "expiry": "2035-12-08",          // optional, ISO date or year
  "notes": "Won in 2015 auction",  // optional
  "source": "https://..."          // optional if same as band-level sources
}
```

Use `"op": "unassigned"` for spare/unsold spectrum you want drawn as a grey gap; use
`"op": "guard"` for guard bands. Neither counts towards anyone's totals.

### Holdings (no exact positions)

```jsonc
{
  "op": "orange",
  "mhz": 10,          // PER DIRECTION for FDD (2×10 MHz ⇒ 10), total for TDD/SDL
  "paired": true,     // true for FDD
  "basis": "exact",   // exact | pop-weighted average | national average | ... (free text)
  "expiry": "2030",
  "notes": "...",
  "source": "https://..."
}
```

**Units:** sources differ ("2×10 MHz" vs "20 MHz"). `mhz` is always *per direction* for paired
spectrum. Totals on the page count paired spectrum as both directions (2×10 ⇒ 20 MHz), following
Ofcom / mastdatabase convention.

## Coverage badges

* `block-level` — every assigned band has `verified` blocks.
* `positions-verified` — most bands have verified blocks; a few are `unverified`/`holdings`.
* `holdings-only` — amounts per operator known, positions mostly not.
* `partial` — some required bands could not be compiled (list them in `missing`).
* `not-compiled` — no usable data.

The validator enforces these with a mechanical rule: `block-level` needs every band counted in the totals
to be `verified`; `positions-verified` needs at least 60 %; any required band whose only entry has status
`unknown` makes the country `partial`. A file may claim a lower badge than the rule allows, never a higher one.

## Rules

* Every band entry needs a source URL. Regulator documents first, then trade press.
* Cross-check every figure against a second source; if two sources conflict, prefer the regulator
  and record the conflict in `notes`.
* Never fill a gap from memory without saying so in `notes`/`missing`.
* FDD: each operator's blocks in a band must not overlap and must fit inside `range`.
* Future-dated changes (announced but not yet effective on `asOf`) go in a separate entry with
  `future` set; they are excluded from totals.
