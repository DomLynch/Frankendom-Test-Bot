import test from 'node:test';
import assert from 'node:assert/strict';
import { liveAVMode, liveAVCoverage } from '../scripts/lib/live-av.mjs';

test('native AV rejects controlled frame capture and missing video, and requires research',()=>{
  const config={nativeAV:true,research:true,recordVideo:true,reviewFrames:false};
  assert.equal(liveAVMode(config),'native real-time; polling delay plus automation overhead');
  assert.equal(liveAVMode({...config,nativeAV:false}),'controlled fixed-step; not realtime FPS');
  for(const patch of [{research:false},{recordVideo:false},{reviewFrames:true}])assert.throws(()=>liveAVMode({...config,...patch}));
});
const event={tick:20,type:'Hit',actor:0,target:1,move:'thrust',damage:11};
const sample=()=>({begin:{performanceMs:1000},end:{performanceMs:1184},frames:[{tick:10,performanceMs:1000},{tick:20,performanceMs:1167},{tick:21,performanceMs:1184}],
  events:[{tick:5,type:'ActionStarted',actor:0,action:'draw'},event],audioTracks:1,
  levels:[{rms:.01,peak:.1}],visualSamples:[{tick:20}],visualErrors:[]});
test('live AV matches recorded events only within captured frames and reports cropped warmup',()=>{
  const r=liveAVCoverage(sample(),[{tick:5,type:'ActionStarted',actor:0,action:'draw'},event],20);
  assert.equal(r.eventsMatched,1);assert.equal(r.fightEventsBeforeCapture,1);
  assert.equal(r.finalTickCovered,true);assert.equal(r.nonSilent,true);
  assert.equal(r.firstRecordedTick,10);assert.equal(r.lastRecordedTick,21);
});
test('silent, missing-track, incomplete and mismatched captures cannot pass',()=>{
  assert.throws(()=>liveAVCoverage({...sample(),levels:[{rms:0,peak:0}]},[event],20));
  assert.throws(()=>liveAVCoverage({...sample(),audioTracks:0},[event],20));
  assert.throws(()=>liveAVCoverage({...sample(),frames:[{tick:10},{tick:19}]},[event],20));
  assert.throws(()=>liveAVCoverage({...sample(),events:[{...event,damage:12}]},[event],20));
  assert.throws(()=>liveAVCoverage({...sample(),visualErrors:['read failed']},[event],20));
});
test('frames rendered while recorder stop resolves cannot falsely cover the fight end',()=>{
  const r=sample();r.frames.push({tick:25,performanceMs:1250});
  assert.throws(()=>liveAVCoverage(r,[event],25),'Post-stop render is outside recorded video');
});
