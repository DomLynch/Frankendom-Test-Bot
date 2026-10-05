#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
. "$root/scripts/prepare-game.sh"
prepare_game "$root" browser
node scripts/render-probe.mjs "$@"
