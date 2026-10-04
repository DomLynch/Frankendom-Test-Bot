#!/bin/sh
# Shared immutable checkout; caller supplies launcher root and browser/engine mode.
prepare_game() {
  root=$1
  preparation=$2
  command -v git >/dev/null 2>&1 || { echo 'Install Git before running the bot.' >&2; return 2; }
  command -v node >/dev/null 2>&1 || { echo 'Install Node.js 22.18 or newer before running the bot.' >&2; return 2; }
  node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 18)) { console.error("Node.js 22.18 or newer is required."); process.exit(2); }'
  sha=$(cat "$root/current-game.sha")
  ref=$(cat "$root/current-game.ref")
  printf '%s\n' "$sha" | LC_ALL=C grep -Eq '^[0-9a-f]{40}$' || { echo 'Invalid current-game.sha; refusing to choose another version.' >&2; return 2; }
  game="$root/game"
  if [ ! -e "$game" ]; then
    git clone --depth=1 --branch "$ref" --single-branch https://github.com/DomLynch/RPG-game.git "$game"
  fi
  if [ ! -d "$game/.git" ]; then
    echo 'game/ must be a Git checkout; preserve or relocate the existing folder first.' >&2
    return 2
  fi
  if [ "$(git -C "$game" remote get-url origin)" != 'https://github.com/DomLynch/RPG-game.git' ]; then
    echo 'Unexpected game remote; refusing to use or modify this checkout.' >&2
    return 2
  fi
  if [ -n "$(git -C "$game" status --porcelain)" ]; then
    echo 'Local game checkout has changes; preserve them before running the pinned bot.' >&2
    return 2
  fi
  # Fetch the explicit game branch even when an old clone was single-branch.
  git -C "$game" fetch --depth=1 origin "$ref"
  if ! git -C "$game" cat-file -e "$sha^{commit}" 2>/dev/null; then
    git -C "$game" fetch --depth=1 origin "$sha"
  fi
  git -C "$game" -c core.hooksPath=/dev/null checkout --detach "$sha"
  [ "$(git -C "$game" rev-parse HEAD)" = "$sha" ] || { echo 'Pinned revision mismatch.' >&2; return 2; }
  cd "$game"
  if [ "$preparation" = browser ]; then
    command -v npm >/dev/null 2>&1 || { echo 'Install npm with Node.js.' >&2; return 2; }
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
    cd "$root"
    bot_lock_hash=$(shasum -a 256 package-lock.json | cut -d ' ' -f 1)
    if [ ! -d node_modules ] || [ "$(cat node_modules/.bot-lock-hash 2>/dev/null || :)" != "$bot_lock_hash" ]; then
      npm ci
      printf '%s\n' "$bot_lock_hash" > node_modules/.bot-lock-hash
    fi
  fi
  cd "$root"
}
