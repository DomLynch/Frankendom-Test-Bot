# Input, acceptance and consequence — 6 October 2026

The native AV path now records actual trusted browser keydown/keyup receipts and combat-event dispatch timestamps. Retrospective analysis links compatible keys to accepted player actions and their recorded attack results. This helps distinguish missing action, accepted-but-missed attack and accepted-but-interrupted attack. It does not measure physical input-to-photon latency or phone comfort.

Implementation: `scripts/lib/audio-review.mjs`, `scripts/lib/input-action-metrics.mjs`, `scripts/lib/live-av.mjs`; regression checks: `tests/input-action-metrics.test.mjs`. No game changes or policy tuning. Native research still uses delayed semantic observations, not AI vision or hearing.

## Fresh native browser evidence

Frozen bot7998cccc655e79702b0d05216da1ce0fff5b74dc; game6fb21b3437a6e794e47dc5a91141b67df7d69162. Veteran, EasyL6, longsword, no specials, limited observation. Same initial seed for the638 pair; profiles produce different trajectories.

| Case | Result | Actual starts / heavy | Requests / accepted actions | Unmatched requests | Median receipt → dispatch |
|---|---|---|---|---|---|
| Advanced637 | Win | 12 / 2 | 22 / 22 | 0 | 3.1ms |
| Advanced638 | Win | 15 / 1 | 21 / 21 | 0 | 2.7ms |
| Beginner638 | Loss | 23 / 1 | 28 / 25 | 3 | 2.1ms |
| Advanced639 | Win | 14 / 2 | 17 / 17 | 0 | 4.9ms |
| Beginner639 | Loss | 18 / 0 | 20 / 19 | 1 | 0.5ms |
| Beginner640 | Loss | 22 / 0 | 27 / 26 | 1 | 1.25ms |
| Advanced Executioner641 | Win,6HP | 20 / 1 | 30 / 29 | 1 | 0.9ms |
| Beginner Executioner641 | Loss | 18 / 1 | 21 / 19 | 2 | 0.5ms |

Every fight meets the20% actual-heavy cap. Advanced637 had three interrupted attacks and one miss. A thrust accepted at tick931 was stagger-interrupted at940; a slash accepted at566 missed at593. Advanced638 had four interrupted attacks and one miss. Beginner638 had two interrupted attacks and nine misses. **Accepted input is not successful combat.**

For beginner638, the three unmatched requests were two roll keys and one guard/parry key. Nearest earlier native samples showed stamina20.53/84, a hurt phase with20.53/60, and stamina22.67/60 respectively; samples preceded browser key receipt by14.1ms,1.2ms and1.1ms. These contexts suggest targeted review of resource/state feedback, but are not exact refusal reasons or confirmed game bugs. The faster median in the losing beginner case is not evidence of better controls or decisions.

## Verification and limits

Root independently recomputed stored input metrics, counted actual attack starts, checked source identities, raw event equality, full-video hashes, recording frame bounds, final-tick coverage, audio track, empty errors and released inputs for both638 fights. Evidence summaries retain raw receipt and clip hashes in [the evidence folder](evidence/input-action-20261006/). Full original JSON and WebMs remain in the capture checkout under `artifacts/combat/native-live-20261006/veteran-input-{advanced,beginner}-638/`;637 is `veteran-input-637/`.

**127/127 tests passed** on this exact bot/game pair, finite CPU job [6ac52ca0fbc85ba6823b7f84](https://huggingface.co/jobs/Domlynch/6ac52ca0fbc85ba6823b7f84), independently confirmed COMPLETED. Test-log SHA256:26a042dd751baacc9ac0706877496bd90223f2b70c959b657d9b93e6ecc64764.

The750ms matcher establishes compatible temporal association, not causality. Batched event dispatch is not exact engine acceptance time. Held guard without a fresh edge has no new-command latency. Unmatched keys may be refused, buffered, superseded or outside the matcher; late requests remain censored. Historical captures without the new receipt return unavailable rather than an invented latency. Native video is canvas-only; DOM HUD feedback needs a separate browser-frame review. Actual audio is captured, but hearing quality and perceptual synchronization remain unassessed.

## Next useful additions, in order

1. **Explain unsuccessful intentions:** attach nearest earlier own-state sample and age to each request, preserving unknowns; select clean clips around repeated missing defences, misses and interruptions. Compare with what the normal HUD actually shows before proposing feedback.
2. **Blind pre-contact visual review:** hide telemetry, ask for attack direction/charge and likely defensive choice before impact, then compare to the log. Report uncertainty and recognition frequency, not a subjective quality score.
3. **Dodge recovery and target reacquisition:** measure time until enemy/weapon becomes visible and a useful follow-up becomes available; review normal-speed sequences. Horizon settling alone does not establish comfort.
4. **Feint/kick opportunity quality:** accepted action → opponent reaction → opening → useful hit or cost. No random move rotation or empty-swing padding.
5. **Audio and visual agreement:** timestamp captured impact sounds against contact/defence/effects, flag missing or overlapping cues for listening review. Semantic event labels are not AI hearing.

Current lesson for the game team: inspect whether players can distinguish an unavailable command, an out-of-range miss and an interrupted committed attack. Preserve commitment costs; these cases do not justify buffs, new buttons or easier opponents. The unseen639 pair tests recurrence without changing the policy. Candidate remains draft PR12, not full-roster accepted or promoted.

## Unseen repeats and saved own-state context

The639 pair repeated the pattern: beginner's unmatched guard/parry key had a preceding hurt sample; advanced converted two parries into30-damage hits in0.600s and0.633s. Both raw receipts and candidate matches were independently audited. No policy changes.

Bot7009a205f58ebd6ffa966a5da7e71e97febcebd0 adds `priorOwnSample` automatically beside candidate-linked actions and unmatched requests. It selects the nearest earlier recording sample, retaining timestamp, age, tick, phase, stamina/ceiling, health, stun, cooldown and buffer. Future/out-of-recording frames cannot explain an earlier command; absent state stays null and stale state keeps its age. Analysis only: no new policy information or inferred refusal reasons. Four regression cases failed before this addition, then passed; thirteen affected checks passed locally.

**131/131 tests passed** on exact7009/game6fb, [finite CPU job6ac530bc404719ba37661ffa](https://huggingface.co/jobs/Domlynch/6ac530bc404719ba37661ffa), independently COMPLETED. Test-log SHA256:98e6d546d092252af6aa9340e8dfc4e3b22e34ab0f1f52154e2496a3cc0eca01.

Fresh native beginner640 lost with ten accepted misses and one interruption. Its unmatched parry key had a4.7ms-old hurt sample with42.73 stamina,60 ceiling and54HP. **Low stamina alone is an incomplete explanation.** A successful heavy parry at1364 was followed by roll1382; next hit1516 arrived2.533s after parry, with no intervening damage. The roll had no incoming attack, and sampled separation reached3.3m. This is an opening/reset choice to review, not proof the roll was wrong. Root recomputed saved new metrics and checked raw events, source, media hashes, recording bounds, final coverage, audio, release and actual0/22 heavy starts. Original files and losses are retained; no continuous visual/hearing judgment was claimed.

The Executioner641 pair added a beginner loss and an advanced win ending at6HP. Advanced had an unmatched thrust beside a5.4ms-old hurt sample with77 stamina. Beginner's first unmatched parry had a4.5ms-old hurt sample with52 stamina; a later parry request had a17.6ms-old dead/0HP sample. That last request is a bot lifecycle-timing issue to investigate, not evidence of a game control defect. Input release passed. Root independently recomputed both metrics and checked sources, raw events, media hashes, recording bounds, final coverage, audio and actual heavy caps.

Advanced641 captured a genuine enemy heavy-overhead Charging event at1027 and actual `charge_foe` source at matching recorded tick; light Charging events823/1734 were classified separately. This validates a source/timestamp review fixture, not audible recognition or perceived sync. Roll1061 preceded enemy miss1085; next17-damage thrust1192 arrived1.783s after resolution, after the next threat began, without intervening damage. Chip block1759 preceded the next useful hit2025 by4.433s and48 damage received. Later chip-block follow-through also varied. Winning therefore still hides costly defence/re-entry choices.

As of this checkpoint: initial nine browser fights plus45 completed follow-ups =54 real browser fights across separate scopes; five fixture replay captures and one pre-fight loading failure are separate. Current game pin remains experimental until its own full-roster acceptance.
