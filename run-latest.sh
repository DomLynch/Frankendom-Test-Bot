#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
mode=limited
for arg do
  case "$arg" in
    --strategy=*) echo 'The current browser bot always uses tactical; historical policies are in archive/.' >&2; exit 2;;
    --observation=*) mode=${arg#*=};;
  esac
done
case "$mode" in limited|debug) ;; *) echo 'Observation must be limited or debug.' >&2; exit 2;; esac
. "$root/scripts/prepare-game.sh"
prepare_game "$root" browser
echo "CURRENT TEST BUILD · $sha · tactical · Easy · $mode observation · real rendering" >&2
exec node scripts/player-bot.mjs --strategy=tactical "$@"
