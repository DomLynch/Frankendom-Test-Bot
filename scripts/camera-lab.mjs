// Separate local replay/camera experiment; does not change the normal bot launcher.
import assert from 'node:assert/strict';
import { parseArgs } from 'node:util';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { chromium } from 'playwright';
import { createRecorder, encodeRecord } from '../game/src/record.ts';
import { verifyRecord } from '../game/src/replay.ts';
import { harnessClock } from './lib/harness-clock.mjs';
import { reviewFrameCapture } from './lib/review-frames.mjs';
import { CAMERA_PRESETS } from './lib/camera-lab.mjs';

const {values}=parseArgs({options:{fight:{type:'string'},to:{type:'string'},out:{type:'string'},url:{type:'string',default:'http://127.0.0.1:8781'},presets:{type:'string',default:'current,elevated,shoulder'}}});
assert.ok(values.fight && values.to && values.out,'Provide --fight raw engine receipt, --to tick and --out new directory');
assert.equal(new URL(values.url).hostname,'127.0.0.1','Loopback only');
const raw=await fs.readFile(values.fight), fight=JSON.parse(raw), to=Number(values.to), out=resolve(values.out);
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:'game',encoding:'utf8'}).trim();
assert.equal(execFileSync('git',['status','--porcelain'],{cwd:'game',encoding:'utf8'}).trim(),'','Pinned game must be clean');
assert.equal(fight.source?.engineRevision,revision,'Fixture and engine pin differ');
assert.equal((await (await fetch(new URL('/.bot-revision',values.url))).text()).trim(),revision,'Served build mismatch');
assert.ok(Number.isInteger(to)&&to>420&&to<fight.endTick,'Choose seven seconds ending before the fight ends');
const presets=values.presets.split(',');
assert.ok(presets.length&&new Set(presets).size===presets.length&&presets.every(p=>Object.hasOwn(CAMERA_PRESETS,p)),'Invalid presets');
await fs.mkdir(dirname(out),{recursive:true});
await fs.mkdir(out,{recursive:false}); // refusal preserves every prior run
const recorder=createRecorder({build:revision,opponent:fight.config.opponent,weapon:fight.config.weapon,level:fight.config.engineLevel,seed:fight.seed});
for(const {tick,...intent} of fight.intents.slice(0,to)) recorder.push(intent);
const record=recorder.finish('abandoned'), verification=verifyRecord(record);
assert.equal(verification.ok,true,'Replay must verify before browser launch');
const expected=fight.events.filter(e=>e.tick>to-420&&e.tick<=to);
const encoded=await encodeRecord(record), module=await fs.readFile('scripts/lib/camera-lab.mjs','utf8');
const hash=x=>createHash('sha256').update(x).digest('hex');
const identity={revision,botRevision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  cameraModuleSha256:hash(module),fixtureSha256:hash(raw),recordSha256:hash(JSON.stringify(record)),seed:fight.seed,opponent:fight.config.opponent,
  fromTick:to-420,toTick:to,evidence:'rendered replay of retained engine-authored inputs; camera-only prototype, not a fresh player-policy acceptance fight',
  limits:'normal game HUD retained; angular camera residual retained approximately; positional impact offsets differ; arena culling/presentation calculations still use baseline camera before final draw; no audio/touch/real-time FPS acceptance'};
await fs.writeFile(`${out}/record.json`,JSON.stringify(record),{flag:'wx'});
// The default headless-shell on this Mac selected SwiftShader. Reuse the proven full Chrome/Metal executable.
const browser=await chromium.launch({headless:true,executablePath:chromium.executablePath()});
const receipts=[];
try {
 for(const preset of presets){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/*sentry.io/**',r=>r.abort());
  await page.route('**/__camera-lab.mjs',r=>r.fulfill({contentType:'text/javascript',body:module}));
  const clockTime=Date.now();
  await page.clock.install({time:clockTime}); await page.clock.pauseAt(clockTime+1000);
  await page.goto(`${values.url}/?opponent=${fight.config.opponent}&debug=1&dpr=1&replay=${encoded}`);
  await page.addScriptTag({url:'/__camera-lab.mjs',type:'module'});
  await page.evaluate(()=>globalThis.__installCameraLab);
  const {run,until}=await harnessClock(page);
  await until(()=>Boolean(globalThis.__view&&globalThis.__installCameraLab)&&document.querySelector('#art-status').textContent==='',90000);
  await page.evaluate(preset=>{
    globalThis.__installCameraLab(preset);
    document.querySelector('#debug').style.visibility='hidden';
    const label=document.createElement('div');label.id='bot-receipt';
    Object.assign(label.style,{position:'fixed',top:'2px',left:'2px',zIndex:'9999',background:'#111d',color:'white',font:'12px monospace'});
    document.body.append(label);
  },preset);
  const renderer=await page.evaluate(()=>{const gl=globalThis.__view.renderer.getContext(),info=gl.getExtension('WEBGL_debug_renderer_info');return info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):'unavailable';});
  assert.ok(!/SwiftShader|llvmpipe|software|unavailable/i.test(renderer),'GPU renderer required; refuse software capture');
  console.log(JSON.stringify({preset,stage:'capture-ready',renderer}));
  const capture=await reviewFrameCapture(page,`${out}/${preset}-frames`,`${CAMERA_PRESETS[preset].label}`);
  let lastTick=-1;
  for(let n=0;n<2000;n++){
    await run(16);
    const tick=await page.evaluate(()=>Number(document.querySelector('#debug').dataset.tick));
    if(tick>lastTick&&tick>to-420){await capture.capture();lastTick=tick;}
    if(tick>=to)break;
  }
  const samples=await page.evaluate(()=>globalThis.__cameraLab.frames);
  const seenEvents=samples.flatMap(s=>s.events).filter((e,i,all)=>i===all.findIndex(x=>JSON.stringify(x)===JSON.stringify(e)));
  const firstTick=capture.frames[0]?.tick,last=capture.frames.at(-1)?.tick;
  assert.equal(last,to,'Replay did not reach selected end');
  assert.ok(firstTick<=to-418,'Initial replay frames missing');
  const inWindow=seenEvents.filter(e=>e.tick>=firstTick&&e.tick<=to);
  const want=expected.filter(e=>e.tick>=firstTick);
  assert.deepEqual(inWindow,want,'Replay event mismatch; refuse visual comparison');
  assert.deepEqual(samples.at(-1).fighters,verification.practice.duel.fighters,'Replay state mismatch');
  const states=[...new Map(samples.map(s=>[s.tick,s.fighters])).entries()].filter(([tick])=>tick>=firstTick);
  const final=await capture.finish({...identity,cases:[{type:'camera-comparison',fromTick:firstTick,toTick:to}],preset,
    endTick:to,botContentSha256:identity.cameraModuleSha256});
  const receipt={...identity,preset,renderer,frames:final,eventsSha256:hash(JSON.stringify(inWindow)),statesSha256:hash(JSON.stringify(states)),errors,
    samples:samples.filter(s=>s.tick>=firstTick),parity:'raw retained event list and verified final fighter state match'};
  assert.deepEqual(errors,[]);
  await fs.writeFile(`${out}/${preset}.json`,JSON.stringify(receipt,null,2),{flag:'wx'});
  receipts.push({...receipt,samples:undefined});
  console.log(JSON.stringify({preset,frames:final.frameCount,firstTick,last,events:inWindow.length,parity:receipt.parity}));
  await page.evaluate(()=>globalThis.__cameraLab.uninstall());await context.close();
 }
 // Capture clocks must cover identical ticks before cross-view state-hash comparison.
 assert.equal(new Set(receipts.map(r=>r.frames.firstTick)).size,1,'Views captured different starting ticks');
 assert.equal(new Set(receipts.map(r=>r.statesSha256)).size,1,'Camera altered recorded combat states');
 assert.equal(new Set(receipts.map(r=>r.eventsSha256)).size,1,'Camera altered recorded combat events');
 await fs.writeFile(`${out}/summary.json`,JSON.stringify({...identity,receipts,parity:'all camera views have identical tick/state/event hashes'},null,2),{flag:'wx'});
}finally{await browser.close();}
