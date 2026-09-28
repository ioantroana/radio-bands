# Mobile Spectrum Atlas

Who holds which mobile spectrum, band by band, in the EU-27, the G20, Australia, New Zealand, the UAE and Thailand.
Layout modelled on [mastdatabase.co.uk/gb/spectrum](https://mastdatabase.co.uk/gb/spectrum/).

## Layout

- `data/countries/<cc>.json`: one file per country; this is the source of truth. The format is in `data/SCHEMA.md`.
- `site/`: the page (`template.html`, `app.js`) and the shared logic (`core.js`: totals, ARFCN maths, validation).
- `scripts/validate.mjs`: checks for overlaps, holdings larger than the band, unknown operators, missing bands and missing sources.
- `scripts/build.mjs`: validates, then writes `dist/index.html` and `dist/spectrum.json` (all countries merged into one file).
- `scripts/render-check.mjs`: renders every country in headless Chromium at desktop and phone sizes (needs `playwright`).

To update a country, edit its JSON file and run `npm run validate && npm run build`. The page code doesn't change.

## Deploying on Vercel

Import the repository in Vercel. `vercel.json` sets the build command (`node scripts/build.mjs`) and the output
directory (`dist`), so the defaults need no changes. No npm dependencies are installed or needed to build.
The build fails on purpose if any country file has validation errors.

Deep links: `/#fr` opens France; `/#fr-notes` jumps to France's notes.

## Data licence

Seeded from [davwheat/mobile-spectrum-data](https://github.com/davwheat/mobile-spectrum-data) (LGPL-3.0) for the
countries it covers. `data/reference/` holds that snapshot and the LTE/NR band tables.
