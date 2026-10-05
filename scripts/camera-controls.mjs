// Real browser keyboard and trusted touch pulses, opt-in loopback camera integration diagnostic.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {harnessClock} from './lib/harness-clock.mjs';
const {values}=parseArgs({options:{out:{type:'string'},url:{type:'string',default:'http://127.0.0.1:8781'}}});
assert.ok(values.out);assert.equal(new URL(values.url).hostname,'127.0.0.1');
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:'game',encoding:'utf8'}).trim();
assert.equal(execFileSync('git',['status','--porcelain'],{cwd:'game',encoding:'utf8'}).trim(),'');
assert.equal((await(await fetch(new URL('/.bot-revision',values.url))).text()).trim(),revision);
await fs.mkdir(values.out,{recursive:false});
const module=await fs.readFile('scripts/lib/camera-lab.mjs','utf8'),rows=[];
const hash=x=>createHash('sha256').update(x).digest('hex');
const source={botRevision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),
  probeSha256:hash(await fs.readFile('scripts/camera-controls.mjs')),moduleSha256:hash(module)};
const browser=await chromium.launch({headless:true,executablePath:chromium.executablePath()});
try{
 for(const preset of ['current','shoulder']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/*sentry.io/**',r=>r.abort());
  await page.route('**/__camera-lab.mjs',r=>r.fulfill({contentType:'text/javascript',body:module}));
  const time=Date.now();await page.clock.install({time});await page.clock.pauseAt(time+1000);
  await page.goto(`${values.url}/?debug=1&dpr=1&spar=1&opponent=veteran&difficulty=6&weapon=longsword&skill=none&special=none&yourSpecial=none&seed=731`);
  await page.addScriptTag({url:'/__camera-lab.mjs',type:'module'});
  const {run,until}=await harnessClock(page);
  await until(()=>Boolean(globalThis.__view&&globalThis.__installCameraLab)&&document.querySelector('#art-status').textContent==='',90000);
  await page.evaluate(preset=>{
   globalThis.__installCameraLab(preset);globalThis.__controlEvents=[];
   for(const type of ['keydown','keyup','pointerdown','pointermove','pointerup'])document.addEventListener(type,e=>globalThis.__controlEvents.push({type,code:e.code,pointerType:e.pointerType,trusted:e.isTrusted,target:e.target.id}));
   document.querySelector('#debug').style.visibility='hidden';
  },preset);
  const renderer=await page.evaluate(()=>{const gl=__view.renderer.getContext(),i=gl.getExtension('WEBGL_debug_renderer_info');return i?gl.getParameter(i.UNMASKED_RENDERER_WEBGL):'unavailable';});
  assert.ok(!/SwiftShader|llvmpipe|software|unavailable/i.test(renderer));
  await page.keyboard.press('KeyF');await run(16);
  await until(()=>__cameraLab.frames.at(-1)?.fighters[0].phase==='ready',3000);
  const cdp=await context.newCDPSession(page),pulses=[];
  for(const input of ['KeyW','KeyD','touch-up','touch-right']){
   await run(64);const from=await page.evaluate(()=>__cameraLab.frames.length);
   const downTick=await page.evaluate(()=>Number(document.querySelector('#debug').dataset.tick));
   if(input.startsWith('Key'))await page.keyboard.down(input);
   else{
    const rect=await page.locator('#joystick').boundingBox();assert.ok(rect);
    const point={x:rect.x+rect.width/2+(input==='touch-right'?32:0),y:rect.y+rect.height/2+(input==='touch-up'?-32:0),id:1,radiusX:1,radiusY:1,force:1};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
   }
   for(let i=0;i<12;i++)await run(16);
   const upTick=await page.evaluate(()=>Number(document.querySelector('#debug').dataset.tick));
   if(input.startsWith('Key'))await page.keyboard.up(input);
   else await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await run(32);
   const samples=await page.evaluate(from=>__cameraLab.frames.slice(Math.max(0,from-1)),from);
   await fs.writeFile(`${values.out}/${preset}-${input}-samples.json`,JSON.stringify(samples),{flag:'wx'});
   const motion=[];
   for(let i=1;i<samples.length;i++){
    const a=samples[i-1],b=samples[i],p=a.fighters[0],q=b.fighters[0],e=a.fighters[1],f=a.opticalBasis;
    const dx=q.body.x-p.body.x,dz=q.body.z-p.body.z,n=Math.hypot(dx,dz);
    // Exclude no-step frames, combat recovery, contact, walls and damage: these obscure control direction.
    if(b.tick<=downTick||b.tick>upTick||b.tick===a.tick||n<1e-5||p.phase!=='ready'||q.phase!=='ready'||p.health!==q.health||Math.hypot(p.body.x,p.body.z)>7||Math.hypot(p.body.x-e.body.x,p.body.z-e.body.z)<1.3||!f.forward||!f.right)continue;
    const wanted=input==='KeyW'||input==='touch-up'?f.forward:f.right;
    motion.push({tick:b.tick,dx,dz,rigYaw:a.rigYaw,optical:f,angleDeg:Math.acos(Math.max(-1,Math.min(1,(dx*wanted[0]+dz*wanted[1])/n)))*180/Math.PI});
   }
   assert.ok(motion.length>=3,`${preset}/${input}: insufficient unobstructed movement`);
   const released=await page.locator('#stick').evaluate(el=>({transform:el.style.transform,run:el.dataset.run}));
   if(input.startsWith('touch'))assert.deepEqual(released,{transform:'',run:'false'});
   pulses.push({input,downTick,upTick,motion,meanAngleDeg:motion.reduce((a,b)=>a+b.angleDeg,0)/motion.length,released,
     releaseEvidence:'key/touch-end delivered; touch stick UI cleared, not a raw Match intent audit'});
   await page.screenshot({path:`${values.out}/${preset}-${input}.png`});
  }
  const events=await page.evaluate(()=>__controlEvents);
  assert.ok(events.some(e=>e.pointerType==='touch'&&e.trusted&&e.target==='joystick'),'No trusted actual joystick touch path');
  assert.deepEqual(errors,[]);
  rows.push({preset,renderer,pulses,events,errors});
  await page.evaluate(()=>__cameraLab.uninstall());await context.close();
 }
 await fs.writeFile(`${values.out}/controls.json`,JSON.stringify({revision,source,evidence:'fresh live local browser control pulses, not replay; trusted touch plus keyboard; controlled time; excludes contacts/walls; ground-plane axis error, not perspective pixel drift; sequential changed geometry; no human thumb comfort or raw accepted-intent claim',rows},null,2),{flag:'wx'});
 console.log(JSON.stringify(rows.map(r=>({preset:r.preset,pulses:r.pulses.map(p=>({input:p.input,samples:p.motion.length,meanAngleDeg:p.meanAngleDeg}))}))));
}finally{await browser.close();}
