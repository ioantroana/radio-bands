# verify-row: verification summary (2026-09-28)

Independent re-check of 16 countries: us, ca, mx, br, ar, cn, in, jp, kr, id, th, au, nz, sa, ae, za.
87 findings in `verify-row.json`. No country file was edited.

Main regulator datasets read directly:
- FCC CMR 2024 (FCC 24-136), Figs. II.B.14 and II.B.16
- IFT-10 Bases, Tabla 9
- Anatel `Autorizacoes_Licenciamento_SMP.zip`, ATOS_SMP.csv, 28 Sep 2026
- TRAI CP 30.09.2025, Tables 2.7 and 2.8
- MIC 26 GHz auction results and the 2019 5G assignment notice
- ACMA RRL spectrum-licence dump, 29 Sep 2026
- ICASA auction results, 2022
- CST auction results, 2024
- ISED mmWave key dates
- Rogers and TELUS 2025 annual reports

## Counts by verdict

| cc | confirmed | confirmed-independent | conflict | unverifiable |
|----|---:|---:|---:|---:|
| us | 10 | 4 | 1 | 0 |
| ca | 7 | 0 | 0 | 0 |
| mx | 4 | 0 | 3 | 1 |
| br | 4 | 3 | 0 | 0 |
| ar | 1 | 2 | 0 | 0 |
| cn | 2 | 3 | 1 | 0 |
| in | 3 | 0 | 0 | 1 |
| jp | 5 | 0 | 0 | 0 |
| kr | 1 | 2 | 1 | 0 |
| id | 1 | 3 | 0 | 0 |
| th | 2 | 2 | 0 | 0 |
| au | 4 | 0 | 2 | 0 |
| nz | 2 | 1 | 0 | 0 |
| sa | 1 | 0 | 0 | 2 |
| ae | 1 | 0 | 2 | 0 |
| za | 4 | 1 | 0 | 0 |

## mmWave checks

- **us:** All five bands (24, 28, Upper 37, 39 and 47 GHz) match CMR Fig. II.B.16 exactly. The Array→T-Mobile 24 GHz transfer is also confirmed.
- **au:** The 26 GHz edges match the ACMA register exactly: TPG 25.1–25.7, Telstra 25.7–26.7, Optus 26.7–27.5 GHz.
- **br:** Anatel's acts confirm every 26 GHz edge. Teleco's lot table confirms Algar at 1000 MHz. Teleco's summary page says 800 MHz, but it is wrong.
- **in:** The 26 GHz holdings add up to TRAI's 62,800 MHz assigned. Whether the Adani→Airtel transfer has closed could not be established.
- **jp:** MIC confirms both 26 GHz lots and the prices (docomo 25.8–26.2 GHz, JPY 6.288bn). The 28 GHz edges match the MIC 2019 notice.
- **th:** 26 GHz amounts confirmed: AIS 12, True+dtac 10 and NT 4 blocks of 100 MHz.
- **kr:** The 28 GHz revocations and the Stage X cancellation (31 Jul 2024) are confirmed.
- **cn:** 26 GHz has trial frequencies only (Jan 2025). The "not assigned" status is confirmed.

## Regional-average basis

Every holding in us, ca, br, in and mx has a `basis`. The published figures match:
- **in:** TRAI's totals (7,030 and 62,800 MHz) equal the sums of the holdings exactly.
- **us:** The CMR pop-weighted figures are reproduced.
- **ca:** Rogers' "combined 100 MHz across 3500 and 3800 MHz" matches 57.9 + 42.0. TELUS reports a 270 MHz national average; the file has 247.5 MHz, and the gap is the AWS-4 and WCS holdings the file does not quantify.
- **mx:** IFT Tabla 9 is reproduced.

## Conflicts and recommended fixes

1. **mx, 2.5 GHz FDD.** The AT&T block 2670–2690/2550–2570 (IFT-7 F3–F4) is not AT&T's.
   - Telefónica returned "40 MHz nacionales de la banda de 2.5 GHz" to the IFT (DPL News, 2022).
   - IFT's figure of 80 MHz for AT&T equals F1–F2 (2×20) plus TDD T1–T2 (40).
   - **Fix:** set that block to `op: "unassigned"` with the note "F3–F4 won by Telefónica 2018, returned by 2022; offered in the cancelled IFT-12". AT&T's 2.5 GHz total becomes 80 MHz.
2. **mx, Movistar PCS and 850 MHz.** Telefónica returned "100% del espectro" by 2022.
   - **Fix:** remove `movistar` 21.66×2 from 1900 and 0.47×2 from 850. The PCS total drops 103.8 → 60.5 MHz and the 850 total 39.4 → 38.5 MHz.
   - Change the movistar `kind` to `other` (MVNO on AT&T).
3. **mx, corporate.** Telefónica sold Movistar México to Melisa Acquisition (OXIO and Newfoundland Capital), announced 8 Apr 2026, for ~US$450m.
   - **Fix:** add this to `movistar.notes`. The closing date is not confirmed.
4. **us, corporate.** Charter closed its Cox acquisition on 2026-08-19. The combined company will take the Cox Communications name, and the Spectrum brand stays.
   - **Fix:** replace "Merger with Cox announced 2025" in `charter.notes`.
5. **au, 3.5 GHz note (Brisbane).** The ACMA register gives Optus 3475–3542.5, Telstra 3542.5–3605 + 3725–3800, TPG 3605–3665 + 3700–3725, and Dense Air 3665–3700.
   - **Fix:** replace the Brisbane sentence in the note. Totals are not affected.
6. **ae, 3.5 GHz.** The file has "unknown". The CMS Expert Guide gives e& 3300–3600 (300 MHz) and du 3600–3800 (200 MHz).
   - **Fix:** set `assigned`, `positions: "unverified"`, with blocks `eand` [3300, 3600] and `du` [3600, 3800]. Only one non-regulator source supports this.
   - CMS also gives n41: du 2496–2596, e& 2596–2690.
7. **ae, 26 GHz.** The file has "unknown". TRA (via Gulf News, Sep 2020) announced "1 GHz per operator in 25.5–27.5 GHz" from Q3 2021, and the CMS guide confirms it.
   - **Fix:** set `assigned`, `positions: "holdings"`, with holdings `eand` 1000 and `du` 1000, basis `exact`.
8. **Badge mismatches (minor).**
   - `cn` and `kr` are `holdings-only`, but almost all their entries are block entries, mostly `unverified`.
   - `au` is `holdings-only`, but it has many ACMA-verified blocks. `positions-verified` fits better.
   - For cn and kr, either verify the edges and upgrade, or keep the badge and add a note.

## Other recommended updates (not conflicts)

- **ar, 3.5 GHz.** ENACOM states the lots: Claro Lote 1 3300–3400, Telecom Lote 2 3400–3500, TMA Lote 3B 3550–3600, and one 50 MHz block unsold.
  - Upgrade `positions` to `verified` and drop "by elimination" and "not verified".
- **br, 700 MHz.** Teletime (16 Sep 2026) reports an injunction that could change the result of the May 2026 auction. Add this as a note.
- **th, 3.5 GHz.** NBTC now targets an advance auction of 2100–3500 MHz in Q4 2026–Q1 2027. Update the note.
- **sa, 3.5 GHz 2019.** Zain KSA's Q1-2019 statements, as quoted in the search index, say Zain acquired 100 MHz of 3.5 GHz on 17 Mar 2019 (SR 624m). I could not open the PDF.
  - If it is confirmed, add holding `zain` 100 MHz.
- **in, 26 GHz.** The Adani→Airtel transfer of 400 MHz was agreed in Apr 2025, subject to DoT approval. Completion is unverified.
- **kr.** MSIT will re-allocate all 370 MHz of 3G/LTE spectrum expiring in 2026 to the incumbents. Consider adding this as a note.
