# Combat bug register — 5 October 2026

Purpose: produce fast, reproducible lessons for improving **game mechanics and player experience**, not maximize the bot's win rate. Claude owns game fixes. Engine tested: `4056467af826b03166a575002f7a4f4b04f9dfe7`. Keep failures, accepted actions and matching settings with every proposal.

## COMBAT-001 — abrupt difficulty changes at weapon read thresholds

**Status:** owner-reported game bug; small single-tactic reproduction retained. Claude's broader cross-weapon/level claims remain external evidence, not independently proven by our browser runs.

**Reproduction:** Veteran, standard longsword, no specials, light-spam engine diagnostic. Matched seeds918273645,274629183,3901284756: L11 wins2/3; L12 wins0/3. The temporary faster-thrust controller leaves L11 unchanged and wins1/3 atL12. This is partial progress, not a fix or a new browser pass rate.

**Temporary bot treatment:** where enemy reaction is shorter than the player's cut wind-up, and an authored thrust is faster than that reaction, substitute an in-range thrust for a cut. No changes to enemy reaction, level, damage, health, reach or simulation rules. A perfect-state heuristic, not human perception. It does not handle every anticipation/tell/lapse interaction.

**Dev investigation:** compare levels11/12 for the same kit and seeds; inspect when the enemy first notices and defends each cut. Repeat around reported thresholds9/10,13/14,21/22 for relevant weapons; Nightborn/PlagueDoctor5/6 separately. Test multiple player policies, with appropriate specials in normal balance tests. Preserve saved-fight/replay compatibility; do not exempt failing replay checks to land a ramp.

## COMBAT-002 — scythe spacing / dead-band experience

**Status:** owner-reported spacing issue; contribution from bot positioning vs game/visual contact remains unresolved. The authored cut has minReach1.4m and reach2.1m. Those values alone do not demonstrate a defect.

**Reproduction:** same Veteran/seeds, player scythe. Existing controller wins3/3 atL1 but0/3 atL12. Temporary spacing plus faster-attack controller wins3/3 at both levels. L1 opponent damage received changes140/83/113→0/0/0; atL12 it changes161/151/155→48/118/45. Scythe can land damaging hits in these engine cases; the blanket “cannot win at any level” claim does not reproduce with our controller.

**Temporary bot treatment:** do not start cuts inside minReach plus a0.15m margin; approach when outside reach minus0.1m. Use existing movement and moves, holding guard during repositioning; this passive defence is part of the artificial policy. L12 gains combine spacing and attack selection, so they cannot isolate which game change would help.

**Dev investigation:** review rendered normal-speed blade contact, target distance and player step-in together. Can players recognise the scythe's dead band and recover sensible spacing? Check contact/animation agreement before proposing reach/damage changes. AI exact-distance success does not prove readable player feedback.

## Temporary use and removal

The workaround is **opt-in direct-engine test tooling**, not a game fix or the normal browser bot. Each invocation automatically saves a no-workaround fight with identical initial setup/seed, then its variant. Neither is eligible for diverse-browser acceptance.

```sh
./run-sim.sh --sparring-url='/?spar=1&opponent=veteran&difficulty=12&weapon=scythe&skill=none&special=none&yourSpecial=none' --workaround=known-combat-bugs --seed=3901284756 --fights=1
```

For the longsword case change `weapon=scythe` to `weapon=longsword`. Omit the flag for normal diagnostics. `special=none` explicitly isolates ordinary moves; it is not a representative progression-balance verdict. When testing specials, use the actual Start sparring URL and level-appropriate bands.

All intervention counts are **decision ticks**, not accepted attack counts. Receipts retain raw intents/events and label `temporaryWorkaround.experimental=true`, `acceptanceEligible=false`. See [paired evidence/hashes](temporary-workaround-20261005.json).66 tests pass on the VPS. These12 paired cases are pure production-engine simulation, not a fresh rendered or phone test. Identical initial seeds do not guarantee identical opponent decisions after player inputs diverge.

**Rejected:** a broader defensive prototype caused three scytheL1 wins to become losses and threeL12 timeouts. It is retained locally, never selected by the launcher. First test-stage attempt failed from a missing staged pin-ref file; after correcting staging, tests and paired runs passed. No product failure was relabelled as success.

**Remove after Claude's fix:** update the explicit game pin, replay these original cases without the flag, verify visual contact and revalidate affected browser settings. Then retire the helper/flag. Do not silently promote workaround wins into game-balance or human-experience evidence. The normal browser launcher/policy and its prior30-case acceptance remain unchanged.

## Other current coverage limits

- Limited observation omits special tell events: a bot tooling gap, not evidence that players cannot see specials.
- Accepted kicks and offensive feint benefits remain unproven: coverage gaps, not grounds for buffs.
- Silent controlled-clock recordings do not establish sound, real-time input feel or physical-phone comfort.
