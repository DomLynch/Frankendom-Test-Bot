import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraTarget, installCameraLab, horizontalBasis } from '../scripts/lib/camera-lab.mjs';

test('optical basis follows actual quaternion rather than orbital yaw',()=>{
 assert.deepEqual(horizontalBasis([0,0,0,1]),{forward:[-0,-1],right:[1,0]});
 const {forward,right}=horizontalBasis([0,Math.sin(Math.PI/4),0,Math.cos(Math.PI/4)]);
 assert.ok(Math.abs(forward[0]+1)<1e-9&&Math.abs(forward[1])<1e-9);
 assert.ok(Math.abs(right[0])<1e-9&&Math.abs(right[1]+1)<1e-9);
});
test('vertical optical direction cannot masquerade as a usable movement axis',()=>{
 assert.equal(horizontalBasis([Math.sin(Math.PI/4),0,0,Math.cos(Math.PI/4)]).forward,null);
});

test('tracking takes short arc across angle wrap and obeys turn speed',()=>{
 const old={x:0,y:4,z:0,yaw:Math.PI-.01};
 const next=cameraTarget({x:0,z:0},{x:.02,z:2},'elevated',old,1/60);
 assert.ok(Math.abs(next.yaw-old.yaw)<=2.1/60);
 assert.ok(next.yaw>old.yaw);
});
test('coincident fighters hold stable yaw; target and eye remain finite',()=>{
 const prev={x:1,y:4,z:2,yaw:1};
 const p={x:8,z:8},next=cameraTarget(p,p,'shoulder',prev,1/60);
 assert.equal(next.yaw,prev.yaw);assert.ok(Object.values(next).every(Number.isFinite));
});
test('camera stays inside arena clamp and does not mutate fighter positions',()=>{
 const p=Object.freeze({x:9,z:0}),e=Object.freeze({x:7,z:0});
 for(const preset of ['elevated','shoulder']){
  const pose=cameraTarget(p,e,preset);assert.ok(Math.hypot(pose.x,pose.z)<=11.5+1e-9);
  assert.deepEqual(p,{x:9,z:0});
 }
});
test('invalid camera inputs cannot leak nonfinite poses',()=>{
 assert.throws(()=>cameraTarget({x:NaN,z:0},{x:1,z:1},'elevated'));
 assert.throws(()=>cameraTarget({x:0,z:0},{x:1,z:1},'unknown'));
 assert.throws(()=>cameraTarget({x:0,z:0},{x:1,z:1},'elevated',null,.2));
});

test('failed draw restores camera and uninstall restores original renderer methods',t=>{
 const saved=Object.fromEntries(['location','__view','__cameraLab'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 t.after(()=>{for(const [k,d] of Object.entries(saved)) {if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}});
 const vector=(...v)=>({v,clone(){return vector(...this.v);},copy(b){this.v=[...b.v];return this;},
   set(...v){this.v=v;return this;},project(){return {x:0,y:0,z:0};},toArray(){return [...this.v];}});
 const camera={position:vector(1,2,3),quaternion:vector(0,0,0,1),up:vector(0,1,0),updateMatrixWorld(){}};
 const draw=(_scene,c)=>{c.position.set(99,99,99);c.quaternion.set(1,1,1,1);c.up.set(1,0,0);throw Error('lost graphics context');};
 const view={yaw:0,renderer:{render:draw},render(state,lock,dt,practice){return this.renderer.render({},camera);}};
 Object.defineProperty(globalThis,'location',{value:{hostname:'127.0.0.1',search:'?debug=1'},configurable:true});
 Object.defineProperty(globalThis,'__view',{value:view,configurable:true});
 const original=view.render;installCameraLab('current');
 const practice={duel:{tick:1,fighters:[{body:{x:0,z:0}},{body:{x:1,z:1}}]},events:[]};
 assert.throws(()=>view.render({},true,1/60,practice),/lost graphics context/);
 assert.deepEqual(camera.position.toArray(),[1,2,3]);assert.deepEqual(camera.quaternion.toArray(),[0,0,0,1]);assert.deepEqual(camera.up.toArray(),[0,1,0]);
 globalThis.__cameraLab.uninstall();assert.equal(view.render,original);assert.equal(view.renderer.render,draw);
 assert.equal(globalThis.__cameraLab,undefined);
});
