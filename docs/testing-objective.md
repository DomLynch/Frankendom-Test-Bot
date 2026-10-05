# Testing objective — owner clarification, 5 October 2026

Build an autonomous combat research harness: **fight → watch → explain → reproduce → propose → verify the game change**. The output is better game mechanics and player experience, supported by fast, reproducible evidence. A competent bot is necessary for useful exchanges; maximizing its win rate is not the product objective.

## Two independent axes

**Player skill profile** describes the bot, not the enemy. The following are the next implementation requirements; these named presets are not implemented yet.

| Proposed profile | Decision behaviour to exercise | Player-experience question |
| --- | --- | --- |
| Beginner | Slower, variable reactions; occasional wrong defence or range judgement; simple attacks; limited resource planning | Can a new player understand failure, recover and discover a useful answer? |
| Intermediate | Usually correct defence; spacing and stamina management; some counters; occasional mistiming | Does better judgement improve results and open useful tactical choices? |
| Advanced | Fast but bounded reactions; purposeful guard/parry/evasion; punish windows, positioning and situational kick/feint/special use | Is there counterplay and depth beyond a repetitive winning sequence? |

**Enemy difficulty** is the game's actual level/settings. Cross each player profile with low, middle and high enemy settings, keeping loadout and specials level appropriate. Do not silently tie advanced players to hard enemies or beginner players to easy enemies. Do not confuse display ranks with engine levels.

Use seeded mistakes and bounded reaction variation for reproducibility. The profiles are test personas, not proven human skill distributions. Reaction delay alone is not a complete skill model. Existing `--reaction-ms` is available today; it does not implement all three personas.

## What to measure

- Competence: accepted inputs, useful hits, useful defence, purposeful movement and wins/losses; preserve every failure.
- Learning value: reproducible findings and newly exercised meaningful situations per run/hour; avoid rewarding duplicate reports or empty action padding.
- Combat quality: defence-to-punish conversion, avoidable trades, empty swings, stamina/recovery opportunities, pressure/position after evasion and variety that changes outcomes.
- Skill progression: compare profiles under the same initial conditions. Do better decisions generally earn better outcomes? Where do mechanics create a sudden cliff or a dominant tactic?
- Readability: independently review clean rendered clips against the event log. Exact-state bot knowledge is not visual evidence. Current silent controlled-clock videos cannot establish sound, normal-speed input feel or phone comfort.

The existing >=2/3 Easy win benchmark remains evidence of **advanced/current-policy competence**, not the success criterion for beginner tests or the research objective. Keep <=20% Heavy starts for varied-player exploration. Run exploit-hunter tests separately without that cap to discover cheap winning loops. Heavy spam can be a useful exploit finding even though it fails the varied-player requirement.

## Efficient next experiment

Implement the three reproducible profiles using the existing observation/input runner, without changing the game. Pilot Pitborn and Veteran using matched initial seeds/settings; verify actual decisions and contributions, not preset labels. Use fast production-engine diagnostics to narrow cases, then rendered browser fights for representative wins, losses and surprising exchanges. Keep the canonical advanced policy stable until any changed policy earns its own relevant validation. Broaden the matrix only when the pilot distinguishes the intended behaviours.

Each finding needs: engine/bot revision, level/weapon/special/profile, seed, expected and observed behaviour, frequency/sample size, decisive events and a fresh clip where visuals matter. Add it to the [bug register](combat-bug-register.md), separating game defects, bot coverage gaps and design proposals. Claude owns game implementation; verify the fix against the retained case plus unseen seeds after the pin changes.

Temporary known-bug workarounds can explore other mechanics, but must retain the actual-game baseline. Disable them when assessing the bug itself. Do not use adjusted wins as game-balance acceptance.
