import test from 'node:test';import assert from 'node:assert/strict';
import {inputActionMetrics} from '../scripts/lib/input-action-metrics.mjs';
const key=(code,time,type='keydown',extra={})=>({code,performanceMs:time,type,repeat:false,isTrusted:true,...extra});
const event=(tick,time,fields)=>({dispatchPerformanceMs:time,event:{tick,actor:0,...fields}});
const receipt=(keyboard,eventTimeline)=>({keyboard,eventTimeline,begin:{performanceMs:0},end:{performanceMs:2000}});
test('heavy counter links actual KeyG receipt to acceptance and preserves its consequence',()=>{
 const r=inputActionMetrics(receipt([key('KeyG',100)],[event(8,116,{type:'AttackStarted',move:'heavy_counter'})]),
  {attacks:[{tick:8,move:'heavy_counter',result:'Hit',termination:{status:'resolved'}}]});
 assert.equal(r.medianReceivedToDispatchMs,16);assert.equal(r.actions[0].attackResult,'Hit');
 assert.equal(r.actions[0].attackTermination.status,'resolved');assert.equal(r.unmatched.length,0);
});
test('a thrust key cannot explain a slash, and events before a key never acquire negative delay',()=>{
 const r=inputActionMetrics(receipt([key('KeyT',120)],[event(5,100,{type:'AttackStarted',move:'thrust'}),event(8,140,{type:'AttackStarted',move:'light_left'})]));
 assert.equal(r.candidateLinkedActions,0);assert.equal(r.medianReceivedToDispatchMs,null);assert.equal(r.unmatched.length,1);
});
test('one edge is consumed once; later held guard does not become a long input latency',()=>{
 const r=inputActionMetrics(receipt([key('KeyQ',100)],[event(8,110,{type:'ActionStarted',action:'parry'}),event(70,1200,{type:'ActionStarted',action:'guard'})]));
 assert.equal(r.actions[1].association,'held guard without a new keydown');assert.equal(r.actions[1].receivedToDispatchMs,null);
 const released=inputActionMetrics(receipt([key('KeyQ',100),key('KeyQ',900,'keyup')],[event(70,1200,{type:'ActionStarted',action:'guard'})]));
 assert.equal(released.actions[0].association,'unattributed');
});
test('autorepeats and untrusted script events are not actual fresh action requests',()=>{
 const r=inputActionMetrics(receipt([key('KeyF',100,'keydown',{repeat:true}),key('KeyF',110,'keydown',{isTrusted:false})],[]));assert.equal(r.requests,0);
});
test('unaccepted request and truncated capture stay unknown, not proof of a game bug',()=>{
 const r=inputActionMetrics(receipt([key('KeyC',100),key('KeyF',1950)],[]));
 assert.equal(r.unmatched[0].status,'no matching accepted action observed');assert.match(r.unmatched[1].status,/capture ends/);
 assert.equal(inputActionMetrics({}).available,false);
});
test('unmatched defence retains nearest earlier own-state sample and its age, not a refusal cause',()=>{
 const r=receipt([key('KeyQ',100)],[]);
 r.frames=[{performanceMs:95,tick:44,lastDrawnTick:43,fighters:[{phase:'hurt',age:0,stamina:23.4,maxStamina:68,health:77,stun:24,parryCooldown:0,buffer:null}]},
  {performanceMs:101,tick:45,fighters:[{phase:'ready',stamina:80}]}];
 const result=inputActionMetrics(r);const c=result.unmatched[0].priorOwnSample;
 assert.equal(c.ageMs,5);assert.equal(c.tick,44);assert.equal(c.lastDrawnTick,43);
 assert.equal(c.state.phase,'hurt');assert.equal(c.state.stamina,23.4);assert.equal(c.state.maxStamina,68);
 assert.equal(result.unmatched[0].status,'no matching accepted action observed');
 assert.equal('refusalReason' in result.unmatched[0],false);
});
test('accepted attack gets pre-key context, not the later state at batched dispatch',()=>{
 const r=receipt([key('KeyT',100)],[event(48,120,{type:'AttackStarted',move:'thrust'})]);
 r.frames=[{performanceMs:90,tick:42,fighters:[{phase:'ready',age:3,stamina:60}]},
  {performanceMs:110,tick:47,fighters:[{phase:'attack',stamina:40}]}];
 const result=inputActionMetrics(r,{attacks:[{tick:48,move:'thrust',termination:{status:'interrupted'}}]});
 assert.equal(result.actions[0].priorOwnSample.state.phase,'ready');
 assert.equal(result.actions[0].priorOwnSample.ageMs,10);
 assert.equal(result.actions[0].attackTermination.status,'interrupted');
});
test('out-of-order recording samples select closest prior timestamp without mutating raw frames',()=>{
 const r=receipt([key('KeyE',100)],[]);
 r.frames=[{performanceMs:99,tick:7,fighters:[{phase:'ready'}]},
  {performanceMs:80,tick:4,fighters:[{phase:'hurt'}]}];
 const original=JSON.stringify(r.frames);
 assert.equal(inputActionMetrics(r).unmatched[0].priorOwnSample.tick,7);
 assert.equal(JSON.stringify(r.frames),original);
});
test('missing, future-only and out-of-recording state stay unknown; stale state keeps its age',()=>{
 const r=receipt([key('KeyC',1000)],[]);
 assert.equal(inputActionMetrics(r).unmatched[0].priorOwnSample,null);
 r.frames=[{performanceMs:-1,tick:0,fighters:[{phase:'ready'}]},
  {performanceMs:1001,tick:50,fighters:[{phase:'ready'}]}];
 assert.equal(inputActionMetrics(r).unmatched[0].priorOwnSample,null);
 r.frames.push({performanceMs:1,tick:1,fighters:[{phase:'ready'}]});
 assert.equal(inputActionMetrics(r).unmatched[0].priorOwnSample.ageMs,999);
});
