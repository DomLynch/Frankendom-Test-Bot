# Recovery / charge repair — 5 October 2026

Two bot defects corrected and browser acceptance verified. Game engine, balance, controls, camera and live deployment are unchanged. Bot Dev owns implementation; Bot Combat ran the frozen browser commands and independently reported receipts. Root independently recounted every browser `AttackStarted` event. No separate source reviewer or GitHub CI is configured; do not mistake the operator's acceptance for that.

## What changed

- **Recover to a reachable stamina reserve.** The previous policy waited for 50 even when wounds capped stamina at 44 or 40. Recovery and held-worn clearing now target `min(50, visible own ceiling)`. Healthy reserve remains 50; legal action/stamina/commitment costs are unchanged. The browser reads the existing shaded stamina meter, and the engine pilot uses the equivalent own bar ceiling.
- **Match the actual authored charge-cue onset.** Enemy charge-capable `Charging` produces delayed `charge_foe`; own `Charged` produces `charge`. Enemy completion and held lights do not generate another charge signal. Enemy cues cannot release our held heavy. This is a **simulated semantic sound signal** assuming cues are available, not listening to decoded audio or proving cue readability. Current-swing association and reaction delay remain.
- Research runs label themselves experimental. One canonical default remains `./run-latest.sh`; older policies remain archived. No new dependencies or game patches.

Tested bot source `18c153776634d2e40da9ff0f46f3a1e1cb1125f1`, content digest `b1b17125a913239bb83f84651e4ef4105524fab6cbb18581b37c6c029e9dc6e3`; frozen engine/assets `4056467af826b03166a575002f7a4f4b04f9dfe7`. Later documentation commits do not change the tested runner/policy. This is the pinned October 5 game, not proof of any later live revision.

## Verification

- **102 bot tests pass** on VPS; all five new regressions fail against the old modules. Tests cover legal wounded-ceiling actions, below-ceiling/healthy reserve, held-worn clearing, visible meter precedence, exact cue mapping, delayed simultaneous own/enemy holds. Source request verified 808 files. [Test log](evidence/recovery-charge-20261005/engine-tests.log), [old failures](evidence/recovery-charge-20261005/engine-red.log), [job receipt](evidence/recovery-charge-20261005/engine-result.json).
- **54 direct-engine cases**, all actual heavy caps pass: advanced matched baseline/recovery-only/charge-only/combined, other personas, then frozen unseen seeds. They are algorithmic diagnostics, not rendered fights. [Comparison](evidence/recovery-charge-20261005/engine-comparison.json).
- **38 real rendered headless Chromium fights**, Mac Apple M5 Metal, 390×844: matched 2/2, unseen 5/6, normal-kit roster 29/30. Each raw attack mix was recounted; every fight is <=20% heavy (including heavy counters, ripostes and critical finishers), no runner errors, all inputs released, videos retained. Normal roster starts 435 / heavies 19; maximum per-fight share 15.385%. These are real keyboard inputs, with a controlled fixed-step clock and 64ms decision cadence, not native realtime/device acceptance. Advanced reaction delay 180ms, limited semantic observation.
- The research flag does not apply the win gate. Promotion is justified by independently verifying >=2/3 for **each** of ten Easy opponents, rather than `summary.passed` alone. [All seeds, raw counts, hashes and defence cases](evidence/recovery-charge-20261005/browser-recount.json).

Normal-kit roster cells: result and **heavy starts / all actual player attack starts**. Engine L6/Easy, longsword, normal launcher kit; retained seed set below. This does not establish other difficulties/weapons/PvP.

| Opponent | 731 | 1637974753 | 3024046025 |
| --- | --- | --- | --- |
| veteran | W 2/13 | W 0/19 | W 2/15 |
| pitborn | W 0/17 | W 0/17 | W 1/16 |
| goblin | W 0/8 | W 0/22 | W 0/12 |
| nightborn | W 1/13 | W 0/11 | W 1/16 |
| executioner | W 0/11 | W 0/11 | W 0/11 |
| dwarf | W 0/12 | W 0/13 | W 2/18 |
| plaguedoctor | W 1/11 | W 0/18 | W 1/11 |
| knight | L 0/12 | W 0/18 | W 0/18 |
| witch | W 1/12 | W 1/13 | W 1/13 |
| shieldmaiden | W 2/18 | W 1/18 | W 2/18 |

Targeted no-special configuration differs from normal kit: matched seed 2026100507 both won; unseen seeds 2026100521, 778372108, 4060022796 gave Goblin W/L/W and Executioner W/W/W. The Goblin loss ended 0/7 HP; normal-kit Knight731 loss ended 0/72 HP. Both full recordings and raw receipts are retained; no tuning was done after unseen results.

## What the repairs prove — and do not

**Recovery:** unseen Goblin778372108 accepted thrusts at 44-ceiling ticks 1629,1721,1809,1975 and 40-ceiling ticks2069,2162. It no longer waits for unreachable 50. It still loses: curing a stall does not cure positioning/resource choices. [Decisions, events and track](evidence/recovery-charge-20261005/goblin-wounded-trace.json).

**Charge:** matched Executioner begins actual `Charging` at477, completes `Charged`506. New roll request488 / accepted489 versus prior request509 / accepted510: 21ticks (0.35 sim seconds) earlier. Final139HP is unchanged, so this is better signal timing, not demonstrated extra survival. Existing native-audio evidence at1165 was reused only to audit cue mapping; it is not a new native-audio capture. [Before/after cue audit](evidence/recovery-charge-20261005/charge-audit-before-after.json).

**No causal win claim:** matched Goblin now wins in18.2simseconds versus the prior90-second browser timeout. Its lowest ceiling is92, so this win cannot demonstrate the44-ceiling fix. Browser timing can change exchanges despite matched seeds. In fixed-engine ablations, advanced outcomes remain Goblin2/3 and Executioner3/3 in all four variants; health changes are mixed. This repair was not selected to inflate win rate.

## Fresh player-experience learnings / proposals

1. **Teach a full wounded bar as fewer options.** In the retained Goblin loss, a thrust spent20 of a40 ceiling. The later charged overhead found the bot unable to afford its roll response, guarding instead: guard-break2253/21damage, then follow-up2302/10damage. Explain the injury ceiling and remaining escape reserve using existing coaching/HUD. This is a resource-choice failure, not proof of unfair damage or a case for buffs.
2. **Show what defence earns.** Normal roster:20 actual blocks,36 parries,24 accepted rolls;266 thrust hits and30 light/slash/riposte hits. All36 parry follow-ups hit at median0.55simseconds with no intervening damage. Ordinary blocks' next hit median2.467seconds;13 of14 recorded some damage before it. These are conditional sequences, not causal avoided-damage estimates. Teach the quick punish opportunity rather than merely rewarding defence counts. Existing nominal `avoided` fields are counterfactual estimates; use measured received damage and next-hit timestamps.
3. **Evasion is not free initiative.** Rolls with later useful hits had median2.567seconds to that hit;15/24 had no intervening damage. Some moves gain distance but delay retaliation. Record destination and next threat, teach re-entry; no roll-distance change justified. One actual `Dodged` event plus under-threat roll outcomes exist; accepted rolls alone do not prove every evasion avoided damage.
4. **The small enemy's weapon can disappear behind the player.** Fresh wounded-Goblin frames show body overlap and only parts of its knife/head. Executioner's larger curved blade remains easier to locate. Preserve current view pending matched framing experiments; evaluate close-range occlusion, not a global camera reversal. These are sampled still-frame observations, not motion comfort verdicts.
5. **Keep consequences legible.** Fresh event text explains a stop-hit and shaded WOUND bar; preserve that causal wording. Now review charged guard-break footage with debug hidden, focusing on onset, chosen defence and consequence. Semantic cue success does not establish animation/sound readability. No fresh taste rating for blood, shake or sound is claimed here.

No new kick/feint/short-step benefit is established by these repairs. The controller is still thrust dominant: real non-heavy hits and defence are present, but that is not exhaustive human-style depth.

## Watch the fresh evidence

[Matched Goblin win](evidence/recovery-charge-20261005/goblin-2026100507.mp4), [matched Executioner win](evidence/recovery-charge-20261005/executioner-2026100507.mp4), [unseen Goblin wounded-ceiling excerpt](evidence/recovery-charge-20261005/goblin-778372108.mp4). Last is midfight, not the fatal exchange; full loss remains in the local viewer. Three source recordings decoded successfully on VPS; recovered exports hash-checked. Clips are silent, with recorded wall-time playback; sample seeking is approximate, not exact tick/frame alignment or native game-speed proof.

Local viewer `http://127.0.0.1:8783/` contains all38 full recordings and JSON, paused/muted initially. It is replay of these new tests, not live gameplay. Retained originals: capture checkout `artifacts/combat/recovery-charge-20261005/browser-{matched,unseen,roster}/`. [Media receipt](evidence/recovery-charge-20261005/media-result.json), [export manifest](evidence/recovery-charge-20261005/sha256.json).

## Useful Claude feedback — next research, not accepted fixes

- Test adjacent level boundaries across weapons with differing windups, matched valid class/special bands. First reconcile the current pinned46-level rules with Dom's intended50-fight progression. Claude's reported reaction cliff is not independently reproduced by this repair.
- Verify scythe near/far contact and attack recovery before diagnosing balance; preserve opt-in known-bug baseline comparisons. Do not alter reach to accommodate this bot.
- Treat its proposed cliff patch/replay compatibility as a game-team decision; import neither the patch nor its win curves as human difficulty floors. Two-FPS images can identify overlap but cannot judge timing/feel.
- Gear tests must check intended gear effects and version compatibility. Backend verifier/security claims are outside this combat-tool repair.

Next high-value study is a bounded adjacent-level/weapon matrix and blind clean cue review, with frozen engine identity. No broad game changes or extra buttons. Sound audibility, physical-phone touch comfort, human enjoyment and continuous perception remain untested.
