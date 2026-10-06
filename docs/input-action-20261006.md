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
