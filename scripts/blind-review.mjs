// Six masked pre-contact sequences. Answers stay private until a prediction file exists.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {execFileSync} from 'node:child_process';
import {createHash,randomInt} from 'node:crypto';
import {chromium} from 'playwright';
import {createRecorder,encodeRecord} from '../game/src/record.ts';
import {verifyRecord} from '../game/src/replay.ts';
import {harnessClock} from './lib/harness-clock.mjs';
import {installExperienceProbe} from './lib/experience-probe.mjs';
const {values}=parseArgs({options:{engine:{type:'string'},out:{type:'string'},reveal:{type:'boolean'},url:{type:'string',default:'http://127.0.0.1:8781'}}});
const sha=x=>createHash('sha256').update(x).digest('hex');
assert.ok(values.out);assert.equal(new URL(values.url).hostname,'127.0.0.1');
if(values.reveal){
 const predictions=await fs.readFile(`${values.out}/predictions.json`),rows=JSON.parse(predictions);
 const keys=JSON.parse(await fs.readFile(`${values.out}/private-key.json`));
 assert.equal(rows.length,6);assert.equal(new Set(rows.map(r=>r.id)).size,6);
 const scored=keys.map(k=>{const p=rows.find(p=>p.id===k.id);assert.ok(p);return{id:k.id,prediction:p,actual:k.answer,
   directionCorrect:p.direction===k.answer.direction,typeCorrect:p.type===k.answer.type,source:k.source,from:k.from,to:k.to};});
 await fs.writeFile(`${values.out}/revealed.json`,JSON.stringify({predictionsSha256:sha(predictions),scored,
  limits:'Offline AI recognition in six curated masked sequences; not human reaction speed or a general accuracy rate.'},null,2),{flag:'wx'});
 console.log(JSON.stringify(scored));process.exit(0);
}
assert.ok(values.engine);await fs.mkdir(values.out,{recursive:false});
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:'game',encoding:'utf8'}).trim();
assert.equal(execFileSync('git',['status','--porcelain'],{cwd:'game',encoding:'utf8'}).trim(),'');
assert.equal((await fs.readFile('current-game.sha','utf8')).trim(),revision);
assert.equal((await(await fetch(new URL('/.bot-revision',values.url))).text()).trim(),revision);
const selections=[];
for(const opponent of ['goblin','veteran','executioner']){
 const file=`${values.engine}/${opponent}-advanced-2026100507.json`,bytes=await fs.readFile(file),fight=JSON.parse(bytes);
 assert.equal(fight.source.engineRevision,revision);assert.equal(fight.config.skill??null,null);
 assert.equal(fight.config.dummy,false,'Dummy replay is unsupported');
 assert.ok(!fight.config.playerSpecial&&[null,undefined,'none'].includes(fight.config.opponentSpecial)&&
  fight.config.specialIdentity?.presets?.every(p=>p===null),'Special-equipped visual fixtures are unsupported');
 const candidates=fight.events.filter(e=>e.type==='AttackActive'&&e.actor===1&&e.tick>450&&e.tick<fight.endTick);
 const groups=[candidates.filter(e=>e.move?.includes('heavy')),candidates.filter(e=>!e.move?.includes('heavy'))];
 for(const group of groups){
  const unused=group.filter(e=>!selections.some(s=>s.source===file&&s.to===e.tick-1));
  const pool=unused.length?unused:candidates.filter(e=>!selections.some(s=>s.source===file&&s.to===e.tick-1));
  assert.ok(pool.length,'Need two distinct pre-contact actions per opponent');
  const active=pool[randomInt(pool.length)],start=fight.events.findLast(e=>e.actor===1&&e.type==='AttackStarted'&&e.tick<active.tick&&e.move===active.move);
  assert.ok(start);const to=active.tick-1,from=Math.max(to-90,start.tick-6);
  selections.push({fight,source:file,fixtureSha256:sha(bytes),from,to,answer:{direction:active.direction??start.direction??null,type:active.move?.includes('heavy')?'heavy':active.move==='thrust'?'thrust':active.move==='kick'?'kick':'slash',move:active.move}});
 }
}
for(let n=selections.length-1;n>0;n--){const j=randomInt(n+1);[selections[n],selections[j]]=[selections[j],selections[n]];}
const browser=await chromium.launch({headless:true,executablePath:chromium.executablePath()}),publicCases=[],keys=[];
try{
 for(let n=0;n<selections.length;n++){
  const s=selections[n],id=`scene-${n+1}`,path=`${values.out}/${id}`;await fs.mkdir(path);
  const r=createRecorder({build:revision,opponent:s.fight.config.opponent,weapon:s.fight.config.weapon,level:s.fight.config.engineLevel,seed:s.fight.seed});
  for(const {tick,...intent}of s.fight.intents.slice(0,s.to))r.push(intent);
  const record=r.finish('abandoned'),verified=verifyRecord(record);assert.ok(verified.ok);
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));await page.route('**/*sentry.io/**',r=>r.abort());
  const boot=Date.now();await page.clock.install({time:boot});await page.clock.pauseAt(boot+1000);
  await page.goto(`${values.url}/?debug=1&dpr=1&opponent=${s.fight.config.opponent}&replay=${await encodeRecord(record)}`);
  const {run,until}=await harnessClock(page);await until(()=>globalThis.__view&&document.querySelector('#art-status').textContent==='',90000);
  await page.evaluate(installExperienceProbe);
  await page.evaluate(()=>{const canvas=__view.renderer.domElement;for(const e of document.querySelectorAll('body *'))if(e!==canvas&&!e.contains(canvas))e.style.visibility='hidden';});
  const renderer=await page.evaluate(()=>{const gl=__view.renderer.getContext(),i=gl.getExtension('WEBGL_debug_renderer_info');return i?gl.getParameter(i.UNMASKED_RENDERER_WEBGL):'unavailable';});
  assert.ok(!/SwiftShader|software|llvmpipe|unavailable/i.test(renderer));
  const frames=[];let last=-1;
  for(let t=0;t<900;t++){
   await run(16);const tick=await page.evaluate(()=>Number(document.querySelector('#debug').dataset.tick));
   if(tick>=s.from&&tick>last&&(tick-last>=4||tick===s.to)){
    const bytes=await page.screenshot({type:'jpeg',quality:90}),file=`frame-${String(frames.length).padStart(3,'0')}.jpg`;
    assert.equal(await page.evaluate(()=>Number(document.querySelector('#debug').dataset.tick)),tick);
    await fs.writeFile(`${path}/${file}`,bytes,{flag:'wx'});frames.push({file,tick,sha256:sha(bytes)});last=tick;
   }if(tick>=s.to)break;
  }
  assert.ok(frames.length>=3);assert.equal(frames.at(-1).tick,s.to);
  assert.deepEqual(await page.evaluate(()=>__experience.frames.at(-1).fighters),verified.practice.duel.fighters);
  assert.deepEqual(errors,[]);
  keys.push({...s,fight:undefined,id,recordSha256:sha(JSON.stringify(record)),renderer,frames});
  publicCases.push({id,frames:frames.map(f=>`${id}/${f.file}`),instruction:'Predict direction and slash/thrust/heavy/kick/unclear, best defensive choice, confidence, visible evidence; answer BEFORE logs.'});
  await context.close();console.log(`${id}: masked pre-contact frames saved`);
 }
 await fs.writeFile(`${values.out}/private-key.json`,JSON.stringify(keys,null,2),{flag:'wx'});
 await fs.writeFile(`${values.out}/cases.json`,JSON.stringify({revision,probeSha256:sha(await fs.readFile('scripts/blind-review.mjs')),cases:publicCases,
  limits:'Actual masked production-camera rendered replays, no game edits; six curated attacks, offline visual inference, not real-time agent reactions or human perception.'},null,2),{flag:'wx'});
}finally{await browser.close();}
