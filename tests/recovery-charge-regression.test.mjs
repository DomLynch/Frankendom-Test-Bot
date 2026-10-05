import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseTacticalAttack } from '../scripts/lib/player-bot-policy.mjs';
import { limitedObservation, perceivable } from '../scripts/lib/player-bot-observation.mjs';
import { createSparring } from '../scripts/lib/sim-bot.mjs';
import { keyboardIntent } from '../scripts/lib/profile-fight.mjs';
import { accepts } from '../game/src/combat.ts';
import { cuesFor } from '../game/src/audio/cues.ts';
const cfg={wallRadius:7.15,thrustRange:1.9,windup:{heavy_overhead:50}};
const own = extra => ({tick:100,hp:62,enemyHp:6,stamina:44,maxStamina:44,posture:0,gap:1.8,gapUpper:1.8,radius:1,phase:'ready',ownState:'ready',enemyPhase:'other',thrust:true,light:true,heavy:true,events:[],...extra});
test('wounded 44 ceiling permits an actual legal thrust, while below ceiling still recovers',()=>{
 const {match}=createSparring('/?spar=1&opponent=goblin&difficulty=6&weapon=longsword&skill=none&special=none&yourSpecial=none',2026100507);
 const p=match.practice.duel.fighters[0];p.phase='ready';p.maxStamina=44;p.stamina=44;
 const decision=chooseTacticalAttack(own({thrust:accepts(match.practice,'thrust')}),{},11,cfg);
 assert.equal(decision.press,'KeyT');
 match.step(()=>keyboardIntent(decision));
 assert.ok(match.fightLog.some(e=>e.type==='AttackStarted'&&e.actor===0&&e.move==='thrust'));
 assert.equal(chooseTacticalAttack(own({stamina:43}),{},11,cfg).press,null);
 assert.equal(chooseTacticalAttack(own({maxStamina:100}),{},11,cfg).press,null,'healthy 44 still needs reserve');
 assert.equal(chooseTacticalAttack(own({thrust:false,light:false,heavy:false}),{},11,cfg).press,null,'never bypass legal action state');
});
test('wounded ceiling can clear held worn state after posture recovers',()=>{
 const state={worn:true};
 chooseTacticalAttack(own({posture:20}),state,11,{...cfg,holdWorn:true});
 assert.equal(state.worn,false);
});
test('limited ceiling comes from current visible shaded bar, not opponent hidden state',()=>{
 const seen=limitedObservation(own({tick:100,meterStamina:44,meterMaxStamina:44,maxStamina:100,enemyMaxStamina:80}),{},11);
 assert.equal(seen.maxStamina,44);
});
test('charge semantics match actual enemy onset and own completion, not light holds or enemy completion',()=>{
 const events=[{tick:1165,type:'Charging',actor:1,move:'heavy_overhead'},
 {tick:1194,type:'Charged',actor:1,move:'heavy_overhead'},
 {tick:1200,type:'Charging',actor:1,move:'light_right'},
 {tick:1201,type:'Charging',actor:0,move:'heavy_overhead'},
 {tick:1230,type:'Charged',actor:0,move:'heavy_overhead'}];
 assert.ok(cuesFor([events[0]]).some(c=>c.name==='charge_foe'));
 assert.deepEqual(perceivable(events),[{tick:1165,type:'ChargeCue',actor:1,cue:'charge_foe'},{tick:1230,type:'ChargeCue',actor:0,cue:'charge'}]);
});
test('enemy cue retains reaction delay and survives simultaneous own charging without completing our charge',()=>{
 const memory={},state={charging:true},raw=own({stamina:80,maxStamina:100,phase:'attack',ownState:'attack'});
 const step=(tick,events=[])=>chooseTacticalAttack(limitedObservation({...raw,tick,events},memory,11),state,11,cfg);
 step(1165,[{tick:1150,type:'AttackStarted',actor:1,move:'heavy_overhead',direction:'overhead'},{tick:1165,type:'Charging',actor:1,move:'heavy_overhead'}]);
 step(1175);assert.equal(state.chargedThreat,undefined,'not before delayed cue arrives');
 step(1176);assert.equal(state.chargedThreat?.tick,1165);
 assert.notEqual(state.charged,true,'enemy sound must not release our own heavy');
 const observed=limitedObservation({...raw,tick:1190,phase:'ready',ownState:'ready',events:[]},memory,11);
 assert.match(chooseTacticalAttack(observed,state,11,cfg).reason,/charged overhead \(sound\)/);
});
