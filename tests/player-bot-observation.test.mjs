import assert from 'node:assert/strict';
import test from 'node:test';
import { limitedObservation, perceivable } from '../scripts/lib/player-bot-observation.mjs';
import { chooseTacticalAttack } from '../scripts/lib/player-bot-policy.mjs';

test('a delayed closing-range reading does not justify a swing at a retreating opponent', () => {
  const memory = {}, raw = { hp: 150, enemyHp: 190, phase: 'ready', ownState: 'ready', stamina: 100,
    radius: 3, events: [], light: true, thrust: true, heavy: true };
  limitedObservation({ ...raw, tick: 100, gap: 1 }, memory, 12);
  limitedObservation({ ...raw, tick: 112, gap: 1.5 }, memory, 12);
  const seen = limitedObservation({ ...raw, tick: 124, gap: 2.15 }, memory, 12);
  assert.equal(seen.gap, 1.5);
  assert.equal(seen.gapObservedTick, 112);
  assert.equal(seen.gapUpper, 2.25);
  const config = { thrustRange: 1.9, wallRadius: 7.15 };
  assert.equal(chooseTacticalAttack(seen, {}, 12, config).press, null);
  assert.deepEqual(chooseTacticalAttack(seen, {}, 12, config).keys, ['KeyW']);
  assert.equal(chooseTacticalAttack({ ...seen, gapUpper: undefined }, {}, 12, config).press, 'KeyF', 'old point estimate would swing');
});

test('spacing forecast never uses an undelayed exact gap or assumes a closing trend continues', () => {
  const observe = current => {
    const memory = {}, raw = { radius: 3, events: [] };
    limitedObservation({ ...raw, tick: 100, gap: 2 }, memory, 12);
    limitedObservation({ ...raw, tick: 112, gap: 1.5 }, memory, 12);
    return limitedObservation({ ...raw, tick: 124, gap: current }, memory, 12);
  };
  assert.equal(observe(.9).gapUpper, 1.75);
  assert.equal(observe(9).gapUpper, 1.75);
});

test('limited observations see a swing from its seen start to its seen end, delayed, and stop immediately on death', () => {
  const memory = {};
  const first = limitedObservation({ tick: 100, gap: 2.26, radius: 3.1, events: [], hp: 50, stamina: 80, meterStamina: 79 }, memory, 12);
  assert.equal(first.gap, 2.5);
  assert.equal(first.enemyPhase, 'other');
  assert.equal(first.stamina, 79, 'stamina comes from the meter, not the debug line');
  const tell = limitedObservation({ tick: 108, gap: 1.1, radius: 4, events: [{ tick: 108, type: 'AttackStarted', actor: 1, move: 'heavy_overhead' }], hp: 40 }, memory, 12);
  assert.equal(tell.gap, 2.5);
  assert.equal(tell.enemyPhase, 'other', 'the threat is not seen before the reaction time');
  assert.deepEqual(tell.events, []);
  const later = limitedObservation({ tick: 120, gap: 0.8, radius: 4, events: [{ tick: 115, type: 'AttackMissed', actor: 1 }], hp: 0 }, memory, 12);
  assert.equal(later.gap, 1);
  assert.equal(later.hp, 0);
  assert.equal(later.enemyPhase, 'attack');
  assert.deepEqual(later.events.map(e => e.type), ['AttackStarted']);
  const after = limitedObservation({ tick: 128, gap: 0.8, radius: 4, events: [], hp: 0 }, memory, 12);
  assert.equal(after.enemyPhase, 'other', 'the seen whiff ends the swing');
  assert.ok(!('threat' in after), 'no hidden DOM flag is read');
});

test('only perceivable events and fields reach the bot', () => {
  const seen = perceivable([
    { tick: 1, type: 'Charging', actor: 1, move: 'heavy_overhead' },
    { tick: 2, type: 'Charged', actor: 1, move: 'heavy_overhead' },
    { tick: 3, type: 'AttackActive', actor: 1, move: 'heavy_overhead' },
    { tick: 4, type: 'Hit', actor: 1, target: 0, move: 'heavy_overhead', damage: 30, charged: true, location: 'torso' },
    { tick: 5, type: 'ActionStarted', actor: 1, action: 'feint' },
    { tick: 6, type: 'ActionStarted', actor: 0, action: 'roll' },
    { tick: 7, type: 'StaminaExhausted', actor: 1 },
  ]);
  assert.deepEqual(seen, [
    { tick: 1, type: 'ChargeCue', actor: 1, cue: 'charge_foe' },
    { tick: 4, type: 'Hit', actor: 1, target: 0, move: 'heavy_overhead' },
    { tick: 6, type: 'ActionStarted', actor: 0, action: 'roll' },
  ]);
});

test('limited observation preserves a charge across own contact until the enemy actually resolves or staggers', async () => {
  const {createPlayerProfile,chooseProfiledAttack}=await import('../scripts/lib/player-profiles.mjs');
  const memory={},state={},profile=createPlayerProfile('advanced',2026100502);
  const config={wallRadius:7.15,thrustRange:1.9,windup:{heavy_overhead:50}};
  const raw={gap:1.3,radius:1,hp:100,enemyHp:100,stamina:80,meterStamina:80,phase:'ready',ownState:'ready',heavy:true,thrust:true,light:true};
  const step=(tick,events=[])=>chooseProfiledAttack(limitedObservation({...raw,tick,events},memory,11),state,profile,config);
  step(1241,[{tick:1230,type:'AttackStarted',actor:1,move:'heavy_overhead',direction:'overhead'}]);
  step(1269,[{tick:1258,type:'Hit',actor:0,target:1,move:'thrust',damage:17,stop:true}]);
  assert.match(step(1284,[{tick:1273,type:'Charging',actor:1,move:'heavy_overhead'}]).reason,/charged overhead/);
  assert.equal(memory.swing,1230);
  step(1306,[{tick:1295,type:'Hit',actor:1,target:0,move:'heavy_overhead',damage:24}]);
  assert.equal(memory.swing,null);
  step(1321,[{tick:1310,type:'AttackStarted',actor:1,move:'heavy_overhead',direction:'overhead'}]);
  step(1341,[{tick:1330,type:'Staggered',actor:1}]);
  assert.equal(memory.swing,null);
});
