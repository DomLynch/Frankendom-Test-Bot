import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaPolicyGeometry } from '../scripts/lib/arena-policy-geometry.mjs';
import { BASE_RADIUS, WALL_INNER, BODY_RADIUS, ARENA_ONE_SCALE, PLAY_SCALE, RADIUS, LATE_NOTICE, setPlayScale, setLateNotice } from '../game/src/play-radius.ts';

test('browser boundary settings follow each current arena regardless of prior fights', () => {
  setPlayScale(.5); setLateNotice(false);
  const saved = { PLAY_SCALE, RADIUS, LATE_NOTICE };
  const small = WALL_INNER * ARENA_ONE_SCALE - BODY_RADIUS;
  try {
    for (const opponent of ['veteran', 'goblin', 'pitborn', 'executioner', 'veteran']) {
      const geometry = arenaPolicyGeometry(opponent);
      assert.equal(geometry.arenaRadius, ['veteran', 'pitborn'].includes(opponent) ? small : BASE_RADIUS);
      assert.ok(geometry.wallRadius > 0 && geometry.wallRadius < geometry.arenaRadius);
      assert.deepEqual({ PLAY_SCALE, RADIUS, LATE_NOTICE }, saved, 'config must not mutate the active engine');
    }
  } finally { setPlayScale(1); setLateNotice(false); }
});
