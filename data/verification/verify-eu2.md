# verify-eu2: verification summary

Verifier: verify-eu2. Countries: fr, be, nl, lu, es, se, mt, cy, cz, sk, si, hr, gr, tr. Checked on 2026-09-28.
The full record is in `verify-eu2.json` (106 checks). No country files were edited.

Method: I read regulator documents first: Arcep charts, BIPT decisions, Staatscourant licences, the ILR rights list, the Spanish RPC register (queried live for every 3.5 GHz and 26 GHz concession), PTS, MCA licence annexes, the DEC register, ČTÚ, RÚ decisions and auction results, the AKOS strategy figure and auction results, the HAKOM database, EETT and BTK.
spectrum-tracker.com was the independent cross-check. I decoded its operator colour classes to get per-operator edges.
For corporate checks I used Wikipedia, trade press and group releases.

## Counts by verdict

| cc | confirmed | confirmed-independent | conflict | unverifiable |
|----|---:|---:|---:|---:|
| fr | 2 | 5 | 0 | 0 |
| be | 3 | 2 | 0 | 2 |
| nl | 1 | 4 | 0 | 2 |
| lu | 3 | 4 | 0 | 0 |
| es | 3 | 3 | 1 | 1 |
| se | 6 | 0 | 2 | 1 |
| mt | 3 | 3 | 0 | 1 |
| cy | 4 | 3 | 3 | 0 |
| cz | 2 | 3 | 2 | 2 |
| sk | 3 | 2 | 0 | 2 |
| si | 3 | 4 | 0 | 0 |
| hr | 4 | 3 | 0 | 0 |
| gr | 4 | 2 | 0 | 0 |
| tr | 5 | 3 | 0 | 0 |

Most `unverifiable` rows are 40 GHz and 47 GHz "not-assigned" claims. No source states the status either way, and nothing contradicts it.

## Conflicts and recommended fixes

1. **cz, 3500: PODA's 3600–3640 MHz now belongs to Vodafone.** Vodafone bought it from PODA in early 2023. Three sources say so:
   - Lupa.cz, "Vodafone koupil od firmy PODA … 3600 až 3640 MHz". The file's own cited Lupa article of 10 Jul 2023 also says PODA gave up its 40 MHz and Vodafone took it.
   - gsmweb.cz marks the block "dříve PODA" (formerly PODA).
   - spectrum-tracker shows Vodafone at 3540–3640.

   Fix: change the block `{op:"poda", f:[3600,3640]}` to `op:"vodafone"` (note "bought from PODA, 2023"). Vodafone then has 100 MHz (3540–3640). Remove the `poda` operator.
2. **cy, 700 MHz, Epic: claimed 2×5, found 2×10.** Operator Watch says "Cyta and Epic acquired a 2×10 MHz block in the 700 MHz". spectrum-tracker has Epic at 703–713/758–768. All 2×30 MHz was sold. Fix: set `epic` `mhz: 10`. The 700 MHz totals then become 10/10/5/5.
3. **cy, 3.6 GHz, Epic: claimed 50, found 100 MHz.** Operator Watch and spectrum-tracker (3700–3800) both give 100 MHz. Fix: set `epic` `mhz: 100`.
4. **cy, 3.6 GHz, Cablenet and PrimeTel (unresolved).** Operator Watch gives 50 MHz each. spectrum-tracker gives 100 MHz each. Cyprus Profile says all 460 MHz was sold, which would mean 100 MHz each. I found no regulator result. Fix: keep 50 MHz, but add a note giving the conflicting 100 MHz figure. This is a candidate for a follow-up with DEC.
5. **es, corporate, MasOrange: no longer a joint venture.** Orange completed the purchase of the remaining 50% from Lorca (KKR, Cinven, Providence) on 8 Jun 2026, for about EUR 4.25–4.3bn. The EC cleared it on 10 Apr 2026. Sources: es.wikipedia MasOrange; The Objective, 8 Jun 2026. Fix: MasOrange note → "Orange Espagne and MásMóvil merged in Mar 2024 as a 50/50 JV; 100% owned by Orange since 8 Jun 2026."
6. **se, note on 3.8–4.2 GHz local licences: overstated.** PTS *proposes* opening 3800–3920 and 3990–4130 MHz for local licences from 1 Oct 2026, and sent the proposal for comment in mid-Aug 2026. Fix: reword to "PTS proposes (remiss, Aug 2026) to …".
7. **se, badge (low priority).** The badge is `partial`, but 9 of 11 current entries are `holdings`. `holdings-only` fits better, unless the unknown 1900–1920 MHz block is meant to force `partial`.

## Regulator vs spectrum-tracker disagreements (file already correct)

In each case the file follows the regulator and needs no change:
- **es, 26 GHz:** spectrum-tracker's MasOrange/Vodafone/Movistar layout does not match the RPC. The RPC has only 8 concessions: Globe 24.9–25.1 (Castilla y León), Telefónica 25.7–26.7, Orange 26.7–27.1, and no Vodafone. The missing reference numbers DGZZ-2300325 to 328 fit Vodafone's concessions having been cancelled.
- **se, 1800 MHz:** spectrum-tracker gives Net4Mobility 2×30; PTS says 2×35.
- **lu, 3500:** spectrum-tracker shows LOL at 3530–3540; the ILR list does not. The ILR list also has an apparent typo for Proximus at 1800 MHz ("1849,9–1864,9").
- **sk, 3500:** spectrum-tracker shows 4ka from 3410, which predates the 2025 rearrangement.
- **cz, 3500:** spectrum-tracker still shows Nordic Telecom at 3700–3800.

## Other notes

- **sk, O2 corporate note:** the e& note is correct. e& took control of PPF Telecom's Bulgarian, Hungarian, Serbian and Slovak units in 2024, and the group is now "e& PPF Telecom Group". Drop the "background knowledge, not source-verified" caveat.
- **cz, 40 GHz and 47 GHz sources:** the cited ČTÚ document of 13 Aug 2026 covers only 800, 1800 and 2600 MHz. It does not support the mmWave claims. Cite PVRS or say the claim is unverified.
- **cz, 26 GHz dates:** "opened 1 Jul 2026" and "national award ~2032" were not confirmed. The cited press release is from Aug 2020. PVRS-2 does confirm 26.5–27.3 GHz for mobile or campus use.
- **Optional upgrades:** spectrum-tracker gives edges for se 3.5 GHz (Tre 3400–3500, Telia 3500–3620, N4M 3620–3720), tr 3.5 GHz (TT 3460–3580, VF 3580–3660, Turkcell 3660–3800) and cy 1800. These could be drawn as `unverified` blocks instead of `holdings`.
- **Every checked mmWave assignment matches the regulator exactly:** es 26 GHz (RPC), si 26 GHz (AKOS), hr 26 GHz (HAKOM), gr 26 GHz (EETT).
