# Verification summary (2026-09-28)

Three verifier agents that took no part in the research re-checked a sample from every country
(each country's 3.5 GHz entry, its largest band, one other band, the corporate picture) plus every
mmWave entry and every mmWave "not assigned" claim. Details: `verify-eu1.*`, `verify-eu2.*`, `verify-row.*`.

| Verdict | Checks |
|---|---:|
| Confirmed (cited source) | 203 |
| Confirmed by an independent source | 69 |
| Conflict | 20 |
| Unverifiable (source unreachable / silent) | 24 |
| **Total** | **316** |

All assigned mmWave blocks matched their regulator or a second source.

## Conflicts fixed in the data
- **Mexico:** 2.5 GHz FDD F3–F4 (2550–2570/2670–2690) was returned by Telefónica, so it is now unassigned rather than AT&T's. Movistar's residual PCS/850 holdings are removed, because it returned all of its spectrum by 2022. The Movistar sale to Melisa Acquisition (Apr 2026) is noted.
- **UAE:** 3.5 GHz (e& 3300–3600, du 3600–3800, unverified) and 26 GHz (1 GHz each in 25.5–27.5 GHz) were filled in from the verifier's sources.
- **Argentina:** 3.5 GHz edges are confirmed by ENACOM and now marked verified.
- **Czechia:** 3600–3640 MHz belongs to Vodafone (bought from PODA in 2023).
- **Cyprus:** Epic holds 2×10 MHz at 700 MHz and 100 MHz at 3.6 GHz. The 3.6 GHz amounts for Cablenet and PrimeTel conflict between sources and are noted.
- **Australia:** the Brisbane 3.5 GHz layout in the note now matches the ACMA register.
- **Corporate updates:** Vodafone now owns 100% of VodafoneThree (Jul 2026). Orange now owns 100% of MasOrange (Jun 2026). Charter closed its Cox acquisition (Aug 2026). One Hungary's ownership chain is updated. O2 Slovakia's owner is e& PPF.
- **Sweden:** the local 3.8–4.2 GHz licences are only proposed, not being assigned.

## Flagged, not changed
- The verifiers suggested raising some coverage badges (Australia, China, South Korea, Bulgaria, Sweden). Badges now follow one mechanical rule in the validator, so these stay as they are. They go up once more edges are verified.
- Ireland 40/47 GHz and Czechia 40/47 GHz: the "not assigned" status is plausible, but the cited documents don't address these bands.
- Portugal: Dense Air's former 3.5 GHz block is shown unassigned based on a draft decision.
