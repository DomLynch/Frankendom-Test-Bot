import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayerProfile, chooseProfiledAttack, profileReceipt } from '../scripts/lib/player-profiles.mjs';
import { chooseTacticalAttack } from '../scripts/lib/player-bot-policy.mjs';
const config={thrustRange:1.9,wallRadius:7,windup:{light_right:20,heavy_overhead:32},parryTicks:8};
const obs=rest=>({tick:200,hp:150,enemyHp:150,stamina:90,gap:1.5,gapUpper:1.75,radius:1,posture:0,phase:'ready',ownState:'ready',enemyPhase:'other',light:true,thrust:true,heavy:true,dodge:true,events:[],...rest});
test('advanced preserves the existing tactical choices and memory exactly',()=>{
 const p=createPlayerProfile('advanced',731),a={},b={};
 for(let tick=200;tick<350;tick+=4){const o=obs({tick,events:tick===200?[{type:'AttackStarted',actor:1,tick:180,move:'light_right',direction:'right'}]:[],enemyPhase:tick<220?'attack':'other'});assert.deepEqual(chooseProfiledAttack(o,a,p,config),chooseTacticalAttack(o,b,Math.ceil(p.reactionMs / 1000 * 60),config));assert.deepEqual(a,b);}
 assert.equal(p.reactionMs,180);assert.deepEqual(p.interventions,{});
});
test('personas reproduce seeded errors without mutating observations or consuming game RNG',()=>{
 const p=createPlayerProfile('beginner',731),q=createPlayerProfile('beginner',731);assert.equal(p.reactionMs,q.reactionMs);
 const a={},b={},o=obs({stamina:35,gap:1.8,gapUpper:2.05}),saved=structuredClone(o);
 assert.deepEqual(chooseProfiledAttack(o,a,p,config),chooseProfiledAttack(o,b,q,config));assert.deepEqual(o,saved);
 assert.notDeepEqual(chooseProfiledAttack(o,{},createPlayerProfile('advanced',731),config),chooseProfiledAttack(o,{},createPlayerProfile('beginner',731),config));
});
test('beginner directional mistakes persist for the same observed threat and are uniquely credited',()=>{
 let found=false;
 for(let seed=1;seed<30&&!found;seed++){
  const p=createPlayerProfile('beginner',seed),m={},o=obs({tick:250,enemyPhase:'attack',events:[{type:'AttackStarted',actor:1,tick:200,move:'light_right',direction:'right'}]});
  const first=chooseProfiledAttack(o,m,p,config);
  if(first.keys.includes('ArrowRight')){const later=chooseProfiledAttack({...o,tick:254,events:[]},m,p,config);assert.ok(later.keys.includes('ArrowRight'));assert.equal(profileReceipt(p).interventions['wrong directional guard'],1);found=true;}
 }
 assert.ok(found);
});
test('profiles refuse invalid settings and never send inputs after death',()=>{
 assert.throws(()=>createPlayerProfile('expert',731));assert.throws(()=>createPlayerProfile('beginner',-1));assert.throws(()=>createPlayerProfile('advanced',731,20));
 for(const name of ['beginner','intermediate','advanced'])assert.deepEqual(chooseProfiledAttack(obs({hp:0}),{},createPlayerProfile(name,731),config).keys,[]);
});
