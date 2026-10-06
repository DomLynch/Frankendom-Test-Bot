// Opt-in sound evidence; native clocks, retained verified replay, no policy/game edits.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {createRecorder,encodeRecord} from '../game/src/record.ts';
import {verifyRecord} from '../game/src/replay.ts';
import {MANIFEST} from '../game/src/audio/manifest.ts';
import {perceivable} from './lib/player-bot-observation.mjs';
import {installAudioReview,identifySpriteCue,chargeObservationAudit} from './lib/audio-review.mjs';
import {visualPixelStats,audioSpectrumStats,approximateImpact,sensesMetrics} from './lib/player-senses-metrics.mjs';
const {values}=parseArgs({options:{fight:{type:'string'},to:{type:'string'},out:{type:'string'},feel:{type:'string'},url:{type:'string',default:'http://127.0.0.1:8781'}}});
assert.ok(values.feel===undefined||['high','low','off'].includes(values.feel),'feel must be high, low or off');
assert.ok(values.fight&&values.to&&values.out);assert.equal(new URL(values.url).hostname,'127.0.0.1');
const hash=b=>createHash('sha256').update(b).digest('hex');
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:'game',encoding:'utf8'}).trim();
assert.equal(execFileSync('git',['status','--porcelain'],{cwd:'game',encoding:'utf8'}).trim(),'');
assert.equal(revision,(await fs.readFile('current-game.sha','utf8')).trim());
assert.equal((await(await fetch(new URL('/.bot-revision',values.url))).text()).trim(),revision);
const bytes=await fs.readFile(values.fight),fight=JSON.parse(bytes),to=Number(values.to);
assert.equal(fight.source.engineRevision,revision);assert.ok(Number.isInteger(to)&&to>420&&to<fight.endTick);
assert.equal(fight.config.dummy,false,'Dummy replay is unsupported');
assert.equal(fight.config.skill??null,null,'This bounded capture only supports no-skill/no-special fixtures');
assert.ok(!fight.config.specials&&!fight.config.playerSpecial&&[null,undefined,'none'].includes(fight.config.opponentSpecial)&&
  fight.config.specialIdentity?.presets?.every(p=>p===null),'Special-equipped fixtures need a separately supported recorder');
const recorder=createRecorder({build:revision,opponent:fight.config.opponent,weapon:fight.config.weapon,level:fight.config.engineLevel,seed:fight.seed});
for(const {tick,...intent} of fight.intents.slice(0,to))recorder.push(intent);
const record=recorder.finish('abandoned'),verified=verifyRecord(record);assert.equal(verified.ok,true);
const identity={revision,botRevision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  probeSha256:hash(await fs.readFile('scripts/audio-review.mjs')),moduleSha256:hash(await fs.readFile('scripts/lib/audio-review.mjs')),
  metricsSha256:hash(await fs.readFile('scripts/lib/player-senses-metrics.mjs')),
  dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),feel:values.feel??'game default',
  observationSha256:hash(await fs.readFile('scripts/lib/player-bot-observation.mjs')),fixtureSha256:hash(bytes),recordSha256:hash(JSON.stringify(record))};
await fs.mkdir(values.out,{recursive:false});await fs.writeFile(`${values.out}/record.json`,JSON.stringify(record),{flag:'wx'});
const browser=await chromium.launch({headless:true,executablePath:chromium.executablePath(),args:['--autoplay-policy=no-user-gesture-required']});
try {
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/*sentry.io/**',r=>r.abort());
 let releaseModels; const modelsReady=new Promise(resolve=>{releaseModels=resolve;});
 let gatedModels=0;
 await page.route(/\.glb(?:\?|$)/,async route=>{gatedModels++;await modelsReady;await route.continue();});
 await page.addInitScript({content:`globalThis.__visualPixelStats=(${visualPixelStats.toString()});globalThis.__audioSpectrumStats=(${audioSpectrumStats.toString()});globalThis.__approximateImpact=(${approximateImpact.toString()});`});
 await page.addInitScript(installAudioReview);
 const feelQuery=values.feel?`&feel=${values.feel}`:'';
 await page.goto(`${values.url}/?debug=1&dpr=1&opponent=${fight.config.opponent}&replay=${await encodeRecord(record)}${feelQuery}`,{waitUntil:'domcontentloaded'});
 await page.keyboard.press('ShiftLeft'); // Actual gesture unlocks audio; replay retains its own inputs.
 const spriteEnd=Math.max(...Object.values(MANIFEST).flat().map(([o,d])=>o+d));
 await page.waitForFunction(end=>__audioReview.decoded.some(b=>b.seconds>=end),spriteEnd,{timeout:90000});
 assert.ok(gatedModels>0,'No model-readiness barrier: refuse potentially unready cue capture');
 releaseModels();
 await page.waitForFunction(()=>globalThis.__view&&globalThis.__audioReview.contexts.length===1,{},{timeout:90000});
 await page.evaluate(()=>__audioReview.attachView());
 const renderer=await page.evaluate(()=>{const gl=__view.renderer.getContext(),i=gl.getExtension('WEBGL_debug_renderer_info');return i?gl.getParameter(i.UNMASKED_RENDERER_WEBGL):'unavailable';});
 assert.ok(!/SwiftShader|software|llvmpipe|unavailable/i.test(renderer));
 await page.waitForFunction(()=>document.querySelector('#art-status').textContent===''&&__audioReview.frames.length>0,{},{timeout:90000});
 await page.keyboard.press('ShiftLeft');
 await page.waitForFunction(()=>__audioReview.contexts[0].context.state==='running',{},{timeout:10000});
 await page.evaluate(()=>__audioReview.begin());
 await page.waitForFunction(to=>__audioReview.frames.at(-1)?.tick>=to,to,{timeout:30000});
 const result=await page.evaluate(()=>__audioReview.finish());
 const {base64,frameProofs,...receipt}=result;
 const proofFrames=[];
 for(const [index,proof] of frameProofs.entries()){
   const {jpeg,...stamp}=proof,file=`contact-${index}-${proof.tick}.jpg`,data=Buffer.from(jpeg,'base64');
   await fs.writeFile(`${values.out}/${file}`,data,{flag:'wx'});proofFrames.push({...stamp,file,sha256:hash(data)});
 }
 await fs.writeFile(`${values.out}/fight-av.webm`,Buffer.from(base64,'base64'),{flag:'wx'});
 await fs.writeFile(`${values.out}/capture.json`,JSON.stringify({...identity,...receipt,renderer}),{flag:'wx'});
 const first=receipt.frames[0].tick,events=receipt.events.filter(e=>e.tick>=first&&e.tick<=to),expected=fight.events.filter(e=>e.tick>=first&&e.tick<=to);
 assert.deepEqual(events,expected,'Rendered events differ from retained replay');
 assert.deepEqual(receipt.frames.at(-1).fighters,verified.practice.duel.fighters);
 assert.ok(receipt.levels.some(s=>s.rms>0.00001),'Actual final output stayed silent');
 assert.equal(receipt.audioTracks,1);assert.deepEqual(errors,[]);
 assert.deepEqual(receipt.visualErrors,[]);assert.ok(receipt.visualSamples.length>0,'No rendered visual samples');
 const starts=receipt.starts.map(s=>({...s,cue:identifySpriteCue(s,MANIFEST)}));
 const audit=chargeObservationAudit(events,starts,perceivable(events),MANIFEST);
 const complete={...identity,...receipt,proofFrames,warmup:'Actual game sprite decoded before releasing required model fetches; native fight/audio clocks during capture',audioTickBasis:'frankendom:combat current-step dispatch, not previous rendered debug tick',audioActivation:'real keyboard gesture plus explicit Chrome autoplay allowance; not Safari activation acceptance',starts,chargeAudit:audit,renderer,errors,
  clipSha256:hash(Buffer.from(base64,'base64')),verifiedReplay:true,
  limits:'Canvas only: DOM HUD absent. Native AV shares one recorder timeline; event/audio/performance clocks retained for sync inspection; no phone speaker/comfort acceptance. Source scheduling is not proof every cue is perceptually audible. Offline media decode/AV stream timing verification pending.'};
 await fs.writeFile(`${values.out}/audio.json`,JSON.stringify(complete,null,2),{flag:'wx'});
 await fs.writeFile(`${values.out}/metrics.json`,JSON.stringify(sensesMetrics(complete),null,2),{flag:'wx'});
 await page.evaluate(async()=>{await __audioReview.contexts[0].context.suspend();__audioReview.uninstall();});
 console.log(JSON.stringify({out:values.out,renderer,begin:receipt.begin,end:receipt.end,events:events.length,nonSilent:true,chargeAudit:audit}));
}catch(error){await fs.writeFile(`${values.out}/failure.json`,JSON.stringify({...identity,error:String(error)}),{flag:'wx'});throw error;}finally{await browser.close();}
