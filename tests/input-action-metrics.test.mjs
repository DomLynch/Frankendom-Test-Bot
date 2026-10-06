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
