// Opt-in real trusted touch coverage, not a player policy or physical-phone comfort test.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {harnessClock} from './lib/harness-clock.mjs';
import {installExperienceProbe,touchEffect,touchCasePassed} from './lib/experience-probe.mjs';
import {movesOf} from '../game/src/duel.ts';
const {values}=parseArgs({options:{out:{type:'string'},'contacts-only':{type:'boolean'},url:{type:'string',default:'http://127.0.0.1:8781'}}});
assert.ok(values.out);assert.equal(new URL(values.url).hostname,'127.0.0.1');
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:'game',encoding:'utf8'}).trim();
assert.equal(execFileSync('git',['status','--porcelain'],{cwd:'game',encoding:'utf8'}).trim(),'');
assert.equal(revision,(await fs.readFile('current-game.sha','utf8')).trim());
assert.equal((await(await fetch(new URL('/.bot-revision',values.url))).text()).trim(),revision);
await fs.mkdir(values.out,{recursive:false});
const sha=x=>createHash('sha256').update(x).digest('hex');
const source={revision,probeSha256:sha(await fs.readFile('scripts/touch-review.mjs')),moduleSha256:sha(await fs.readFile('scripts/lib/experience-probe.mjs'))};
const rows=[],browser=await chromium.launch({headless:true,executablePath:chromium.executablePath()});
try{
 for(const kit of (values['contacts-only']?[{difficulty:'6',skill:'none'}]:[{difficulty:'dummy',skill:'pommel'},{difficulty:'6',skill:'none'}])){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/*sentry.io/**',r=>r.abort());
  // Quiet speakers; touch acceptance is measured separately from native audio.
  await page.addInitScript(()=>{const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(to,...args){
    if(to instanceof AudioDestinationNode){const mute=this.context.createGain();mute.gain.value=0;connect.call(this,mute);return connect.call(mute,to);}return connect.call(this,to,...args);};});
  await page.goto(`${values.url}/?debug=1&dpr=1&spar=1&opponent=veteran&difficulty=${kit.difficulty}&weapon=longsword&skill=${kit.skill}&special=none&yourSpecial=none&botSeed=2026100511`);
  const {run,until}=await harnessClock(page);
  await until(()=>globalThis.__view&&document.querySelector('#art-status').textContent==='',90000);
  await page.evaluate(installExperienceProbe);await run(16);
  const renderer=await page.evaluate(()=>{const gl=__view.renderer.getContext(),i=gl.getExtension('WEBGL_debug_renderer_info');return i?gl.getParameter(i.UNMASKED_RENDERER_WEBGL):'unavailable';});
  assert.ok(!/software|SwiftShader|llvmpipe|unavailable/i.test(renderer));
  const cdp=await context.newCDPSession(page);let points=[];
  const state=()=>page.evaluate(()=>__experience.frames.at(-1));
  const point=async(id,dx=0,dy=0,finger=1)=>{const r=await page.locator('#'+id).boundingBox();assert.ok(r,`Missing control ${id}`);return{x:r.x+r.width/2+dx,y:r.y+r.height/2+dy,id:finger,radiusX:1,radiusY:1,force:1};};
  const start=async p=>{points.push(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});};
  const move=async p=>{points=points.map(q=>q.id===p.id?p:q);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points});};
  const end=async(finger=1,cancel=false)=>{points=cancel?[]:points.filter(p=>p.id!==finger);await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:points});};
  const tap=async(id,ms=32)=>{await start(await point(id));await run(ms);await end();};
  const ready=()=>until(()=>__experience.frames.at(-1)?.fighters[0].phase==='ready',4000);
  async function scenario(name,action){
   const before=await page.evaluate(()=>({f:__experience.frames.length,e:__experience.events.length,i:__experience.inputs.length}));
   await action();await run(32);
   const raw=await page.evaluate(b=>({frames:__experience.frames.slice(Math.max(0,b.f-1)),events:__experience.events.slice(b.e),inputs:__experience.inputs.slice(b.i)}),before);
   assert.ok(raw.inputs.some(e=>e.trusted&&e.pointerType==='touch'),`No trusted touch: ${name}`);
   const releaseUI=await page.evaluate(()=>({held:document.querySelectorAll('[data-held]').length,stick:document.querySelector('#stick').style.transform}));
   assert.deepEqual(releaseUI,{held:0,stick:''});
   const row={source,name,kit,renderer,...raw,effect:touchEffect(raw.events,raw.frames),released:points.length===0,releaseUI};
   row.passed=touchCasePassed(name,row.effect);rows.push(row);await page.screenshot({path:`${values.out}/${kit.difficulty}-${name}.png`});
   await fs.writeFile(`${values.out}/${kit.difficulty}-${name}.json`,JSON.stringify(row),{flag:'wx'});
   assert.ok(row.passed,`Required accepted effect missing: ${name}; raw receipt retained`);
   console.log(JSON.stringify({name,kit,effect:row.effect}));
  }
  await scenario('draw',async()=>{await tap('attack-button');await ready();});
  // Real joystick closes the gap. No fighter state or simulation actions are injected.
  const close=async()=>{await start(await point('joystick',0,-32));
   for(let n=0;n<120;n++){const f=(await state()).fighters;if(Math.hypot(f[0].body.x-f[1].body.x,f[0].body.z-f[1].body.z)<1.1)break;await run(64);}await end();await ready();};
  await close();
  if(kit.difficulty==='dummy'){
   for(const [name,id] of [['slash','attack-button'],['stab','thrust-button'],['kick','kick-button'],['pommel','skill-button']])
    await scenario(name,async()=>{await tap(id);await run(700);await ready();await run(800);});
   await scenario('charged-heavy',async()=>{await start(await point('heavy-button'));await until(()=>__experience.events.some(e=>e.actor===0&&e.type==='Charged'),1800);await end();await run(1000);await ready();});
   for(const [name,dx,dy] of [['straight',0,0],['left',-30,0],['right',30,0],['overhead',0,-30],['low',0,30]])
    await scenario('guard-'+name,async()=>{const p=await point('guard-button');await start(p);if(dx||dy)await move({...p,x:p.x+dx,y:p.y+dy});await run(350);await end();await ready();});
   await scenario('short-step',async()=>{await tap('dodge-button',32);await run(650);await ready();});
   await scenario('held-roll',async()=>{await tap('dodge-button',200);await run(900);await ready();});
   await scenario('moving-roll',async()=>{await start(await point('joystick',32,0));await run(32);await start(await point('dodge-button',0,0,2));await run(64);await end(2);await end();await run(900);await ready();});
   await scenario('feint',async()=>{const p=await point('heavy-button');await start(p);await run(16);await move({...p,x:p.x-90});await run(32);await end();await ready();});
   await scenario('cancel-heavy',async()=>{await start(await point('heavy-button'));await end(1,true);await run(900);await ready();});
   await scenario('move-and-guard',async()=>{await start(await point('joystick',32,0));await start(await point('guard-button',0,0,2));await run(400);await end(2);await end();await ready();});
  }else{
   // Exact-state timing here tests input reachability; it is explicitly not limited-observation player performance.
   for(const style of ['parry','block'])await scenario('contact-'+style,async()=>{
    let used=false;
    for(let n=0;n<1500;n++){
     const f=(await state()).fighters,e=f[1],p=f[0];
     if(!used&&p.phase==='ready'&&e.phase==='attack'&&e.move!=='kick'&&e.move&&Math.hypot(p.body.x-e.body.x,p.body.z-e.body.z)<2){
      if(style==='parry'&&e.age<movesOf(e)[e.move].windup-6){await run(16);continue;}
      const q=await point('guard-button');await start(q);const d=movesOf(e)[e.move].direction;
      const [dx,dy]=({left:[-30,0],right:[30,0],overhead:[0,-30],low:[0,30],thrust:[0,0]})[d];
      if(dx||dy)await move({...q,x:q.x+dx,y:q.y+dy});used=true;
      if(style==='parry'){await run(32);await end();}else{await run(800);await end();}
     }
     await run(16);if(used&&(await state()).fighters[0].phase==='ready')break;
     if(p.phase==='dead')break;
    }
    if(points.length)await end(1,true);
   });
  }
  assert.deepEqual(errors,[]);await page.evaluate(()=>__experience.uninstall());await context.close();
 }
 await fs.writeFile(`${values.out}/summary.json`,JSON.stringify({source,rows,limits:'Trusted browser touch and accepted game events; controlled clock, perfect-state scripted coverage, no human thumb comfort, real-device timing or sound acceptance. Dummy actions establish reachability only; contact trials retained whether successful or not.'},null,2),{flag:'wx'});
}catch(error){await fs.writeFile(`${values.out}/failure.json`,JSON.stringify({source,error:String(error),completed:rows.map(r=>r.name)}));throw error;}finally{await browser.close();}
