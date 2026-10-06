// Retrospective browser-receipt timing, never player perception or game input.
import { inputMatchesMove } from './player-bot-review.mjs';
const median = xs => {const a=[...xs].sort((a,b)=>a-b);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2:null;};
const actionKeys=new Set(['KeyF','KeyT','KeyG','KeyC','KeyQ','KeyE']);
const matches=(key,e)=>e.type==='AttackStarted' ? inputMatchesMove({press:key},e.move)
  : e.type==='ActionStarted' && (key==='KeyQ'&&['guard','parry','feint'].includes(e.action)
    || key==='KeyE'&&['roll','backstep'].includes(e.action) || key==='KeyF'&&e.action==='draw');
export function inputActionMetrics(receipt, learning={}, windowMs=750) {
  if(!Array.isArray(receipt.keyboard)||!Array.isArray(receipt.eventTimeline))return {
    available:false,reason:'No actual browser key/event receipt; do not infer from planned input ticks.'};
  const begin=receipt.begin.performanceMs,end=receipt.end.performanceMs;
  const frames=(receipt.frames??[]).filter(f=>Number.isFinite(f.performanceMs)
    &&f.performanceMs>=begin&&f.performanceMs<=end&&f.fighters?.[0])
    .sort((a,b)=>a.performanceMs-b.performanceMs);
  const priorOwnSample=time=>{
    let low=0,high=frames.length;
    while(low<high){const mid=(low+high)>>>1;if(frames[mid].performanceMs<=time)low=mid+1;else high=mid;}
    const frame=frames[low-1];if(!frame)return null;
    const p=frame.fighters[0];
    return {performanceMs:frame.performanceMs,ageMs:+(time-frame.performanceMs).toFixed(3),
      tick:frame.tick??null,lastDrawnTick:frame.lastDrawnTick??null,
      state:{phase:p.phase??null,phaseAge:p.age??null,stamina:p.stamina??null,
        maxStamina:p.maxStamina??null,health:p.health??null,stun:p.stun??null,
        parryCooldown:p.parryCooldown??null,lastMove:p.lastMove??null,buffer:p.buffer??null}};
  };
  const keys=receipt.keyboard.filter(k=>k.performanceMs>=begin&&k.performanceMs<=end&&k.isTrusted);
  const requests=keys.filter(k=>k.type==='keydown'&&!k.repeat&&actionKeys.has(k.code));
  const used=new Set(),actions=[];
  for(const row of receipt.eventTimeline){
    const e=row.event,time=row.dispatchPerformanceMs;
    if(e.actor!==0||!['AttackStarted','ActionStarted'].includes(e.type)||time<begin||time>end)continue;
    let index=-1;
    for(let i=requests.length-1;i>=0;i--)if(!used.has(i)&&requests[i].performanceMs<=time
      &&time-requests[i].performanceMs<=windowMs&&matches(requests[i].code,e)){index=i;break;}
    const heldGuard=index<0&&e.action==='guard'&&keys.filter(k=>k.code==='KeyQ'&&k.performanceMs<=time).at(-1)?.type==='keydown';
    if(index>=0)used.add(index);
    const attack=learning.attacks?.find(a=>a.tick===e.tick&&a.move===e.move);
    actions.push({tick:e.tick,type:e.type,action:e.action??e.move,dispatchPerformanceMs:time,
      association:index>=0?'compatible keydown candidate':heldGuard?'held guard without a new keydown':'unattributed',
      code:index>=0?requests[index].code:heldGuard?'KeyQ':null,
      keyReceivedPerformanceMs:index>=0?requests[index].performanceMs:null,
      receivedToDispatchMs:index>=0?+(time-requests[index].performanceMs).toFixed(3):null,
      priorOwnSample:index>=0?priorOwnSample(requests[index].performanceMs):null,
      attackResult:attack?.result??null,attackTermination:attack?.termination??null});
  }
  const unmatched=requests.flatMap((k,i)=>used.has(i)?[]:[{code:k.code,performanceMs:k.performanceMs,
    priorOwnSample:priorOwnSample(k.performanceMs),
    status:end-k.performanceMs<windowMs?'capture ends before matching window completes':'no matching accepted action observed'}]);
  const delays=actions.map(a=>a.receivedToDispatchMs).filter(Number.isFinite);
  return {available:true,windowMs,requests:requests.length,acceptedActions:actions.length,
    candidateLinkedActions:delays.length,medianReceivedToDispatchMs:median(delays),actions,unmatched,
    limits:'Compatible temporal association, not proof of intent or causality. Prior own-state samples precede key receipt and include their age; they are retrospective telemetry, not exact refusal reasons or information given to the policy. Dispatch batches simulation ticks; held guard is not a fresh command. Unmatched keys may be refused, buffered, superseded or outside this matcher. Not physical input-to-photon, touch comfort or human reaction time.'};
}
