# Combat evaluation — 5 October 2026

Engine: `4056467af826b03166a575002f7a4f4b04f9dfe7`, checked against live on October 5. Bot code stays in Frankendom-Test-Bot; no game rules, assets, camera or deployment changed. Numerical receipts and raw-file hashes: [evaluation-20261005.json](evaluation-20261005.json).

## What passed

- **Real headless rendering:** Chrome for Testing uses Apple M5 Metal, the same renderer as visible Chrome. Six matched Pitborn/Veteran fights had identical outcomes and remaining HP. All six headless recordings decoded completely, with distinct opening/combat/finish frames and stable 390×844 geometry.
- **Easy browser acceptance:** ten playable opponents, three unseen seeds each. Nine opponents won 3/3; Veteran won 2/3. Every fight stayed at or below 20% actual Heavy starts, including heavy counters, ripostes and critical attacks. All inputs released; no runner errors.
- **Affected-case recheck:** the original 30-fight batch had a nonterminal critical attack, so tighter heavy accounting could change later decisions. Its original recovery pause was preserved. Pitborn seed3901284756 was freshly replayed: win82HP, one Heavy/critical out of20 starts. The current policy gate combines this replay with29 unaffected original fights. Originals remain retained; the replay is not an extra independent win-rate sample.
- **Checks:**63 standalone tests passed on the VPS. After the narrow critical-recovery preservation,45 focused policy/observation/report tests passed. Independent peer source and affected-receipt review passed. Existing engine-download/build evidence remains applicable to the unchanged pin/dependencies.

## What the videos establish

The bot drives real browser inputs while the actual game draws. Full WebM recordings are saved by default; clips require explicit `--clips` and ffmpeg. Separate Chrome for Testing headless runs do not open ordinary Chrome windows. Videos have **no audio**. Their25fps recording rate is not measured game FPS; the controlled test clock can make playback timing differ from real time. This validates rendered combat inspection, not phone controls, normal-speed cue readability or human enjoyment.

Limited observation is delayed semantic engine events, rounded distance and current own telemetry. It is not a vision/sound model. Exact distance logged alongside decisions is audit-only. The spacing forecast uses delayed rounded history; it is a heuristic, not a guaranteed upper bound.

## Player-facing findings and remaining coverage

| Finding | Observed evidence | Proposal / next test |
| --- | --- | --- |
| Defence can earn useful punishment | Guard probe:2 blocks,4 parries; three parries led to damaging slash/riposte answers | Teach defend → punish; distinguish guard/parry/dodge feedback. Verify with clean real-time footage before calling tells readable. |
| Spacing affected attack quality | Delayed gap can understate a retreating opponent's current distance | Forecast from delayed movement before committing. Keep weapon reach unchanged. |
| Rolls can sacrifice pressure/position | Two rolls answered one charged swing; one avoided threat, increased gap/boundary radius, no immediate punish | Report the finish position and next useful hit, not roll counts alone. |
| Short steps are situational | Three accepted backsteps: two still hit, one avoided | Test appropriate timing/range, not a universal roll replacement. |
| Kick usefulness remains unproven | Bounded kick scenario produced zero accepted kicks | Find a reachable guarding scenario first; no kick buff justified. |
| Feints are accepted, benefit unclear | Two accepted feints; no attributed damaging follow-up | Measure induced reaction and usable punish window; do not count later unrelated hits. |
| Special coverage has a blind spot | Level-matched casts landed; limited observation omits SpecialStarted/SpecialLanded tells | Audit observation access before judging special defence or balance. |
| Diversity remains incomplete | Original roster:391 thrust starts among454 attacks; useful cuts/defences also present | Heavy cap passes, but this is still thrust dominant. Do not call it a complete human playstyle. |

The defensive report now separates attempted inputs, accepted starts and move-bound outcomes. Several evasions against one held swing receive one nominal avoidance credit. Nominal damage avoided is an estimate, not a measured alternate timeline.

## Claude findings incorporated as a regression watchlist

Reference: [Test-combat-frankendom-1](https://github.com/DomLynch/Test-combat-frankendom-1), reported commit `cef9ec1`, same engine405. This is a reference experiment, **not our canonical bot or launcher**.

1. Compare adjacent levels around weapon wind-up/reaction thresholds: longsword/gladius/estoc11–12; cleaver/maul/trident/warhammer9–10; knife21–22; Pitborn/Shieldmaiden13–14. These are Claude's reported thresholds, not newly confirmed by our browser tests.
2. Check Nightborn/PlagueDoctor5–6 separately. Match level-appropriate specials and actual kit/body scaling. Do not equate display rank with engine level.
3. Verify bot attack starts, reach and landed hits before interpreting scythe losses as game balance. A broken range policy can manufacture a difficulty cliff.
4. Compare several tactics, not only one swing. Our existing450-case perfect-state diagnostic includes longsword11/12: light spam fell7/30→2/30, while charged heavy rose12/30→15/30. This supports a tactical sensitivity worth investigating; it does not confirm one universal balance cliff.
5. Treat camera occlusion, thin weapon contrast and crowded controls as visual-review hypotheses. The new GPU route can inspect them without the reference's2fps software-rendering limitation.

Reaction is not the AI's only defence gate: the pinned source also has tellReaction, spam anticipation, lapse and other decisions. Do not infer that every attack is answered solely from one reaction threshold.

**Excluded:** no lapse-ramp patch, weapon buffs, enemy difficulty changes, new cue buttons, replay-test exemptions or session/account shortcuts. Claude's patch reportedly affects existing replay checks; simulation/replay compatibility decisions stay with the game team.

## Reproduce and extend without a second framework

One normal rendered bot: `./run-latest.sh`. Default: headless, limited observation, EasyL6, longsword,180ms reaction,64ms cadence, full video. `--headed` is optional; `--probe=guard|parry|roll|shortstep|kick|feint|special` labels experimental coverage. Browser policy currently supports onlyL6/longsword; other combinations use the existing direct-engine runner.

For an adjacent-level diagnostic, use the same opponent, weapon, special choices, strategy and seed at both levels:

```sh
./run-sim.sh --sparring-url='/?spar=1&opponent=veteran&difficulty=11&weapon=longsword&skill=none&special=none&yourSpecial=none' --strategy='light spam' --seed=918273645 --fights=3
./run-sim.sh --sparring-url='/?spar=1&opponent=veteran&difficulty=12&weapon=longsword&skill=none&special=none&yourSpecial=none' --strategy='light spam' --seed=918273645 --fights=3
```

Repeat with a contrasting strategy before proposing a fix. `special=none` is an explicitly isolated no-special test, not representative progression balance. For normal special comparisons, copy the actual Start sparring URL and keep both specials within the tested level's band. Run substantial batches/builds/media processing on the VPS; Mac GPU capture is specifically authorized for this investigation.

Local evidence root: `/Users/domininclynch/Developer/frankendom-test-bot-launcher-20261005/artifacts/evaluation-20261005/`. Subfolders: `baseline-six`, `headless-isolated-six`, `headless-video-verified`, `probes-final`, `roster-heldout`, `critical-recheck`, `engine-results`, `final-unit-receipts`, `review-media`. Failed/interrupted attempts remain retained. Fresh full headless replay is in `review-media/headless-full.mp4`; it is a replay, not a live controller.
