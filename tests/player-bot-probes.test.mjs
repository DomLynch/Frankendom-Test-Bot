import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseProbe } from '../scripts/lib/player-bot-probes.mjs';
import { limitedObservation } from '../scripts/lib/player-bot-observation.mjs';
const config = { thrustRange: 1.9, wallRadius: 7, windup: { light_right: 20 }, parryTicks: 8 };
const obs = rest => ({ tick: 116, hp: 100, enemyHp: 100, phase: 'ready', ownState: 'ready', stamina: 90, radius: 1,
  gap: 1.5, enemyPhase: 'attack', events: [{ type: 'AttackStarted', actor: 1, tick: 100, move: 'light_right', direction: 'right' }], ...rest });
test('parry probe waits, then holds the matching side before contact', () => {
  const state = {};
  assert.equal(chooseProbe(obs({tick:112}), state, 11, config, 'parry').press, null);
  assert.deepEqual(chooseProbe(obs({events:[]}), state, 11, config, 'parry').keys, ['KeyQ', 'ArrowLeft']);
});
test('short step has no movement while a roll holds lateral movement', () => {
  assert.deepEqual(chooseProbe(obs({}), {}, 11, config, 'shortstep').keys, []);
  assert.deepEqual(chooseProbe(obs({}), {}, 11, config, 'roll').keys, ['KeyA']);
});
test('kick requires a confirmed guard and legal close range, once per block', () => {
  const state = {};
  const close = obs({ enemyPhase: 'ready', gap: 1, kick: true, events: [{ tick:110, type:'Blocked', actor:1 }] });
  assert.equal(chooseProbe(close, state, 11, config, 'kick').press, 'KeyC');
  assert.notEqual(chooseProbe({...close,events:[]}, state, 11, config, 'kick').press, 'KeyC');
  assert.notEqual(chooseProbe({...close,gap:2}, {}, 11, config, 'kick').press, 'KeyC');
});

test('guard probe terminates after three own guard entries even when limited mode strips action events', () => {
  const state={}, perception={};
  for(let i=0;i<3;i++) {
    chooseProbe(limitedObservation(obs({tick:200+i*50,ownState:'ready',enemyPhase:'ready',events:[]}),perception,11),state,11,config,'guard');
    chooseProbe(limitedObservation(obs({tick:201+i*50,ownState:'guard',phase:'guard',events:[{tick:201+i*50,type:'ActionStarted',actor:0,action:'parry'}]}),perception,11),state,11,config,'guard');
  }
  assert.equal(state.probes,3);
  assert.doesNotMatch(chooseProbe(obs({tick:400,events:[]}),state,11,config,'guard').reason,/EXPERIMENT/);
});
