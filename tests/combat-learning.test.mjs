import test from 'node:test';
import assert from 'node:assert/strict';
import { combatLearning } from '../scripts/lib/combat-learning.mjs';
test('losing exchange is retained in a winning fight, without duplicate guard-break damage',()=>{
  const events=[{tick:1258,type:'Hit',actor:0,target:1,move:'thrust',damage:17},
    {tick:1295,type:'GuardBroken',actor:1,target:0,move:'heavy_overhead',damage:24},
    {tick:1295,type:'Hit',actor:1,target:0,move:'heavy_overhead',damage:24}];
  const r=combatLearning(events,[],[],[]);
  assert.equal(r.trades.length,1); assert.deepEqual([r.trades[0].dealt,r.trades[0].taken,r.trades[0].netRawDamage],[17,24,-7]);
  assert.equal(r.visualCases[0].assessment,null);
});
test('dodge positioning and late re-entry stay separate from an earned punish',()=>{
  const events=[{tick:824,type:'ActionStarted',actor:0,action:'roll'},
    {tick:832,type:'AttackStarted',actor:1,move:'light_left'},
    {tick:995,type:'Hit',actor:0,target:1,move:'thrust',damage:17}];
  const track=[{tick:824,gap:1.31,radius:.16},{tick:860,gap:2.75,radius:2.66}];
  const r=combatLearning(events,[],track,[{tick:824,type:'roll',resolutionTick:null,result:'no attack in flight'}]);
  assert.equal(r.defenceOutcomes[0].nextUsefulHit.secondsAfterAction,2.85);
  assert.equal(r.defenceOutcomes[0].nextUsefulHit.beforeNextThreat,false);
  assert.equal(r.defenceOutcomes[0].positionAfter.radius,2.66);
  assert.equal(r.visualCases.find(v=>v.kind==='roll camera').tick,824);
});
test('spacing keeps perceived, sampled start/contact and reach separate',()=>{
  const r=combatLearning([{tick:261,type:'AttackStarted',actor:0,move:'light_right'},
    {tick:288,type:'AttackMissed',actor:0,move:'light_right'}],
    [{tick:260,press:'KeyF',gap:1,gapUpper:1,actualGap:2.34}],
    [{tick:260,gap:2.34,radius:1},{tick:287,gap:2.5,radius:1.1}],[],{light_right:1.8});
  assert.equal(r.attacks[0].perceivedGap,1); assert.equal(r.attacks[0].atContact.gap,2.5);
  assert.equal(r.attacks[0].atContact.sampleAgeTicks,1); assert.equal(r.attacks[0].result,'AttackMissed');
});

test('spacing attribution cannot credit an unaccepted thrust input to a slash',()=>{
  const r=combatLearning([{tick:101,type:'AttackStarted',actor:0,move:'light_right'}],
    [{tick:100,press:'KeyF',gap:1.5,actualGap:1.6},{tick:100,press:'KeyT',gap:9,actualGap:9}],[],[]);
  assert.equal(r.attacks[0].perceivedGap,1.5);
});
