import test from 'node:test';
import assert from 'node:assert/strict';
import { keyboardIntent, runProfileFight } from '../scripts/lib/profile-fight.mjs';
const search = '/?spar=1&opponent=pitborn&difficulty=6&weapon=longsword&skill=none&special=none&yourSpecial=none';
test('keyboard edges, directional guard and held heavy match input semantics', () => {
  const guard = keyboardIntent({keys:['KeyQ','ArrowLeft'],press:null});
  assert.equal(guard.action,'parry'); assert.equal(guard.guardDirection,'left');
  assert.equal(keyboardIntent({keys:['KeyQ','ArrowLeft'],press:null},['KeyQ']).action,null);
  assert.equal(keyboardIntent({keys:['KeyA'],press:'KeyE'}).action,'dodge');
  assert.equal(keyboardIntent({keys:[],press:'KeyE'}).action,'backstep');
  assert.equal(keyboardIntent({keys:['KeyG'],press:null}).action,'heavy');
  const held = keyboardIntent({keys:['KeyG'],press:null},['KeyG']);
  assert.equal(held.action,null); assert.equal(held.held,true);
  assert.equal(keyboardIntent({keys:[],press:null},['KeyG']).held,false);
});
test('production engine pilot replays deterministically and keeps actual starts', () => {
  const a = runProfileFight(search,2026100501,'beginner',600);
  const b = runProfileFight(search,2026100501,'beginner',600);
  assert.deepEqual(a,b);
  assert.equal(a.attackMix.attacks,a.events.filter(e=>e.type==='AttackStarted'&&e.actor===0).length);
  assert.equal(a.temporaryWorkaround,null); assert.equal(a.observation.includes('semantic'),true);
  assert.ok(a.events.some(e=>e.type==='ActionStarted'&&e.action==='draw'));
});
test('unsupported loadout/level is rejected rather than silently borrowing longsword ranges', () => {
  assert.throws(()=>runProfileFight(search.replace('difficulty=6','difficulty=12'),1,'advanced'),/level6/);
  assert.throws(()=>runProfileFight(search.replace('weapon=longsword','weapon=scythe'),1,'advanced'),/longsword/);
});

test('pilot refuses duplicate cases and never overwrites retained results', async () => {
  const { mkdtempSync, writeFileSync, readFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const script = new URL('../scripts/profile-pilot.mjs',import.meta.url);
  const out = mkdtempSync(join(tmpdir(),'profile-pilot-'));
  try {
    writeFileSync(join(out,'summary.json'),'retained loss');
    const saved = spawnSync(process.execPath,[script.pathname,'--out='+out],{encoding:'utf8'});
    assert.notEqual(saved.status,0); assert.match(saved.stderr,/already contains/);
    assert.equal(readFileSync(join(out,'summary.json'),'utf8'),'retained loss');
    const duplicate = spawnSync(process.execPath,[script.pathname,'--players=beginner,beginner'],{encoding:'utf8'});
    assert.notEqual(duplicate.status,0); assert.match(duplicate.stderr,/Duplicate/);
  } finally { rmSync(out,{recursive:true,force:true}); }
});
