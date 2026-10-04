#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root"
mkdir -p artifacts/launcher-check
for file in run-latest.sh run-sim.sh scripts/prepare-game.sh run-baseline.sh archive/run-heavy-only.sh archive/run-tactical-20260924.sh; do
  sh -n "$file"
done
./run-sim.sh --sparring-url='/?spar=1&opponent=pitborn&difficulty=6&weapon=longsword&skill=none&special=none&yourSpecial=none' --fights=1 --out=artifacts/launcher-check/engine > artifacts/launcher-check/engine.log 2>&1
. "$root/scripts/prepare-game.sh"
prepare_game "$root" browser > artifacts/launcher-check/setup.log 2>&1
npm test > artifacts/launcher-check/tests.log 2>&1
# Real rendering remains enabled. Never substitute a drawing-suppressed run.
set +e
timeout 240 ./run-latest.sh --smoke --no-video --step-ms=64 --out=artifacts/launcher-check/browser > artifacts/launcher-check/browser.log 2>&1
status=$?
set -e
printf '%s\n' "$status" > artifacts/launcher-check/browser.exit
exit "$status"
