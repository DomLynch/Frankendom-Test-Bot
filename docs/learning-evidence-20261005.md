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

**Fresh acceptance passed:** ten playable Easy opponents × three held-out seeds2026100504/2574430427/2096410118;29/30 browser wins. Veteran2/3; all other opponents3/3. Root independently recounted439actual player attack starts,20Heavy/charged/counter/critical starts, each fight<=20%; all real input releases/errorsPASS. Frozen controllerbc33fea, digestb1133ca5a730eae23becc95ac90765fe7d53ed283f2f2fae4a47a2eb4b129559, game4056467a (still matches live release). These are real MacMetal rendered keyboard fights; videos were disabled for this competence batch. Separate fresh visual captures provide footage, not footage for all30cases. [All raw-count rows/hashes](learning-evidence-20261005.json).

86VPS tests pass for the source; focused failures reproduced before fixes. A fresh18engine case pilot is retained separately: beginner2/6wins, intermediate3/6, advanced5/6. These do not substitute for browser or human outcomes. Independent BotCombat source review found three issues; all were fixed and rereviewed, with two additional attribution regressions corrected. No GitHub CI checks are configured for this branch; local/VPS receipts are the checks.

Two frozen-controller visual runs: advancedExecutionerwin125HP and explicitroll-probe win139HP (13actual starts each;0and1heavies).1173/1967actual MacMetalJPEGframes, everytick captured (maxgap1), both input releases/errorsPASS. The earlier pre-observation-fix Veteran capture remains clearly separate:1503frames/maxgap1. All23exported full/proof/clean videos decode and recovered hashes match. Player-visible IAB playback at1× was verified for cleanroll/block/blood clips; actualframe samples checked against eventticks. This is sampled visual review, not a pixel-perception player or human motion-comfort study.

After the frozen explicit-output browser gate, the only runner change is a timestamped default output folder plus its receipt field, preventing repeated normal launches from overwriting/rejecting old default receipts. Explicit--out behavior and all tactical/observation code are unchanged; syntax/retention checks verify this narrow handoff change. Beginner/intermediate research losses remain useful outcomes and are retained.


## Broader design review

The per-fight rubric now covers animation/contact, direction/counterplay, impact/confirmation, camera/framing, VFX/art coherence, spacing/movement, tempo/commitment, resources/fairness, input/performance and audio/accessibility. It records unreviewed gaps explicitly. Samples retain health, stamina, posture and fighter states alongside position. These give reviewers context, not automatic taste or comfort scores.

Reference principles: [Riot's VFX guidance](https://www.riotgames.com/it/artedu/visual-effects) balances satisfaction with action/state clarity and source identity; [Riot's gameplay clarity discussion](https://www.leagueoflegends.com/en-us/news/dev/ask-riot-let-s-talk-clarity/) separates understandable gameplay from visual excess. [NVIDIA's latency measurement explanation](https://developer.nvidia.com/blog/understanding-and-measuring-pc-latency/) distinguishes input/simulation/render/display stages. Applying these principles to our harness is a design choice; no NVIDIA feature is installed, and simulation timing is not measured input-to-photon latency. “Best in class2026/27” is an ambition, not a proven rating or forecast.


## Fresh scene findings for the game developers

These are bounded observations, not a whole-game rating. Source engine4056467a,390×844 MacMetal render; normal-speed reconstructed clips are silent. Bot candidatebc33fea for Executioner; the earlier Veteran capture used the pre-observation-fix candidate (digestcda3d1), clearly retained separately. Sampled frame vision and playback checks do not establish human comfort.

| Finding | Exact retained case | Proposal / next check |
| --- | --- | --- |
| Keep the intentional roll effect provisionally | Executioner roll probe2026100504: roll226, actualDodged234; sampled224/226/232/240/256/268. Opponent stays visible during the tumble; camera ground lines tilt then settle. Own body approaches/crops at the left edge. | Do not revert the effect from this case. Compare reduced roll tilt vs current with matched game-team builds; track opponent blade visibility and the next tell, separately from motion comfort. |
| Protect close-range weapon visibility | Veteran2026100502parry753 and near-contact scenes: own torso/raised arm overlaps the enemy small weapon. Executioner's large scythe is easier to follow in the sampled224→268sequence. | Test a small lateral framing offset or framing constraint at close range; preserve feet/boundary awareness. No old-camera A/B is available, so no claim the current angle is worse overall. |
| Blood is restrained in these thrusts | Executioner probe599/603/609; Veteran194/198/205. Small red flecks, no large screen-covering gore. Dark rounded ground marks accumulate in the Veteran scene. | My visual judgement: restrained rather than tacky, but some contacts are subtle amid rain/dark clothing. Test local contact contrast/variation before increasing quantity; inspect repeated ground-decal shapes. This is art feedback, not a confirmed rendering bug. |
| Defence has readable outcomes, but pose/weapon matters | Executioner perfect block1131/1137: impact particles/trail, raised player blade and plain event line. Veteranparry753→heavy_riposteHit785/30=.533s. | Keep distinct defence identities. Compare clean block/parry/hit clips without event-line help; verify impact shake leaves the actual opening readable. Silent capture cannot judge sound. |
| Good evasion can still surrender initiative | Canonical branch inside explicit roll probe: charged-heavy roll1001→enemy miss1026→own useful thrustHit1094 (1.55s afterroll), sampled gap1.37→2.91. | Teach dodge destination and re-entry. First three probe rolls deliberately invite more enemy attacks, so their6.217s first re-entry is NOT evidence the game forces downtime. No roll-distance change justified here. |
| A hit need not interrupt a braced opponent | Retained Veteran ownthrust17→enemychargedheavy24 sequence; old accounting could wrongly label stop-tagged hit an interruption even when no enemyStaggered occurred. | Preserve poise/commitment. Review whether the braced wind-up/impact makes continuing danger legible; teach damage vs interruption. Do not remove commitment costs or buff reach from this bot exchange. |

The prototype's useful design direction is **force with clarity**: effects should sell a successful action while preserving the next choice. Follow-up proposals go to Dom/game developers; this bot update does not edit the game.
