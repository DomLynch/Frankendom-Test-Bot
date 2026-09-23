# Frankendom test player

The tested baseline is pinned to [Frankendom commit `0cb58427`](https://github.com/DomLynch/RPG-game/commit/0cb58427). Run `./run-baseline.sh` on a Mac with Node.js; it installs the project packages and Playwright Chromium on first use. Pass `--seed=731`, `--fights=3`, or `--out=artifacts/combat/my-run` through to the runner. It builds a local game checkout, drives Pitborn on Easy through real keyboard input, and saves fight JSON and WebM under that checkout's `artifacts/combat/` directory.

The baseline recorded one Pitborn win and two losses across three seeds. **It has not met the 70% target or covered the full roster.** Use it to test browser control and recordings while the broader player policy is developed. No production game state is changed by the runner.
