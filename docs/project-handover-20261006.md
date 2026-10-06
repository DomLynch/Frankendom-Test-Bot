# Frankendom Test Bot — project handover, 6 October 2026

## Purpose and pause

Extract reproducible combat-design learnings: defence payoff, spacing, pressure/recovery, input commitment, weapon/contact clarity, effects, camera and sound. Winning is one competence measure, not the objective. Preserve imperfect beginner/intermediate/advanced synthetic players.

**Research is PAUSED at Dom's request to conserve credits.** This handover does not restart tests, servers, paid jobs or the five-minute heartbeat. The heartbeat `frankendom-bot-learning-progress` is saved as PAUSED. Executioner seed 2026100643 was interrupted; its partial files are not a completed fight.

## Source of truth and folders

GitHub: https://github.com/DomLynch/Frankendom-Test-Bot

| Location | Use |
| --- | --- |
| `/Users/domininclynch/Desktop/Business/Frankendom-Test-Bot` | Canonical repository; approved `main` at `de5ee79b3f7d09bfd6f01c10879261058fb7a11f`, pinned game `4056467af826b03166a575002f7a4f4b04f9dfe7`. Preserve untracked `docs/claude-combat-handoff-20261005.md`. |
| `/Users/domininclynch/Developer/frankendom-test-bot-launcher-20261005` | Prepared operator/capture checkout; candidate branch `bot/live-retest-20261006`. Full original recordings live here. |
| `/Users/domininclynch/Developer/frankendom-test-bot-exchanges-20261006` | Engineering worktree; branch `bot/exchange-analysis-20261006`. Contains this handover and ignored independent audit proofs. |
| `/Users/domininclynch/Developer/frankendom-player-bot` | Older support/dependency checkout. Not the current launch entry. |
| `/Users/domininclynch/Desktop/Business/Vibe Coding Management/codex-state/frankendom-test-bot.md` | Short current Codex state, ownership, pause and resume boundary. |

The latest **experimental** code is `649962e5d68b7e76be8586d7e529766e825cba40`, pinned game `6fb21b3437a6e794e47dc5a91141b67df7d69162`, in [draft PR #12](https://github.com/DomLynch/Frankendom-Test-Bot/pull/12). Later handover-only commits do not change that tested code. It has not met its own full-roster acceptance and is not promoted to main. Main and candidate are explicit statuses, not interchangeable launch versions. Never silently choose `archive/` policies or change the game pin to chase production.

No target `AGENTS.md` or `PROJECT_STATE.md` currently exists; use Business instructions and the Codex state above. Do not edit the nested `game/` source: it is the exact game dependency, not our game-development lane.

## Setup and normal entry

Prerequisites: Git, Node.js **22.18+**, npm. Python 3 is useful for the local viewer. First browser setup downloads the pinned game, dependencies and Playwright Chromium, and builds the game. Under Dom's compute policy, substantial setup/builds/tests run on the shared VPS; reuse this Mac's prepared checkout for authorized native Metal captures. Do not invoke a fresh local heavy install/build while paused.

For another developer who needs today's experimental AV tooling, clone the candidate explicitly:

```sh
git clone --branch bot/live-retest-20261006 https://github.com/DomLynch/Frankendom-Test-Bot.git
cd Frankendom-Test-Bot
git rev-parse HEAD
cat current-game.sha
```

Confirm the pin is game `6fb21b3…` and the checkout contains tested code `649962e…`. A plain main clone selects the older approved game `4056467…`; it does not contain today's candidate AV tooling.

**One normal browser launcher**, when testing is resumed:

```sh
./run-latest.sh --smoke --opponent=pitborn --player=advanced --out=artifacts/combat/new-pitborn-smoke
```

It always selects tactical, defaults to limited observation and headless rendering, and records a silent full-fight video. Do not pass `--strategy=` to this launcher. Use a new output folder every time. Add `--headed` only if visible playback is wanted. The bot controls the fighter; do not press combat keys during its run.

Profiles: `--player=beginner`, `intermediate`, or `advanced`. Add `--research` for exploratory cases: losses remain valid findings, while runtime/release/heavy-cap checks still matter. For the advanced competence gate, use matched settings and `--opponents=all --fights=3`; require at least 2/3 wins **per opponent**, useful diversity and <=20% actual heavy starts in every varied-player fight. Do not expect beginners to meet that win bar. Exploit probes are separate and need not obey the diversity cap.

## Actual quiet video and audio

The candidate supports real keyboard input, native real-time rendering and actual game audio recorded headlessly on this Mac's verified Metal path. This is separate from controlled-clock silent recordings and fixture replays.

After resume and preparation, use the same launcher with AV flags:

```sh
./run-latest.sh --research --native-av --observation=limited --opponent=pitborn --player=advanced --fights=1 --seed=2026100644 --out=artifacts/combat/new-native-pitborn-644
```

Native AV requires one bounded fight, recording enabled, and no `--clips`/`--review-frames`; it records without audible speaker output. Verify the receipt's renderer before accepting it as the Mac Metal capture path. Do not assume VPS headless rendering has equivalent performance.

For this already-prepared Mac, the previously tested served-release path was:

```sh
cd /Users/domininclynch/Developer/frankendom-test-bot-launcher-20261005
node scripts/player-bot.mjs --research --native-av --strategy=tactical --observation=limited --opponent=pitborn --player=advanced --fights=1 --seed=2026100644 --url=http://127.0.0.1:8791 --out=artifacts/combat/new-native-pitborn-644
```

The direct command bypasses launcher preparation only because that checkout is prepared. Before using `--url`, verify `http://127.0.0.1:8791/.bot-revision` equals the local nested game's HEAD. This frozen mirror and the viewer at `http://127.0.0.1:8792/` were left as passive services; their availability must be checked on resume. The mirror's `served-snapshot.py` startup rechecks the live revision, so it cannot simply be restarted after production changes. Do not mix newer live assets with this frozen release. The normal launcher uses its pinned local build instead; document that different served source in comparisons.

Canvas AV excludes the DOM HUD. Limited observation still uses delayed semantic engine cues and own telemetry; it is not pixel perception or AI hearing. Captured audio is real, but this does not establish sound taste, synchronization perception or human comfort.

## Engine diagnostics and manual play

Fast direct-engine tests execute real game rules without graphics/audio/keyboard. They are useful for reproducibility and rule/exploit screening, not visual acceptance:

```sh
./run-sim.sh --sparring-url='/?spar=1&opponent=pitborn&difficulty=6&weapon=longsword&skill=none&special=none&yourSpecial=none' --fights=3 --seed=2026100644
```

Use the actual numeric Sparring URL, with level-appropriate specials. Display rank is not engine difficulty. The rendered browser policy currently supports Easy engine L6 and longsword, not every weapon/level. Dom's intended 50-level progression versus the pinned source's 46 is a game-team mapping question; do not invent levels or alter balance.

To play the pinned game manually after preparation: `cd game` then `npm run dev`, and open the printed local URL. This is separate from a bot run. For current production, use https://frankendom.com/ and the owner's authorized account → menu/settings → Sparring; that live revision is a separate test source. Never copy credentials into receipts.

## Code, evidence and outputs

Key files in the bot repo:

- `run-latest.sh`, `run-sim.sh`, `scripts/prepare-game.sh`, `current-game.sha`: launch and exact source selection.
- `scripts/player-bot.mjs`: browser driver, real keyboard, receipts and captures.
- `scripts/lib/player-bot-policy.mjs`, `player-profiles.mjs`, `player-bot-observation.mjs`: tactics, synthetic profiles and observation limits.
- `scripts/lib/live-av.mjs`, `audio-review.mjs`, `player-senses-metrics.mjs`: AV capture and sampled effects/camera/audio diagnostics.
- `scripts/lib/combat-learning.mjs`, `player-bot-review.mjs`, `input-action-metrics.mjs`: defence payoff, outcomes, accepted actions and preceding own-state samples.
- `scripts/sim-bot.mjs`, `scripts/lib/sim-bot.mjs`: direct-engine diagnostics.
- `tests/input-action-metrics.test.mjs`: latest terminal-request regression coverage.

Start with [100-point learning handoff](learning-handoff-20261006.md), then [native capture report](native-live-20261006.md), [input/action report](input-action-20261006.md), [pressure study](pressure-unseen-20261006.md), [bug register](combat-bug-register.md) and [testing objective](testing-objective.md). The 100-point report is a dated 54-fight/131-test snapshot, not the final pause count.

Original media and JSON are under the capture checkout's `artifacts/combat/`: `live-retest-20261006`, `pressure-unseen-20261006`, `continuing-20261006`, `move-coverage-20261006`, `feint-repeat-20261006`, and `native-live-20261006`. One early Veteran native capture is under the engineering worktree's `artifacts/combat/native-live-20261006`. Independent derived proofs: engineering `artifacts/input-study-20261006`.

Each completed run writes `summary.json`, per-fight JSON, and video. Native AV subfolders `<opponent>-<seed>-av/` contain `fight-av.webm`, audio/frame metrics and contact JPEGs. Open WebM in Chrome or Codex; use recorded alignment timestamps, not a guessed conversion from ticks to video seconds. Preserve all losses, timeouts, errors and partial captures. Most full originals are ignored and **not included by Git clone**: share these folders separately if the next developer is on another machine. Do not delete support checkouts, symlinks or ignored files as cleanup.

## Verified pause checkpoint and next work

- 56 completed real browser fights today: initial 9 + 47 follow-ups (29 controlled, 18 native); five fixture replays and one pre-fight asset failure are separate. Do not pool these into a single win-rate claim.
- Tested code `649962e…`: 16 affected checks and 134/134 remote tests passed; [HF completion receipt](https://huggingface.co/jobs/Domlynch/6ac5349a404719ba3766209a). The final new-source native Executioner643 run was interrupted, so fresh end-to-end validation of that revision remains open.
- Latest fix classifies post-terminal input requests separately; it does **not** prevent the runner dispatching a late input. Preserve raw counts.
- Strong learning: accepted inputs can still lead to misses/interruptions; a win can hide weak exchanges. Pitborn642 showed all tracked commands accepted in both profiles, yet beginner lost and advanced won: decisions/spacing matter, not a universal control defect.
- Defence payoff varies substantially. Executioner641 block → next useful hit took 4.433 seconds with 48 damage received during that gap; this is a reproducible review case, not proof the game is unfair.
- Blood/contact stills and sampled roll tilt identify review targets; red masks are confounded by clothing/background. No claim yet about human touch comfort, sound quality, motion comfort or fun.

On explicit resume: finish the bounded latest-code smoke; publish the deferred Pitborn642/terminal evidence; then choose one question (clean pre-contact recognition, recovery after defence, or camera reacquisition) with matched/unseen seeds. Fix only demonstrated bot defects/observation gaps. Revalidate any changed final policy before promotion. No game/balance/deployment changes; proposals go to Dom for the game team.

## Staffing recommendation

**One owner can engineer, operate and analyse the bot.** Keep a small finite run active, edit an isolated worktree only at safe boundaries, audit receipts, and choose the next question. This reduces coordination/token overhead. Use a short independent review for a substantive logic change or promotion, rather than a permanently active second developer.

Existing ownership remains Root = engineering; **Frankendom - Bot Combat** (thread `01a0b8bf-5baf-7e13-b303-700f4095856b`, local) = tested commands and observations only. Combining is a recommendation, not an automatic reassignment. Coordinate only these two chats; do not involve Lead/Claude lanes or re-enable the paused timer without Dom's instruction.
