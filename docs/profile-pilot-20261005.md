# Player-experience pilot — 5 October 2026

Three seeded synthetic player profiles are implemented in the existing controller. Advanced keeps the accepted default policy. Beginner/intermediate change delayed range/stamina judgement, reaction delay, occasional directional mistakes, missed punish choices and simple-slash preference. These are exploratory conditions, not calibrated human populations. Enemy difficulty remains independent.

**Completed:**18 production-engine fights and6 real headless Chrome fights, all at engineL6 with longsword and no equipped specials or artificial workaround. Engine revision4056467af826b03166a575002f7a4f4b04f9dfe7 matched live at the start. Seeds2026100501,866561695,169106580; browser representatives used the first seed. Every recorded fight met the actual-start heavy cap. All six browser runs released real inputs, reported no errors, used AppleM5Metal and kept390×844 geometry. Six full recordings decoded successfully; six exchange clips and sampled frame sheets are retained.

## Results: keep the evidence tiers separate

| Player profile | Engine Pitborn | Engine Veteran | Browser Pitborn | Browser Veteran |
|---|---|---|---|---|
| Beginner |2/3wins|0/3wins|Win,94HP|Loss,54enemyHP|
| Intermediate |2/3wins|1/3wins|Loss,25enemyHP|Loss,92enemyHP|
| Advanced |3/3wins|3/3wins|Win,37HP|Win,25HP|

The engine adapter uses fixed camera yaw and four-tick input cadence. Browser camera/timing and resulting exchanges differ; engine outcomes are not browser win rates. Intermediate was not better than beginner in every fight. Do not tune profiles to manufacture a monotonic result or infer Easy is unfair from these synthetic losses. The prior accepted advanced roster policy is unchanged; this six-fight research sample is not a new all-opponent acceptance batch.

Browser actual attack-start counts: beginnerPitborn0/22heavy, Veteran0/18; intermediatePitborn0/24, Veteran0/8; advancedPitborn2/20, Veteran0/20. Heavy includes earned critical attacks. No empty-swing padding was added. Successful parries: beginner1/0, intermediate0/0, advanced2/1. No successful blocks in these six; accepted parry presses alone are not successful defence. Beginner/intermediate resource judgement and missed-counter choices exist in code, but no exhaustion events or stochastic missed-punish interventions occurred in the engine pilot: those axes need targeted coverage.

## Useful findings and proposals for the game team

1. **Teach defence and the follow-up as one exchange.** Advanced Veteran parried at tick350, then landed slash_riposte at375:0.42seconds. Advanced Pitborn's two parries earned heavy riposte hits0.58seconds later. Beginner Pitborn parried at634, rolled at646, started a slash riposte at685 and missed at701; its next useful hit arrived at844,3.50seconds after defence. The escape increased separation and forfeited the opening. Proposal: a practice exchange explaining when to stay close after parrying, with distinct feedback for the parry and successful punish. This is a teaching proposal, not a damage-buff request.
2. **Make range mistakes understandable.** Beginner Veteran started a slash at264 using delayed gap1.0m/upper1.25m, biased upper1.0m, while the recorded current gap was2.34m; it missed at291. Intermediate Pitborn did the same at371 with actual gap2.52m and missed at398. Beginner had12empty swings in two browser fights; intermediate7; advanced0. The artificial judgement bias contributes, so these are not collision/reach bugs. Proposal: review whether weapon extension/contact and miss feedback make spacing understandable. Keep reach frozen; test a range-teaching drill before balance edits.
3. **Teach where a dodge finishes.** Intermediate Veteran rolled at500 and the heavy missed at515, but the next player hit was tick934:7.23seconds after the roll. Sampled separation increased1.19m and radial position moved1.39m toward the boundary. Proposal: practice a lateral evade followed by re-entry, and review boundary readability. A successful dodge need not imply a successful counter.
4. **Review visual emphasis before changing the camera.** Fresh sampled frames show both fighters and weapons in these exchanges, with much of the frame occupied by arena/background and small event text at the top. Proposal: compare the current camera against the former view on the SAME decisive exchanges, judging weapon visibility, overlapping bodies, attack direction and legible consequence at phone scale. No old-camera A/B was performed, so this pilot cannot justify reverting it.

No charged-overhead events were recorded in these six browser fights. They do not settle charge-tell readability. No kick/feint usefulness or equipped-special coverage is established here. These remain explicit next targets; no new game buttons, difficulty changes, balance edits or deployment were made.

## Review media and limits

Raw JSON/WebM, checks and six full MP4 copies remain under `/Users/domininclynch/Developer/frankendom-test-bot-launcher-20261005/artifacts/profile-pilot-20261005/`. Media filenames include player, enemy and seed. `media/*-exchange.mp4` are short review clips; `media/*-full.mp4` preserve full capture timing. Videos are silent.25fps recording is not game FPS. Clip timestamps/sheet labels interpolate from sparse samples and are approximate; the in-video tick overlay identifies the state actually shown. Sampled-frame inspection is not a blind human cue test.

The [machine-readable report](profile-pilot-20261005.json) contains every engine row, all six browser summaries, profile settings, source/raw hashes, defence rows and media verification. Browser captures preceded only engine-release metadata and pilot output-retention edits; the browser action policy remained unchanged.73 full VPS tests passed, then changed profile/input tests passed again; an additional output-retention regression also passed. Independent Bot Combat source/raw review found the engine release-label issue; it was corrected and the18-case pilot replayed with identical outcomes.

## Run the current bot

- Fast matched engine pilot: `./run-profile-pilot.sh` (unique output directory per run; no visuals).
- Rendered beginner comparison: `./run-latest.sh --player=beginner --research --opponents=pitborn,veteran --fights=3 --seed=2026100501 --out=artifacts/combat/beginner-new`.
- Replace beginner with intermediate or advanced for matched initial seeds. Add `--headed` only to watch live; headless saves full videos by default.
- `--research` retains losses and reports competence separately; it does not relax runtime/input/heavy-cap checks. Default advanced remains the normal competence benchmark. Existing single-tactic exploit runner stays separate.

Next bounded research: targeted defence-to-punish and post-roll range cases, plus charge/special perception coverage, using retained cases and new seeds. Broader weapons/levels should follow only after policy range support and authored special bands are explicit. Claude owns all game changes; Dom can relay the proposals above.
