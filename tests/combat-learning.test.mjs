import test from 'node:test';
import assert from 'node:assert/strict';
import { combatLearning, attackTermination } from '../scripts/lib/combat-learning.mjs';
import fs from 'node:fs';
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

test('staggered unlanded attack is interrupted, never silently a spacing miss',()=>{
  const events=[{tick:325,type:'AttackStarted',actor:0,move:'thrust'},
    {tick:328,type:'Hit',actor:1,target:0,move:'light_left',damage:18},
    {tick:328,type:'Staggered',actor:0,ticks:90},
    {tick:400,type:'AttackStarted',actor:0,move:'thrust'}];
  const row=combatLearning(events,[],[],[]).attacks[0];
  assert.equal(row.result,'unresolved');assert.equal(row.termination.status,'interrupted');
  assert.equal(row.termination.tick,328);assert.equal(row.termination.damageReceivedUntilTermination,18);
});
test('received hit without stagger is insufficient to label an interruption',()=>{
  const start={tick:10,type:'AttackStarted',actor:0,move:'heavy_overhead'};
  const received={tick:12,type:'Hit',actor:1,target:0,damage:9};
  assert.equal(attackTermination([start,received],start,null).status,'unknown');
  const contact={tick:15,type:'Hit',actor:0,target:1,move:'heavy_overhead',damage:25};
  const t=attackTermination([start,received,contact],start,contact);
  assert.equal(t.status,'resolved');assert.equal(t.damageReceivedUntilTermination,9);
});
test('same-tick trade or parry remains a recorded resolution despite stagger order',()=>{
  const start={tick:10,type:'AttackStarted',actor:0,move:'thrust'};
  for(const contact of [{tick:20,type:'Hit',actor:0,target:1,move:'thrust',damage:11},
    {tick:20,type:'Parried',actor:1,target:0,move:'thrust'}]){
    const t=attackTermination([start,{tick:20,type:'Staggered',actor:0},contact],start,contact);
    assert.equal(t.status,'resolved');assert.equal(t.result,contact.type);
  }
});
test('feints and fight ends stay separate from interruptions and misses',()=>{
  const start={tick:10,type:'AttackStarted',actor:0,move:'light_left'};
  assert.equal(attackTermination([start,{tick:12,type:'ActionStarted',actor:0,action:'feint'}],start,null).status,'feinted');
  assert.equal(attackTermination([start,{tick:12,type:'Killed',actor:1,target:0}],start,null).status,'fight ended');
  assert.equal(attackTermination([start,{tick:12,type:'Staggered',actor:1}],start,null).status,'unknown');
  assert.equal(attackTermination([start,{tick:30,type:'Staggered',actor:0}],start,null,25).status,'unknown');
});
test('real retained Veteran loss distinguishes three interruptions from the final killing blow',()=>{
  const fight=JSON.parse(fs.readFileSync(new URL('../docs/evidence/live-retest-20261006/beginner-veteran.json',import.meta.url)));
  const r=combatLearning(fight.events,fight.decisions,fight.track,fight.defences);
  for(const tick of [325,675,830])assert.equal(r.attacks.find(a=>a.tick===tick).termination.status,'interrupted');
  assert.equal(r.attacks.find(a=>a.tick===1011).termination.status,'fight ended');
  assert.equal(Object.values(r.attackTerminations).reduce((a,b)=>a+b,0),10);
});
test('first action after defence is reported without pretending retreat was a mistake',()=>{
  const events=[{tick:185,type:'Parried',actor:0,target:1,move:'heavy_overhead'},
    {tick:195,type:'ActionStarted',actor:0,action:'roll'},
    {tick:220,type:'AttackStarted',actor:1,move:'light_left'},
    {tick:292,type:'Hit',actor:0,target:1,move:'thrust',damage:11}];
  const row=combatLearning(events,[],[],[{tick:185,type:'parry',resolutionTick:185}]).defenceOutcomes[0];
  assert.equal(row.firstOwnAction.action,'roll');assert.equal(row.firstOwnAction.beforeNextEnemyAttackStart,true);
  assert.equal(row.firstOwnAction.secondsAfterResolution,.167);
  assert.equal(row.nextUsefulHit.beforeNextThreat,false);
});
