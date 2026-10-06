import test from 'node:test';
import assert from 'node:assert/strict';
import {visualPixelStats,audioSpectrumStats,sensesMetrics} from '../scripts/lib/player-senses-metrics.mjs';

test('rendered red coverage uses pixel centres and correct bottom-up orientation',()=>{
  const pixels=Uint8Array.from([0,0,0,255,0,0,0,255,255,0,0,255,0,0,0,255]);
  const stats=visualPixelStats(pixels,2,2,{enemyHeadApprox:{left:0,right:.5,top:0,bottom:.5}},1);
  assert.equal(stats.redDominantFraction,.25);
  assert.equal(stats.regions.enemyHeadApprox.samples,1);
  assert.equal(stats.regions.enemyHeadApprox.redDominantFraction,1);
});
test('outside-frame ROI and invalid pixels never become a visibility success',()=>{
  const stats=visualPixelStats(new Uint8Array(16),2,2,{enemyHeadApprox:{left:-5,right:-4,top:0,bottom:1}},1);
  assert.equal(stats.regions.enemyHeadApprox.redDominantFraction,null);
  assert.throws(()=>visualPixelStats(new Uint8Array(4),2,2),/Invalid/);
});
test('equal power at2kHz and6kHz has4kHz centroid and half treble; silence is unknown',()=>{
  const stats=audioSpectrumStats([-Infinity,-10,-Infinity,-10],16000);
  assert.ok(Math.abs(stats.spectralCentroidHz-4000)<1e-9);
  assert.equal(stats.treblePowerFraction,.5);
  assert.deepEqual(audioSpectrumStats([-Infinity,-Infinity],48000),{spectralCentroidHz:null,treblePowerFraction:null});
});
test('no recording evidence remains unavailable rather than a clean pass',()=>{
  const stats=sensesMetrics({});
  assert.equal(stats.audio.available,false);assert.equal(stats.audio.nearFullScaleSampleFraction,null);
  assert.equal(stats.visual.available,false);assert.equal(stats.visual.maxApproxEnemyHeadRedFraction,null);
});
test('scheduled sound timing uses audio clock and refuses distant rendered anchors',()=>{
  const data={events:[{tick:100,type:'Hit',actor:0},{tick:200,type:'Parried',actor:0}],
    frames:[{tick:101,performanceMs:100},{tick:207,performanceMs:200}],
    starts:[{id:1,tick:100,cue:'hit_flesh',performanceMs:90,audioSeconds:5,scheduledSeconds:5.1}]};
  const rows=sensesMetrics(data).eventWindows;
  assert.ok(Math.abs(rows[0].soundSources[0].sourceScheduledAfterFrameMs-90)<1e-9);
  assert.equal(rows[1].renderedTick,null);
});
test('roll settle requires three sustained samples after the peak',()=>{
  const frames=[[90,0],[95,0],[99,0],[100,2],[102,8],[103,3],[104,.5],[105,.8],[106,0]].map(([tick,angle])=>({tick,performanceMs:tick*1000/60,camera:{horizonTiltDeg:angle}}));
  const events=[{tick:100,type:'ActionStarted',actor:0,action:'roll'}];
  const roll=sensesMetrics({frames,events}).rolls[0];
  assert.equal(roll.sampledPeakDeltaDeg,8);assert.equal(roll.firstSustainedWithinOneDegreeTick,104);
  assert.equal(sensesMetrics({frames:frames.slice(0,-1),events}).rolls[0].firstSustainedWithinOneDegreeTick,null);
});
test('audio full-scale excursions and sampled region peaks are measurements, not taste scores',()=>{
  const stats=sensesMetrics({levels:[{rms:.1,peak:1},{rms:.1,peak:.5}],visualSamples:[{redDominantFraction:.1,sampleCostMs:2,regions:{enemyHeadApprox:{redDominantFraction:.6}}}]});
  assert.equal(stats.audio.medianRmsDbfs,-20);assert.equal(stats.audio.nearFullScaleSampleFraction,.5);
  assert.equal(stats.visual.maxApproxEnemyHeadRedFraction,.6);assert.equal(stats.visual.sampleCostMedianMs,2);
  assert.ok(stats.limits.includes('No overall combat/fun score'));
});
