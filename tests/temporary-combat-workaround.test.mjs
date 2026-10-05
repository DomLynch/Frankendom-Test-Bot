import test from 'node:test';
import assert from 'node:assert/strict';
import { createSparring, probeIntent, runFight } from '../scripts/lib/sim-bot.mjs';
import { temporaryCombatIntent, WORKAROUND } from '../scripts/lib/temporary-combat-workaround.mjs';
const url = (level, weapon='longsword') => '/?' + new URLSearchParams({ spar:'1',opponent:'veteran',difficulty:String(level),weapon,skill:'none',special:'none',yourSpecial:'none' });
function scenario(level, weapon, gap) {
  const {match,config}=createSparring(url(level,weapon),731);const d=match.practice.duel;
  d.fighters[0].phase='ready';d.fighters[1].phase='ready';
  d.fighters[0].body={...d.fighters[0].body,x:0,z:gap}; d.fighters[1].body={...d.fighters[1].body,x:0,z:0};
  return {d,config,base:probeIntent(d,'light spam')};
}
test('temporary scythe workaround steps out of dead band rather than feeding empty cuts',()=>{
  const {d,config,base}=scenario(1,'scythe',1.5);assert.equal(base.action,'light');
  const choice=temporaryCombatIntent(d,config,base);assert.equal(choice.intent.action,null);assert.ok(choice.intent.move.z>0);
  const inRange=scenario(1,'scythe',2);assert.equal(temporaryCombatIntent(inRange.d,inRange.config,inRange.base).intent.action,'light');
});
test('temporary reaction workaround changes only affected cuts to an authored faster thrust',()=>{
  const low=scenario(6,'longsword',1.5);assert.deepEqual(temporaryCombatIntent(low.d,low.config,low.base).intent,low.base);
  const edge=scenario(11,'longsword',1.5);assert.deepEqual(temporaryCombatIntent(edge.d,edge.config,edge.base).intent,edge.base);
  const high=scenario(12,'longsword',1.5);const original=structuredClone(high.d);
  assert.equal(temporaryCombatIntent(high.d,high.config,high.base).intent.action,'thrust');assert.deepEqual(high.d,original);
});
test('workaround is opt-in, labelled and cannot qualify as acceptance; malformed mode rejected',()=>{
  const baseline=runFight(url(12),731,'light spam',1200);
  assert.equal(baseline.temporaryWorkaround,null);
  const variant=runFight(url(12),731,'light spam',1200,WORKAROUND);
  assert.equal(variant.temporaryWorkaround.acceptanceEligible,false);
  assert.ok(Object.values(variant.temporaryWorkaround.interventions).some(n=>n>0));
  assert.equal(variant.config.engineLevel,baseline.config.engineLevel);
  assert.deepEqual(variant.config.aiProfile,baseline.config.aiProfile);
  assert.deepEqual(variant.config.initialFighters,baseline.config.initialFighters);
  assert.throws(()=>runFight(url(12),731,'light spam',1200,'unknown'));
});
