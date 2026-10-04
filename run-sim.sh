#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$root/scripts/prepare-game.sh"
prepare_game "$root" engine
echo "CURRENT ENGINE DIAGNOSTIC · $sha · no browser · not visual acceptance" >&2
exec node scripts/sim-bot.mjs "$@"
