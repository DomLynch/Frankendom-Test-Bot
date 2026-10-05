import test from 'node:test';
import assert from 'node:assert/strict';
import {touchEffect,touchCasePassed} from '../scripts/lib/experience-probe.mjs';
test('touch reports only accepted player starts and actual contact, not request counts',()=>{
 const events=[{type:'AttackStarted',actor:1},{type:'ActionStarted',actor:0,action:'roll'},
  {type:'Parried',actor:1,target:0},{type:'Hit',actor:0,target:1,damage:11}];
 const frames=[{fighters:[{phase:'guard',guardDirection:'left',body:{x:0,z:0}}]},
  {fighters:[{phase:'ready',body:{x:3,z:4}}]}];
 const row=touchEffect(events,frames);assert.equal(row.accepted.length,1);assert.equal(row.contacts.length,2);
 assert.equal(row.displacement,5);assert.deepEqual(row.guardDirections,['left']);
 assert.deepEqual(touchEffect([],[]),{accepted:[],contacts:[],displacement:null,guardDirections:[]});
});
test('contact and cancel gates reject keypress-only evidence and enemy defence attribution',()=>{
 const empty=touchEffect([],[]);assert.equal(touchCasePassed('contact-parry',empty),false);
 assert.equal(touchCasePassed('contact-block',touchEffect([{type:'Blocked',actor:1}],[])),false);
 assert.equal(touchCasePassed('contact-block',touchEffect([{type:'Blocked',actor:0}],[])),true);
 assert.equal(touchCasePassed('cancel-heavy',touchEffect([{type:'AttackStarted',actor:0}],[])),false);
 assert.equal(touchCasePassed('short-step',touchEffect([{type:'ActionStarted',actor:0,action:'backstep'},{type:'ActionStarted',actor:0,action:'roll'}],[])),false);
});
