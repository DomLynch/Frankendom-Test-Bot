#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
game="$root/game"
sha=$(cat "$root/current-game.sha")
mode=limited
for arg do
  case "$arg" in
    --strategy=*) echo 'run-latest.sh always uses tactical; use archive/run-heavy-only.sh for the old policy' >&2; exit 2;;
    --observation=*) mode=${arg#*=};;
  esac
done
if [ ! -d "$game/.git" ]; then
  git clone --branch codex/01a0ceea/task-3 --single-branch https://github.com/DomLynch/RPG-game.git "$game"
fi
if [ -n "$(git -C "$game" status --porcelain)" ]; then
  echo 'Local game checkout has changes; resolve them before running the pinned bot.' >&2
  exit 2
fi
git -C "$game" fetch origin codex/01a0ceea/task-3
git -C "$game" checkout --detach "$sha"
if [ "$(git -C "$game" rev-parse HEAD)" != "$sha" ]; then
  echo 'Pinned game revision was not checked out.' >&2
  exit 2
fi
cd "$game"
lock_hash=$(shasum -a 256 package-lock.json | cut -d ' ' -f 1)
if [ ! -d node_modules ] || [ "$(cat node_modules/.bot-lock-hash 2>/dev/null || :)" != "$lock_hash" ]; then
  npm ci
  npx playwright install chromium
  printf '%s\n' "$lock_hash" > node_modules/.bot-lock-hash
fi
if [ ! -f dist/index.html ] || [ "$(cat dist/.bot-revision 2>/dev/null || :)" != "$sha" ]; then
  npm run build
  printf '%s\n' "$sha" > dist/.bot-revision
fi
echo "LATEST tactical bot · $sha · Easy · $mode observation" >&2
exec node scripts/player-bot.mjs --strategy=tactical "$@"
