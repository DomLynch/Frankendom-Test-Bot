# Frankendom Test Bot

**This is the canonical bot entry repo.** Git and Node.js **22.18+** are required. Clone it, then run the current tactical browser bot:

```sh
git clone https://github.com/DomLynch/Frankendom-Test-Bot.git
cd Frankendom-Test-Bot
./run-latest.sh --headed
```

First use downloads the pinned game, installs dependencies and Playwright Chromium, and builds it. `--headed` opens a visible Chromium window; omit it for headless testing. The bot controls the fighter automatically; do not press combat keys during a run. It plays three Pitborn Easy fights by default. For manual play after setup: `cd game && npm run dev`, then open the printed local URL.

- One quick fight: `./run-latest.sh --headed --smoke`
- All **ten** playable Easy opponents: `./run-latest.sh --opponents=all --fights=3`
- Exact-state diagnostic: add `--observation=debug`; the default is limited observation.
- Faster measurement without videos: add `--no-video`.
- Results: `artifacts/combat/player-bot/` contains summary/per-fight JSON and, by default, full WebM recordings. Short review clips additionally require `ffmpeg` on PATH; without it, full recordings remain available and the JSON records a clip error. Retain losses/timeouts and send the seed, JSON and matching video with a finding.

## Current version and evidence

Bot runners, policies, observation filters, damage reporting, scripted probes and their tests now live **in this repo** under `scripts/` and `tests/`. `current-game.sha` pins the imported game engine to **[4056467a](https://github.com/DomLynch/RPG-game/commit/4056467af826b03166a575002f7a4f4b04f9dfe7)**, the source checked against live on October 4. No game code is changed. The earlier game-repo draft PR #1374 is the provenance for the tooling now owned here; it is not needed to launch this bot.

The launcher fetches the explicit game branch and verifies the exact commit, including when upgrading an older single-branch clone. Dirty game checkouts are refused; no local edits are reset. Bot and engine revisions are recorded separately. Updating this repo never deploys frankendom.com.

**Current test build; rendered acceptance pending.** It includes corrected block-chip and landed-special accounting plus a parameterized direct-engine runner. Existing engine/build checks pass; the browser reporting fix passes 35 focused checks. Six drawing-suppressed browser diagnostic fights won against Pitborn/Centurion on the underlying game base; they do not prove rendered combat feel, full-roster acceptance or complete tactical diversity. September win claims do not validate this version.

The browser runner enforces at least two wins out of three per requested opponent and at most 20% heavy attack starts in each fight. A one-fight smoke checks that individual fight; it is not a three-fight acceptance batch. Limited observation still reads delayed semantic events and own telemetry; it is not vision/audio perception or proof of phone control comfort. The current browser policy is fixed to Easy (engine L6), longsword and its own scripted configuration; use the engine runner for explicitly selected configurations.

## Direct-engine diagnostics

This uses production Sparring rules without rendering, npm installation or a browser:

```sh
./run-sim.sh --sparring-url='/?spar=1&opponent=pitborn&difficulty=6&weapon=longsword&skill=none&special=none&yourSpecial=none' --fights=3
```

For another setup, copy the URL **after Start sparring** and quote it as `--sparring-url`. `./run-sim.sh --help` lists strategies; `--strategy='skill then light'` actually exercises an equipped skill/special. Results are under `artifacts/combat/sim-bot/`, in a new directory per invocation. Perfect-state/single-tactic diagnostics are separate from the varied browser policy; they do not demonstrate visual readability or human fun.

Registered specials must match the actual engine level's authored band. Display rank 1–10 is not engine level. This pinned source has ten playable classes and levels 1–46; the intended 50-level ladder remains a main-game discrepancy, not a bot rule change. See `docs/sim-bot.md` for limitations and configuration details. Run substantial batches/builds/captures on the shared VPS; actual Safari/iPhone checks remain device checks.

## Archived versions

`archive/run-tactical-20260924.sh` preserves the old September launcher; `archive/run-heavy-only.sh` preserves the heavy-only policy. Each uses a separate archived checkout and is never selected by the normal launcher. `run-baseline.sh` only prints a migration notice. There is one current pin and one normal browser launch command: `./run-latest.sh`.
