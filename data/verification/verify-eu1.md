# verify-eu1: verification summary

Verifier: verify-eu1. Checked on 2026-09-28. Countries: gb, ie, de, at, dk, fi, ee, lv, lt, pl, hu, bg, ro, it, pt, ru.
There are 123 findings in `verify-eu1.json`. No country files were edited.

Access notes:
- **Blocked sites.** ofcom.org.uk and anacom.pt returned 403 or 503. For Ofcom, I read the text of its mmWave press release on wired-gov.net instead.
- **Images read by eye.** For RTR (AT), BNetzA (DE), CRC (BG) and ANCOM (RO), the band charts are images. I rendered them and read the edges directly.
- **Unreadable PDFs.** The AGCOM decisions (IT) are scanned PDFs with no text layer. No OCR tool was available, so I could not read their text.

## Counts by verdict

| cc | confirmed | confirmed-independent | conflict | unverifiable |
|----|----------:|----------------------:|---------:|-------------:|
| gb | 10 | 1 | **1** | 0 |
| ie | 6 | 0 | 0 | 2 |
| de | 8 | 0 | 0 | 0 |
| at | 10 | 0 | 0 | 0 |
| dk | 8 | 0 | 0 | 1 |
| fi | 8 | 0 | 0 | 0 |
| ee | 4 | 1 | 0 | 0 |
| lv | 6 | 0 | 0 | 0 |
| lt | 7 | 0 | 0 | 0 |
| pl | 6 | 0 | 0 | 0 |
| hu | 6 | 0 | **1** | 0 |
| bg | 7 | 0 | 0 | 1 |
| ro | 6 | 1 | 0 | 1 |
| it | 5 | 3 | 0 | 0 |
| pt | 4 | 0 | 0 | 3 |
| ru | 4 | 1 | 0 | 1 |

I checked every assigned mmWave entry and found no discrepancies:
- **GB:** 26 and 40 GHz, all three operators, confirmed against Ofcom's text.
- **AT:** 26 GHz confirmed against RTR's chart.
- **BG:** 26 GHz confirmed against CRC figure 4, which matches the file segment by segment.
- **DK:** 26 GHz confirmed against the Digitaliseringsstyrelsen licences, including the TN-Network renaming supplements of 26 Sep 2025.
- **FI:** 26 GHz confirmed against Traficom.
- **EE:** 26 GHz holdings confirmed by Tele2 and Elisa.
- **IT:** 26 GHz confirmed against lteitaly and it.wikipedia. The AGCOM PDFs could not be read.

## Conflicts and recommended fixes

1. **gb, corporate, `vodafonethree` operator note.** The file says "Vodafone 51% / CK Hutchison 49%". Vodafone completed its buyout of CK Hutchison's 49% stake for £4.3bn on **30 Jul 2026**, and now owns 100%. Sources: vodafone.com press release of 30 Jul 2026, ISPreview of 5 May 2026, Wikipedia.
   - **Fix (notes):** "Merger of Vodafone UK and Three UK completed 31 May 2025 (initially Vodafone 51% / CK Hutchison 49%). Vodafone bought out CK Hutchison's 49% for £4.3bn, completed 30 Jul 2026, and now owns 100%. Licences remain in the names of Vodafone Ltd, Hutchison 3G UK Ltd and UK Broadband Ltd; …" Keep the rest of the note unchanged.
   - **Summary:** optionally add "(wholly owned by Vodafone since 30 Jul 2026)".

2. **hu, corporate, `one`.** The summary says "One (ex-Vodafone, owned by 4iG/Corvinus)" and the note gives "4iG 51% / Corvinus 49%". Since a share swap in May 2025, One Magyarország Zrt. has been 100% owned by 4iG Távközlési Holding Zrt. That holding is owned 62.1% by 4iG and 37.9% by Corvinus. Wikipedia now shows the parent as "4iG (100%)". Sources: Népszava, 16 May 2025; Wikipedia "One Hungary". This is minor, because Corvinus is still an indirect minority owner.
   - **Fix (note):** append "In May 2025 a share swap made 4iG Távközlési Holding Zrt. (4iG 62.1% / Corvinus 37.9%) the sole owner of One Magyarország Zrt."
   - **Summary:** change "owned by 4iG/Corvinus" to "4iG group".

## Other observations (not conflicts)

- **ie 40g / 47g.** The only cited source is ComReg 26/26, a transfer determination for 2.3 GHz (BCP IV to Eir). It does not mention 40/42 or 47 GHz. The not-assigned status is plausible, but it needs a source that says so, such as ComReg's Radio Spectrum Management Operating Plan 2025–2028.
- **ie 3500.** Amounts match ComReg 17/38 and 26/26 in both rural and city regions. The exact edges rely on ComReg's June 2026 .bmp graphic, which returned a firewall page. They are consistent with ComReg's transition page, which lists Vodafone lots B14–B20 at 3540–3575. I could not confirm the 28 May 2026 effective date of the BCP IV to Vodafone transfer: ComReg 26/26 still called it "ongoing" in April 2026.
- **ie corporate.** Liberty Global was reported in Jan 2026 to be in talks to buy Three Ireland. I found no signed or completed deal. An optional note would help.
- **lv corporate.** The Latvian state's buy-out of Telia's LMT/Tet stakes is still pending: no decision had been made as of 10 Jul 2026. An optional note would help.
- **pt 3500.** The file draws 3440–3480 (Dense Air's 2021 auction block) as unassigned. That rests on an inference from ANACOM's draft of 24 Mar 2026. I found only the January 2024 revocation of Dense Air's pre-auction licence, not a final revocation of the auction block. Consider drawing it as Dense Air with a note, or keep it and flag it explicitly as an assumption.
- **pt 26g.** A search snippet of ANACOM's FPA consultation report says 26 GHz is "destinada para uso privativo local (ANA e Bosch)". So there may be local 26 GHz licences. ANACOM itself was unreachable.
- **ro corporate.** Vodafone's release announcing completion of the TKRM split is dated 1 Oct 2025. The file's 30 Sep 2025 closing date is not contradicted.
- **ru 4900.** The 4.63–4.99 GHz allocation (GKRCh, 31 Aug 2026) and the 11 Sep 2026 launch are confirmed by separate MTS and T2 releases. The 90 MHz per operator comes from Wikipedia only.
- **ee 26g.** Tele2 publishes its block as 24.7–25.5 GHz. That one entry could be drawn as an `unverified` block instead of a holding.
- **dk 26g.** 24.25–24.65 GHz is still unsourced, as the file already says. It is consistent by elimination, because the lowest licence starts at 24.65 GHz.
- **Schema consistency (cosmetic).** Many `not-assigned` entries set `"positions": "holdings"` (fi, ee, lv, lt, pl, hu, bg, ro, ru) or omit `positions` (it, pt, ru). Other countries use `"verified"`. The validator passes all of them, so this is only a style difference.

## Coverage badges

All 16 badges are consistent with SCHEMA.md:
- gb, de, lt, hu and it are `positions-verified`, each with a few unverified or holdings entries.
- ie, at, dk, fi, lv and pl are `block-level`, and all their assigned bands are verified.
- ee, bg and ro are `holdings-only`.
- pt and ru are `partial`.

The bg badge is borderline. Its 700, 800, 900 and 26 GHz entries are regulator-verified, while 1800, 2100, 2600 and 3500 are `unverified` rather than holdings. It could arguably be `positions-verified`, but `holdings-only` is defensible.
