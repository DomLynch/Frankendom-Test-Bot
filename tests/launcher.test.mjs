import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, cpSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));

test('normal launcher refuses archived strategies and invalid observations before downloading', () => {
  for (const arg of ['--strategy=charged', '--observation=unknown']) {
    const r = spawnSync('sh', ['run-latest.sh', arg], { cwd: root, encoding: 'utf8' });
    assert.equal(r.status, 2);
    assert.doesNotMatch(r.stderr, /Cloning|Fetching/);
  }
});

test('preparation preserves a dirty game checkout and refuses an unexpected remote', () => {
  const temp = mkdtempSync(join(tmpdir(), 'frankendom-launcher-'));
  try {
    mkdirSync(join(temp, 'scripts'));
    cpSync(join(root, 'scripts/prepare-game.sh'), join(temp, 'scripts/prepare-game.sh'));
    cpSync(join(root, 'current-game.sha'), join(temp, 'current-game.sha'));
    cpSync(join(root, 'current-game.ref'), join(temp, 'current-game.ref'));
    const game = join(temp, 'game');
    mkdirSync(game);
    const git = (...args) => execFileSync('git', args, { cwd: game, stdio: 'pipe' });
    git('init');
    git('remote', 'add', 'origin', 'https://github.com/DomLynch/RPG-game.git');
    writeFileSync(join(game, 'precious.txt'), 'keep my edits');
    const run = () => spawnSync('sh', ['-ec', '. "$1/scripts/prepare-game.sh"; prepare_game "$1" engine', 'fixture', temp], { encoding: 'utf8' });
    let r = run();
    assert.equal(r.status, 2);
    assert.match(r.stderr, /checkout has changes/);
    assert.equal(readFileSync(join(game, 'precious.txt'), 'utf8'), 'keep my edits');
    git('remote', 'set-url', 'origin', 'https://example.invalid/unrelated.git');
    r = run();
    assert.equal(r.status, 2);
    assert.match(r.stderr, /Unexpected game remote/);
    assert.equal(readFileSync(join(game, 'precious.txt'), 'utf8'), 'keep my edits');
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
