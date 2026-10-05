#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$root/scripts/prepare-game.sh"
prepare_game "$root" engine
echo "CURRENT PROFILE PILOT · $sha · direct engine, no visuals" >&2
exec node scripts/profile-pilot.mjs "$@"
