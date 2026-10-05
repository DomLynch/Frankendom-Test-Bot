# Exchange evidence and visual review — 5 October 2026

Purpose: improve the game through reproducible player-experience findings, not merely win more fights. Game source/pin remains4056467a; no balance, camera, shake, blood or production edits.

## Corrections and new measurements

- Charged-threat memory is bound to one observed enemy swing. A later light tell, resolved contact, stagger or feint clears it. Regression: beginnerPitborn decision823 previously rolled for a heavy193 even though light_right775 had hit797. Regression tests reproduce the old failure and preserve an active charge.
- A player hit does not end an observed enemy swing unless the enemy visibly staggers or resolves it. A stop-tagged hit alone also cannot be called an interruption: poise can preserve the enemy attack.
- An accepted roll between swings is labelled positioning. It cannot claim a later unrelated miss as an answered attack. The original roll824 / newlight832 / miss857 remains a bot/measurement finding, not evidence of a charged-overhead dodge.
- `learning.attacks`: perceived/actual choice distance, sampled attack/contact positions with sample age and authored reach. A miss alone is not a collision or reach defect.
- `learning.defenceOutcomes`: successful defence vs a useful damaging follow-up, latency, damage received before that hit, sampled gap and radial boundary position. Nominal avoided damage remains an estimate, never a counterfactual.
- `learning.trades`: damage to both sides in explicitly bounded contact bursts (45-tick gap,120-tick span), raw net damage and lethal status. Raw damage can exceed remaining HP; temporal proximity alone does not prove causality or bad strategy.
- `learning.visualCases`: fresh case boundaries/questions for block/parry impact, blood, roll camera and charge consequence. Assessment stays empty until footage is actually reviewed.

## Reliable visual workflow

```sh
./run-latest.sh --review-frames --research --opponent=veteran --smoke --seed=2026100502 --out=artifacts/combat/visual-review
# CPU export on the VPS after uploading only the requested frame directory:
python3 scripts/render-review.py <fight-frames-directory>
```

This optional mode preserves the64ms decision cadence but advances the page clock in16ms substeps and captures the actual rendered page with the clock paused. Tick is checked before/after each JPEG; hashes, engine/bot identity and continuity are saved in `frames.json`. Missing, duplicate or reversed ticks fail the export gate; at most2 ticks between unique frames are allowed. Proof clips retain the visible tick label; clean clips mask its top24pixels. Both derive from the same hashed source frames. Full review and case clips use60 simulation ticks/sec; repeated frames at missing sub-tick cadence are not reconstructed motion. This is rendered controlled simulation, not measured real-time FPS, audio or physical-touch acceptance. Capture slows the test; use it for selected visual cases, not every balance seed.

Ordinary full WebMs remain available. Their Node wall-clock samples are **not** reliable clip alignment: the old beginnerVeteran range clip estimated261 actually showed485. No automated wall-time clips are produced now. Old footage/raw logs remain retained; that wrong clip is invalid as range261 visual proof. Full decoding and source hashes alone never establish event alignment.

## Visual review questions

Watch a clean clip at normal simulation speed first, then its proof version and event log:

1. Guard/block/parry: are outcomes distinct, and does impact shake hide the blade or the punish opening?
2. Blood: does it originate at contact, match the gritty art, stay readable and avoid covering the next tell? “Tacky” is a visual judgement, not a damage statistic.
3. Roll: is intentional disorientation brief, and can the player reacquire the opponent weapon before the next attack? Record the last unclear and first clear frame ticks; do not confuse camera obstruction with bot reaction delay.
4. Camera: judge weapon visibility, overlapping silhouettes, framing and boundary awareness. Compare camera versions only with matched read-only builds/settings; no old-camera comparison is fabricated.

Keep each proposal small: seed/settings, tell→choice→accepted action→contact→consequence, affected frequency, matching frames/clip, classification (game defect / bot defect / measurement defect / teaching or presentation proposal), proposed change and cheapest recheck. Logs cannot judge taste, sound, nausea, touchscreen comfort or enjoyment.

## Validation

Implementation validation is in progress; no new all-roster win claim yet. Old29/30 acceptance belongs to the prior policy. New charge-tracking policy must pass<=20%actualHeavy/charged/counter/critical starts each fight and>=2/3 browser wins for each of ten Easy opponents before promotion. Beginner/intermediate research losses remain useful outcomes and are retained.


## Broader design review

The per-fight rubric now covers animation/contact, direction/counterplay, impact/confirmation, camera/framing, VFX/art coherence, spacing/movement, tempo/commitment, resources/fairness, input/performance and audio/accessibility. It records unreviewed gaps explicitly. Samples retain health, stamina, posture and fighter states alongside position. These give reviewers context, not automatic taste or comfort scores.

Reference principles: [Riot's VFX guidance](https://www.riotgames.com/it/artedu/visual-effects) balances satisfaction with action/state clarity and source identity; [Riot's gameplay clarity discussion](https://www.leagueoflegends.com/en-us/news/dev/ask-riot-let-s-talk-clarity/) separates understandable gameplay from visual excess. [NVIDIA's latency measurement explanation](https://developer.nvidia.com/blog/understanding-and-measuring-pc-latency/) distinguishes input/simulation/render/display stages. Applying these principles to our harness is a design choice; no NVIDIA feature is installed, and simulation timing is not measured input-to-photon latency. “Best in class2026/27” is an ambition, not a proven rating or forecast.
