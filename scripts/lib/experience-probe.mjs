// Read-only capture of actual rendered state, accepted combat events and trusted DOM inputs.
export function installExperienceProbe() {
  if(location.hostname!=='127.0.0.1'||!globalThis.__view)throw Error('Local debug view required');
  const view=__view,render=view.render;
  const probe=globalThis.__experience={frames:[],events:[],inputs:[]};
  const combat=e=>probe.events.push(...structuredClone(e.detail.events));
  const input=e=>probe.inputs.push({type:e.type,target:e.target.id,trusted:e.isTrusted,pointerType:e.pointerType,
    x:e.clientX,y:e.clientY,tick:probe.frames.at(-1)?.tick??null,performanceMs:performance.now()});
  window.addEventListener('frankendom:combat',combat);
  const types=['pointerdown','pointermove','pointerup','pointercancel'];
  for(const type of types)document.addEventListener(type,input,true);
  view.render=function(state,locked,dt,practice,...rest){
    const result=render.call(this,state,locked,dt,practice,...rest);
    probe.frames.push({tick:practice.duel.tick,performanceMs:performance.now(),fighters:structuredClone(practice.duel.fighters)});
    return result;
  };
  probe.uninstall=()=>{view.render=render;window.removeEventListener('frankendom:combat',combat);
    for(const type of types)document.removeEventListener(type,input,true);};
}

export function touchEffect(events,frames) {
  const p=frames[0]?.fighters[0],q=frames.at(-1)?.fighters[0];
  return {accepted:events.filter(e=>e.actor===0&&['ActionStarted','AttackStarted','Charged'].includes(e.type)),
    contacts:events.filter(e=>['Hit','Blocked','Parried','Dodged','GuardBroken'].includes(e.type)),
    displacement:p&&q?Math.hypot(q.body.x-p.body.x,q.body.z-p.body.z):null,
    guardDirections:[...new Set(frames.filter(f=>f.fighters[0].phase==='guard').map(f=>f.fighters[0].guardDirection))]};
}

export function touchCasePassed(name,effect) {
  const action=x=>effect.accepted.some(e=>e.type==='ActionStarted'&&e.action===x);
  const attack=x=>effect.accepted.some(e=>e.type==='AttackStarted'&&e.move===x);
  if(name==='draw')return action('draw');
  if(name==='slash')return effect.accepted.some(e=>e.move?.startsWith('light_'));
  if(['stab','kick','pommel'].includes(name))return attack({stab:'thrust',kick:'kick',pommel:'skill_pommel'}[name]);
  if(name==='charged-heavy')return effect.accepted.some(e=>e.type==='Charged');
  if(name.startsWith('guard-'))return effect.guardDirections.includes(name==='guard-straight'?null:name.slice(6));
  if(name==='short-step')return action('backstep')&&!action('roll');
  if(['held-roll','moving-roll'].includes(name))return action('roll');
  if(name==='feint')return action('feint');
  if(name==='cancel-heavy')return effect.accepted.length===0;
  if(name==='move-and-guard')return effect.displacement>0.1&&effect.guardDirections.length>0;
  if(name.startsWith('contact-'))return effect.contacts.some(e=>e.actor===0&&e.type===(name==='contact-parry'?'Parried':'Blocked'));
  return false;
}
