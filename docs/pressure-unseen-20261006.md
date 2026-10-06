# Fresh pressure and defence study — 6 October 2026

**19 new rendered fights: 16 wins, three losses.** Root and Bot Combat independently audited every raw outcome, source, actual attack count, heavy share, input release, error list, Metal renderer and retained video. This extends the earlier nine-fight study; it does not replace losses or prove full-roster/human acceptance.

All runs froze bot0c0a118, game6fb21b3 and script digest2ff9a46184125066ad628df33b992815f74376f774e81958b30536ee9ffa715d. Headless actual keyboard play,390×844,DPR1, limited semantic observation, Easy engineL6, longsword, no specials,64ms controlled clock. Full recordings are silent. Native audio replays from the previous study are a separate evidence set.

## Two distinct fixtures

First ten: advanced explicit Sparring, Goblin/Veteran/Executioner with seeds2026100601,898582598,153612530; tenth Veteran2026100611. **10/10 wins**,117 actual starts,5heavy starts. All ten had zero recorded AttackMissed events, but17 starts were subsequently interrupted by recorded player stagger before resolution. Winning and zero misses did not imply clean decision-making.

The runner's exact first-ten Sparring query is retained in [advanced evidence](evidence/pressure-unseen-20261006/advanced-ten.json). It overrides opponent per fight. Do not compare repeated seed601 across the explicit Sparring batch and default-kit matrix as an identical fixture.

Next nine: normal default-kit Veteran, matched seeds2026100601/602/603, three synthetic profiles. [Matrix evidence and defence traces](evidence/pressure-unseen-20261006/profile-matrix.json).

| Profile | Seed601 | Seed602 | Seed603 |
|---|---|---|---|
| Beginner | Loss, enemy34HP | Loss, enemy94HP | Loss, enemy5HP |
| Intermediate | Win,90HP | Win,30HP | Win,150HP |
| Advanced | Win,80HP | Win,49HP | Win,120HP |

Matrix:149 starts,5heavy starts. All19 per-fight heavy shares<=20%; total266 starts/10heavy. No wall lashes. This is three synthetic seed pairs, not a population study or a promise that higher skill always dominates: intermediate603 took zero damage while advanced603 took30.

## Player lessons worth testing in the game

1. **Interruptions deserve a distinct explanation.** Advanced Veteran601 won but took70 damage and lost six committed attacks to stagger. Across the first ten,17 unlanded starts were interruptions, not range misses. Review enemy pressure, commitment feedback and recovery decisions before changing reach.
2. **Resource awareness matters near the finish.** Beginner603 reached82HP against19HP at tick2245, but stamina was zero. A kick interrupted its thrust at2306. It reduced Veteran to5HP at2480, missed a slash2561, then had later attacks blocked and died3011. Over this segment, wounded stamina ceiling fell76→44. No new50-stamina deadlock was observed; it kept acting. Review whether the existing HUD/practice makes this shrinking capacity and safer re-entry understandable.
3. **A nearly dead opponent still defends.** Beginner603 thrust2639 was perfectly blocked2655; slashes2774/2905 were blocked2794/2925. “One more attack” is not guaranteed. Test whether the existing kick/feint choices help players recognise and open a held guard; do not grant automatic finishing damage.
4. **Boundary duration alone is a poor fairness score.** Intermediate602 survived17.5s near the boundary without exhaustion and won; beginner603 spent12.4s there, exhausted three times and lost. Position, resources and decisions must be reviewed together. No lash occurred, so this batch does not assess wall-warning readability.
5. **Successful defence can earn very different follow-through.** Executioner153612530 perfect block189 was followed by a useful hit221,0.53s later. Ordinary chip blocks403/519/609 were followed by the next useful hit789, delays6.43/4.50/3.00s. A roll increased separation from sampled1.57 to3.63. These are observed sequences, not proof the defence or roll caused every delay.
6. **Persona conclusions must stay modest.** Beginner lost all three; intermediate/advanced won all three. This identifies useful novice pressure cases. It does not establish how real beginners feel or justify changing Easy difficulty from this batch alone.

## Bot improvement made from these runs

Post-fight learning now preserves each original hit/miss/unresolved result and adds recorded termination: resolved, stagger-interrupted, feinted, fight-ended or unknown. A received hit alone never proves interruption because poise and simultaneous trades exist. Same-tick trades/parries stay resolved. The earlier beginner loss's four suspected interruptions were corrected to three staggered attacks plus one killing end.

Defence rows now record the first accepted player action after resolution and whether a new enemy attack had started, alongside existing damage, separation and next useful hit. A retreat is reported as an action, not automatically scored as a mistake. Schema version is2. These exact retrospective measurements never enter policy observations or change decisions.

**118/118 tests pass**, source7b381e5ddca803b316a86ff6575764c5f4d81920, remote job[6ac51deb404719ba37661aa7](https://huggingface.co/jobs/Domlynch/6ac51deb404719ba37661aa7) COMPLETED; test-log SHA256606cdc7ce9674776a79b8b7a9bd6b5c94c8a809655df1a2c5eb73a13b2bde1ff. This includes regression coverage against a real retained Veteran loss. Subsequent report/evidence changes do not change tested code.

Full originals remain in the capture checkout under `artifacts/combat/pressure-unseen-20261006/` and `artifacts/combat/continuing-20261006/`. Evidence files retain exact raw/video hashes and paths. No continuous audiovisual judgment, AI hearing or physical-device comfort is claimed. Live1f4142 remains outside this frozen study; game code/balance unchanged. Candidate is still experimental until its own full-roster acceptance.

Next bounded tests: existing kick/short-step/feint coverage probes with retained outcomes, then engineer native real-time keyboard AV capture so audio and action can be examined together without an old replay or controlled-clock sound judgment. Keep ordinary play, experiments and exploit hunting explicitly separate; no random move rotation or attack-count padding.
