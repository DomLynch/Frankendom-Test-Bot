#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
game="$root/game"
if [ ! -d "$game/.git" ]; then
  git clone --branch combat/player-bot-v2-all-easy --single-branch https://github.com/DomLynch/RPG-game.git "$game"
fi
git -C "$game" fetch origin combat/player-bot-v2-all-easy
git -C "$game" checkout --detach 22ca94ff0d4bae9125831e45b934cd3564c5acee
cd "$game"
if [ ! -d node_modules ]; then
  npm ci
  npx playwright install chromium
fi
npm run build
node scripts/player-bot.mjs "$@"
