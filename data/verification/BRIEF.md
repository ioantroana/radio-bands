# Verification brief

You are an independent verifier. You did not do the research. Your job is to re-check a sample of
figures in `data/countries/<cc>.json` against sources, and report. **Do not edit any country file**,
and do not commit.

For each of your countries, check:
1. **Every assigned mmWave entry** (groups `26g`, `40g`, `47g`), and each mmWave `not-assigned` claim.
2. The **3.5 GHz** (`3500` group) entry.
3. **Two more** current assigned entries: the one contributing most MHz to the country's totals, and one other.
4. The **corporate picture**: that operator names/mergers are current as of 2026-09-28.

For each checked figure (an operator's block edges or holding amount, or a band's status):
- Open the source URL(s) the file cites, and where possible one **independent** source (a different
  organisation: regulator vs trade press vs operator filing). Use WebFetch / curl (use pdftotext or
  python for PDFs). WebSearch may be unavailable (budget exhausted); rely on direct fetches of
  regulator sites, operator investor pages, Wikipedia and its cited references, spectrum-tracker.com etc.
- Record the result. Verdicts:
  - `confirmed`: a source you read states the same figure (say which).
  - `confirmed-independent`: confirmed by a source other than the one(s) cited in the file.
  - `conflict`: a source states something different (give both values and which source you'd prefer; the regulator wins).
  - `unverifiable`: you could not reach or find a source that states it.
- Also check the badge in the file (`coverage`) and each entry's `positions` against the standard in
  `data/SCHEMA.md` (verified = regulator or two independent sources).

Keep scratch work in your own subfolder of the scratchpad; don't touch other agents' files.

Write your findings to `data/verification/<your-id>.json` as an array of
`{ "country", "band", "operator", "field", "claimed", "found", "verdict", "sources": [urls], "note" }`
and a short `data/verification/<your-id>.md` summary: per country, counts by verdict and every conflict
spelled out with a recommended fix (exact values). Your final message should repeat the conflicts and
recommended fixes.
