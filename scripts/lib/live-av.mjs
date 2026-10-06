// Opt-in actual keyboard fighting with native game/audio clocks. Never supplies bot observations.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { MANIFEST } from '../../game/src/audio/manifest.ts';
import { installAudioReview, identifySpriteCue } from './audio-review.mjs';
import { visualPixelStats, audioSpectrumStats, approximateImpact, sensesMetrics } from './player-senses-metrics.mjs';
import { inputActionMetrics } from './input-action-metrics.mjs';

export function liveAVMode({nativeAV=false,research,recordVideo=true,reviewFrames=false}) {
  if (!nativeAV) return 'controlled fixed-step; not realtime FPS';
  assert.ok(research && recordVideo && !reviewFrames,
    'native AV requires --research and video; paused review frames/clips are incompatible');
  return 'native real-time; polling delay plus automation overhead';
}
export function liveAVCoverage(receipt, fightEvents, endTick) {
  assert.ok(Number.isFinite(receipt.begin?.performanceMs)&&Number.isFinite(receipt.end?.performanceMs),'Missing native recording bounds');
  const frames=receipt.frames.filter(f=>f.performanceMs>=receipt.begin.performanceMs&&f.performanceMs<=receipt.end.performanceMs);
  assert.ok(frames.length>1,'No native frame timeline');
  assert.equal(receipt.audioTracks,1,'Missing actual audio track');
  assert.ok(receipt.levels.some(s=>s.rms>.00001),'Actual final audio stayed silent');
  assert.deepEqual(receipt.visualErrors,[]);
  assert.ok(receipt.visualSamples.length>0,'No rendered pixel samples');
  const first=frames[0].tick,last=frames.at(-1).tick;
  assert.ok(Number.isFinite(endTick)&&last>=endTick,'Final combat tick not covered');
  const expected=fightEvents.filter(e=>e.tick>=first&&e.tick<=endTick);
  assert.ok(expected.length>0,'No fight events within capture');
  assert.deepEqual(receipt.events.filter(e=>e.tick>=first&&e.tick<=endTick),expected,'Native AV events differ from actual input fight');
  return {firstRecordedTick:first,lastRecordedTick:last,finalTickCovered:true,
    eventsMatched:expected.length,fightEventsBeforeCapture:fightEvents.filter(e=>e.tick<first).length,nonSilent:true,
    note:'Native canvas/audio timeline; bootstrap before recording may be cropped. Not replay determinism, human hearing or perceptual sync acceptance.'};
}
export async function prepareLiveAV(page) {
  await page.addInitScript({content:`globalThis.__visualPixelStats=(${visualPixelStats.toString()});globalThis.__audioSpectrumStats=(${audioSpectrumStats.toString()});globalThis.__approximateImpact=(${approximateImpact.toString()});`});
  await page.addInitScript(installAudioReview);
}
export async function beginLiveAV(page) {
  await page.keyboard.press('ShiftLeft'); // Real gesture, no fighter action; recorded output is untouched, speakers muted.
  const spriteEnd=Math.max(...Object.values(MANIFEST).flat().map(([o,d])=>o+d));
  await page.waitForFunction(end=>globalThis.__view&&__audioReview.contexts.length===1
    && __audioReview.contexts[0].context.state==='running'&&__audioReview.decoded.some(b=>b.seconds>=end),spriteEnd,{timeout:30000});
  await page.evaluate(()=>__audioReview.attachView());
  await page.waitForFunction(()=>__audioReview.frames.length>0,{},{timeout:10000});
  await page.evaluate(()=>__audioReview.begin());
}
export async function finishLiveAV(page, directory, identity, fight) {
  const {base64,frameProofs,...receipt}=await page.evaluate(()=>__audioReview.finish());
  await fs.mkdir(directory,{recursive:false});
  const hash=data=>createHash('sha256').update(data).digest('hex'),bytes=Buffer.from(base64,'base64');
  const video=`${directory}/fight-av.webm`;await fs.writeFile(video,bytes,{flag:'wx'});
  const proofs=[];
  for(const [i,proof] of frameProofs.entries()) {
    const {jpeg,...stamp}=proof,file=`contact-${i}-${proof.tick}.jpg`,data=Buffer.from(jpeg,'base64');
    await fs.writeFile(`${directory}/${file}`,data,{flag:'wx'});proofs.push({...stamp,file,sha256:hash(data)});
  }
  const complete={...identity,...receipt,proofFrames:proofs,clipSha256:hash(bytes),
    kind:'actual live keyboard fight; native clocks; not an engine replay',
    starts:receipt.starts.map(s=>({...s,cue:identifySpriteCue(s,MANIFEST)})),
    limits:'Canvas only; DOM HUD absent. Instrumented capture, not unmodified FPS or input-to-photon measurement. Semantic policy is not AI vision/hearing. Warmup may be cropped; event/source clocks are not perceptual sync acceptance.'};
  // Save recordings even if a validation fails; never discard a failed native capture.
  await fs.writeFile(`${directory}/audio.json`,JSON.stringify(complete,null,2),{flag:'wx'});
  await fs.writeFile(`${directory}/metrics.json`,JSON.stringify({...sensesMetrics(complete),input:inputActionMetrics(complete,fight.learning)},null,2),{flag:'wx'});
  const coverage=liveAVCoverage(complete,fight.events,fight.endTick);
  await page.evaluate(async()=>{await __audioReview.contexts[0].context.suspend();__audioReview.uninstall();});
  return {directory,video,clipSha256:complete.clipSha256,coverage};
}
