# Frankendom Test Bot

**Purpose:** autonomous combat research—fight, review, reproduce findings and help improve the game. Competent play supports this; win rate is one measure. See the [research objective and player-skill profiles](docs/testing-objective.md).

Latest [five-part player-experience pilot](docs/player-senses-20261005.md): 27 engine fights, nine rendered browser fights, masked visual review, native game audio and trusted touch coverage. Includes short AV clips, measured results and game-team proposals. These research tools do not replace the normal policy; physical-phone comfort and perceptual sound judgment remain untested.

**October 6 experimental retest:** [fresh report and real AV evidence](docs/live-retest-20261006.md). Nine fresh rendered profile fights produced seven wins and two losses. Five native captures verify actual game audio, rendered contact images and camera measurements. The red-coverage proxy proved confounded; it is not blood/readability acceptance. This branch pins game6fb21b3 and remains a candidate until its own full-roster acceptance; main retains the previous approved pin.

Continued [pressure/defence study](docs/pressure-unseen-20261006.md):19 additional rendered fights,16 wins/3 losses; matched Veteran profiles produced beginner0/3, intermediate3/3, advanced3/3. Post-fight learning now distinguishes recorded interruption/feint/fight-end from misses and records the first accepted action after defence.118 tests pass; no tactic or game rule changes. These synthetic cases remain research evidence, not human calibration.

The new [real-time keyboard AV study](docs/native-live-20261006.md) captures fresh live fights with actual game audio, headlessly and quietly on Mac Metal. Opt in with `--research --native-av --fights=1`; no controlled clock or engine replay. Four native cases passed recording/input checks, including a retained loss.122 tests pass. Fast controlled recordings and native timing are separate evidence; neither proves hearing quality or touch comfort.

The [input-to-action study](docs/input-action-20261006.md) now distinguishes actual browser key receipt, accepted combat action and recorded consequence. Eight fresh native cases validate the tracker and its saved prior own-state context;131 tests pass. Accepted attacks can still miss or be interrupted; unmatched commands remain uncertain, not automatic control bugs.

**This is the canonical bot entry repo.** Git and Node.js **22.18+** are required. Clone it, then run the current tactical browser bot:

```sh
git clone https://github.com/DomLynch/Frankendom-Test-Bot.git
cd Frankendom-Test-Bot
./run-latest.sh
```

First use downloads the pinned game, installs dependencies and Playwright Chromium, and builds it. `--headed` opens a visible Chromium window; omit it for headless testing. The bot controls the fighter automatically; do not press combat keys during a run. It plays three Pitborn Easy fights by default. For manual play after setup: `cd game && npm run dev`, then open the printed local URL.

- One quick fight: `./run-latest.sh --headed --smoke`
- All **ten** playable Easy opponents: `./run-latest.sh --opponents=all --fights=3`
- Exact-state diagnostic: add `--observation=debug`; the default is limited observation.
- Faster measurement without videos: add `--no-video`.
- Results: `artifacts/combat/player-bot/<timestamp>/` contains summary/per-fight JSON and, by default, full WebM recordings. Full WebMs are wall-time recordings, not verified event-aligned clips. Add `--review-frames` (or `--clips`) for tick-verified rendered JPEGs; export normal simulation-speed videos/clips with `python3 scripts/render-review.py <fight-frames-directory>` on the VPS. No ffmpeg processing runs inside the browser bot. Retain losses/timeouts and send the seed, JSON and matching video with a finding.

## Current version and evidence

Latest [recovery and charge-cue repair](docs/recovery-charge-20261005.md): 102 tests, 54 engine diagnostics and 38 real browser fights. Normal-kit Easy roster passed **29/30 across all ten opponents**, with every actual heavy share <=20%. Wounded-ceiling stalls are fixed; semantic charge onset remains an assumed sound signal, not AI hearing. The report retains two browser losses and fresh clips.

Bot runners, policies, observation filters, damage reporting, scripted probes and their tests now live **in this repo** under `scripts/` and `tests/`. This experimental branch's `current-game.sha` pins the imported engine to **[6fb21b3](https://github.com/DomLynch/RPG-game/commit/6fb21b3437a6e794e47dc5a91141b67df7d69162)**, frozen from the published October6 release. Prior approved main used4056467a. No game code is changed. The earlier game-repo draft PR #1374 is the provenance for the tooling now owned here; it is not needed to launch this bot.

The launcher fetches the explicit game branch and verifies the exact commit, including when upgrading an older single-branch clone. Dirty game checkouts are refused; no local edits are reset. Bot and engine revisions are recorded separately. Updating this repo never deploys frankendom.com.

**Previous policy rendered Easy acceptance passed on October5:** ten opponents, three seeds each;29/30 wins, with Veteran2/3 and all others3/3. All per-fight Heavy shares are <=20%, counting critical attacks too. The affected critical-budget fight was freshly replayed; originals retained. Real headless Chrome for Testing used Mac Metal, and six matched visible/headless fights had identical outcomes and remaining HP. Full headless recordings decoded and showed combat.63 VPS tests passed;45 focused tests passed after the narrow recovery correction. See [the evaluation and limitations](docs/evaluation-20261005.md).

The charge-tracking correction changes the policy; its fresh acceptance is recorded separately in [learning evidence](docs/learning-evidence-20261005.md). The default is headless with full video and64ms controlled input cadence. No ordinary Chrome pop-ups are needed. Videos are silent and their25fps capture rate is not gameplay FPS. Useful defence is evidenced; kicks and offensive feint benefit remain unproven. This policy remains thrust dominant. It is not a validated human player or phone comfort test.

The browser runner enforces at least two wins out of three per requested opponent and at most 20% heavy attack starts in each fight. A one-fight smoke checks that individual fight; it is not a three-fight acceptance batch. Limited observation still reads delayed semantic events and own telemetry; it is not vision/audio perception or proof of phone control comfort. The current browser policy is fixed to Easy (engine L6), longsword and its own scripted configuration; use the engine runner for explicitly selected configurations.

## Player-experience pilot

Three reproducible **synthetic** personas now use the same tactical controller: `advanced` (unchanged default), `intermediate`, and `beginner`. They vary reaction delay, spacing/stamina judgement, directional mistakes and missed punish opportunities. They are experimental test conditions, not validated human populations.

```sh
./run-profile-pilot.sh
./run-latest.sh --player=beginner --research --opponents=pitborn,veteran --fights=3 --out=artifacts/combat/beginner
```

The first command runs18 fast production-engine cases: three personas × two enemies × three matched seeds. It does **not render**. The second uses actual headless browser keyboard input and saves full video. Replace `beginner` with `intermediate` or `advanced`; keep the same `--seed=` to compare initial conditions. `--headed` is optional. The pilot is scoped to engineL6/longsword with no equipped specials; it does not cover progression or every weapon.

`--research` retains losses without applying the advanced win-rate gate; runtime errors, input release and the per-fight <=20% heavy cap still must pass. Actual wins/rates and `competencePassed` remain in the summary. Beginner/intermediate are exploratory even without this flag. Default advanced runs retain the original win gate. Persona interventions count applied judgement biases, not proof that every application changed the action. See [fresh pilot evidence and findings](docs/profile-pilot-20261005.md).

## Direct-engine diagnostics

This uses production Sparring rules without rendering, npm installation or a browser:

```sh
./run-sim.sh --sparring-url='/?spar=1&opponent=pitborn&difficulty=6&weapon=longsword&skill=none&special=none&yourSpecial=none' --fights=3
```

For another setup, copy the URL **after Start sparring** and quote it as `--sparring-url`. `./run-sim.sh --help` lists strategies; `--strategy='skill then light'` actually exercises an equipped skill/special. Results are under `artifacts/combat/sim-bot/`, in a new directory per invocation. Perfect-state/single-tactic diagnostics are separate from the varied browser policy; they do not demonstrate visual readability or human fun.

Registered specials must match the actual engine level's authored band. Display rank 1–10 is not engine level. This pinned source has ten playable classes and levels 1–46; the intended 50-level ladder remains a main-game discrepancy, not a bot rule change. See `docs/sim-bot.md` for limitations and configuration details. Run substantial batches/builds/media processing on the shared VPS. Dom specifically authorized Mac GPU captures for this comparison; actual Safari/iPhone checks remain device checks.

## Bounded coverage and diagnostics

`--probe=guard`, `parry`, `roll`, `shortstep`, `kick`, `feint` or `special` explicitly labels an experimental scenario. It never replaces the normal policy silently. The runner rejects unsupported browser level/weapon configurations. The level/weapon reaction-threshold watchlist from Claude is recorded in the evaluation; use existing direct-engine parameters to investigate it. No external bot or game patch is installed.

## Archived versions

`archive/run-tactical-20260924.sh` preserves the old September launcher; `archive/run-heavy-only.sh` preserves the heavy-only policy. Each uses a separate archived checkout and is never selected by the normal launcher. `run-baseline.sh` only prints a migration notice. There is one current pin and one normal browser launch command: `./run-latest.sh`.

## Temporary known-bug diagnostics

Owner-authorized scythe-spacing and reaction-threshold bot workarounds are opt-in through `./run-sim.sh ... --workaround=known-combat-bugs`. The runner always retains the matching no-workaround baseline and labels variants artificial/not acceptance. The normal browser policy is unchanged. See the [copyable combat bug register](docs/combat-bug-register.md) for reproduction, measured outcomes, developer investigation and removal instructions.

## Combat feel and visual learning

Each engine/browser receipt now includes `learning`: sampled spacing, defence-to-useful-hit latency, dodge position/re-entry, bounded two-sided damage exchanges, and review cases for block, parry, blood/hit effects, roll camera and charge. These are review prompts, not automatic aesthetic scores. [Workflow and limitations](docs/learning-evidence-20261005.md). No game graphics/camera changes are made here.

An opt-in [camera lab](docs/camera-lab-20261005.md) now replays identical retained inputs through the current view and two experimental automatic tracking views. It temporarily overrides only the local debug renderer; the normal launcher and game source remain unchanged. See the report for the isolated command, matched clip evidence and production-integration limits.

Camera follow-up: [Goblin, Executioner, boundary and actual keyboard/touch probe](docs/camera-followup-20261005.md). Fixed offset remains experimental; keep the current camera.
