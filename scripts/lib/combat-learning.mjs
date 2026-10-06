// Post-fight analysis only. Exact positions never enter the player's observations.
import { damageSources, inputMatchesMove } from './player-bot-review.mjs';
const stateAt = (track, tick) => {
  const row = track.filter(s => s.tick <= tick).at(-1);
  return row ? { ...row, sampleAgeTicks: tick - row.tick } : null;
};
const usefulHit = e => e.actor === 0 && e.target === 1 && ['Hit', 'GuardBroken', 'SpecialLanded'].includes(e.type) && e.damage > 0;
export const COMBAT_REVIEW_RUBRIC = [
  ['animation / contact','Anticipation, blade/body contact, weight, foot sliding, recovery and transition continuity'],
  ['direction / counterplay','Can a clean pre-contact clip identify attack direction, charge, threat and available defensive answers?'],
  ['impact / confirmation','Distinct hit, miss, block, parry and stagger; hit-stop and shake sell force without concealing the next decision'],
  ['camera / framing','Horizon stability, roll disorientation/reacquisition, clipping, body overlap, weapon visibility and boundary awareness'],
  ['VFX / art coherence','Blood origin/scale/duration, sparks, trails, repetition, clutter, contrast and gritty style'],
  ['spacing / movement','Reach vs visible contact, whiff feedback, footwork, evade destination and re-entry'],
  ['tempo / commitment','Start/contact/recovery timing, meaningful punish opportunities, interruption and readable pressure escape'],
  ['resources / fairness','Stamina/posture costs, guard-break explanation, recovery opportunity and useful choices across synthetic profiles'],
  ['input / performance','Accepted action latency, held/released controls and capture continuity; real input-to-photon/touch comfort remains untested'],
  ['audio / accessibility','Unassessed in silent capture: sound layering, cue recognition, reduced-shake/motion comfort and physical device usability'],
];
const seconds = ticks => +(ticks / 60).toFixed(3);
// A received hit alone is not proof of interruption: poise and simultaneous trades exist.
// Staggered explicitly puts its actor into hurt in the pinned engine; feint abandons the swing.
export function attackTermination(events, start, contact, nextTick = Infinity) {
  const window = events.filter(e => e.tick >= start.tick && e.tick < nextTick);
  const stop = window.find(e => e.actor === 0 && (e.type === 'Staggered'
    || e.type === 'ActionStarted' && e.action === 'feint') || e.type === 'Killed');
  const resolved = contact && (!stop || contact.tick <= stop.tick);
  const status = resolved ? 'resolved' : stop?.type === 'Staggered' ? 'interrupted'
    : stop?.action === 'feint' ? 'feinted' : stop?.type === 'Killed' ? 'fight ended' : 'unknown';
  const end = resolved ? contact : stop;
  const source = damageSources(end ? window.filter(e => e.tick <= end.tick) : []);
  return { status, tick:end?.tick ?? null, event:end?.type ?? null,
    result:resolved ? contact.type : null,
    damageReceivedUntilTermination:end ? source.opponent.total + source.arena.toPlayer : null,
    evidence:resolved ? 'Recorded attack resolution (including same-tick trade/parry).'
      : stop ? 'Recorded stagger, feint or fight end before an attack resolution.'
      : 'No recorded termination; do not count as a range miss or assume interruption.' };
}
export function combatLearning(events, decisions, track, defences, moveReach = {}, actionDuration = {roll:36,backstep:12}) {
  const attacks = events.filter(e => e.type === 'AttackStarted' && e.actor === 0).map(start => {
    const next = events.find(e => e.type === 'AttackStarted' && e.actor === 0 && e.tick > start.tick)?.tick ?? Infinity;
    const contact = events.find(e => e.tick >= start.tick && e.tick < next && e.move === start.move && (
      e.actor === 0 && ['Hit', 'GuardBroken', 'AttackMissed'].includes(e.type)
      || e.actor === 1 && ['Blocked', 'Parried', 'Dodged'].includes(e.type)));
    const choice = decisions.filter(d => d.tick <= start.tick && d.tick >= start.tick - 8
      && inputMatchesMove(d,start.move) && (d.attackStart === undefined || d.attackStart === start.tick)).at(-1);
    const reach = moveReach[start.move] ?? null;
    return { tick:start.tick, move:start.move, choiceTick:choice?.tick ?? null,
      perceivedGap:choice?.gap ?? null, perceivedUpper:choice?.gapUpper ?? null,
      actualGapAtChoice:choice?.actualGap ?? null, judgement:choice?.judgement ?? null,
      atStart:stateAt(track,start.tick), atContact:contact ? stateAt(track,contact.tick) : null,
      authoredReach:reach, result:contact?.type ?? 'unresolved', contactTick:contact?.tick ?? null,
      termination:attackTermination(events,start,contact,next),
      note:'Sampled spacing is diagnostic; facing, minimum reach, movement and interruption also affect contact.' };
  });
  const defenceOutcomes = defences.map(d => {
    const from = d.resolutionTick ?? d.tick;
    const nextHit = events.find(e => e.tick > from && usefulHit(e));
    const nextThreat = events.find(e => e.tick > from && e.type === 'AttackStarted' && e.actor === 1);
    const before = stateAt(track,d.tick), after = stateAt(track,d.tick + (actionDuration[d.type] ?? 30));
    const takenUntil = nextHit?.tick ?? events.at(-1)?.tick ?? from;
    const received = damageSources(events.filter(e => e.tick >= d.tick && e.tick <= takenUntil));
    const firstOwnAction = events.find(e => e.tick > from && e.actor === 0
      && (e.type === 'ActionStarted' || e.type === 'AttackStarted'));
    return { ...d, positionBefore:before, positionAfter:after,
      firstOwnAction:firstOwnAction ? { tick:firstOwnAction.tick,
        action:firstOwnAction.action ?? firstOwnAction.move,
        secondsAfterResolution:seconds(firstOwnAction.tick-from),
        beforeNextEnemyAttackStart:!nextThreat || firstOwnAction.tick < nextThreat.tick } : null,
      nextUsefulHit:nextHit ? { tick:nextHit.tick,move:nextHit.move,damage:nextHit.damage,
        secondsAfterAction:seconds(nextHit.tick-d.tick),secondsAfterResolution:seconds(nextHit.tick-from),
        beforeNextThreat:!nextThreat || nextHit.tick < nextThreat.tick } : null,
      damageReceivedBeforeNextHit:received.opponent.total + received.arena.toPlayer,
      observation:'Recorded sequence, not proof the defence caused subsequent damage or a miss.' };
  });
  // Explicit bounded contact bursts; no claim that proximity establishes a causal trade.
  const damage = events.filter(e => ['Hit','GuardBroken','Blocked','SpecialLanded','Whipped'].includes(e.type) && e.damage > 0);
  const bursts = [];
  for (const e of damage) {
    let row = bursts.at(-1);
    if (!row || e.tick-row.at(-1).tick > 45 || e.tick-row[0].tick > 120) bursts.push(row=[]);
    row.push(e);
  }
  const trades = bursts.map(row => {
    const source = damageSources(row), dealt=source.player.total, taken=source.opponent.total+source.arena.toPlayer;
    return { fromTick:row[0].tick,toTick:row.at(-1).tick,dealt,taken,netRawDamage:dealt-taken,
      bothDamaged:dealt>0 && taken>0, contacts:row.map(e=>({tick:e.tick,type:e.type,actor:e.actor,target:e.target,move:e.move,damage:e.damage})),
      lethal:events.some(e=>e.type==='Killed' && e.tick>=row[0].tick && e.tick<=row.at(-1).tick),
      damageBasis:'Raw event damage; can exceed remaining HP. Contact bursts <=45-tick gaps, <=120-tick span; correlation, not causal trades.' };
  }).filter(r=>r.bothDamaged);
  const visualCases=[];
  const add=(kind,e,questions)=>{ if(e) visualCases.push({kind,tick:e.tick,fromTick:Math.max(0,e.tick-90),toTick:e.tick+150,
    questions,assessment:null,status:'requires normal-speed visual review; logs cannot judge taste or camera comfort'}); };
  add('block impact',events.find(e=>e.type==='Blocked'&&e.actor===0),['Is impact distinct from parry/hit?','Does shake hide the next weapon tell?']);
  add('parry impact',events.find(e=>e.type==='Parried'&&e.actor===0),['Can we see the opponent opening?','Can we reacquire the blade before the punish?']);
  add('blood / hit feedback',events.find(e=>e.type==='Hit'&&e.damage>0),['Does blood originate at contact and fit the gritty art?','Does it obscure weapon/body motion or feel repetitive?']);
  add('roll camera',events.find(e=>e.type==='ActionStarted'&&e.actor===0&&e.action==='roll'),['Is disorientation brief and controlled?','When is the opponent weapon readable again?','Does the next threat arrive before recovery?']);
  add('charge consequence',events.find(e=>e.type==='Charged'&&e.actor===1),['Is wind-up readable without debug?','Is the defensive result understandable?']);
  const attackTerminations = Object.fromEntries(['resolved','interrupted','feinted','fight ended','unknown']
    .map(status => [status,attacks.filter(a => a.termination.status === status).length]));
  return {schemaVersion:2,reviewRubric:COMBAT_REVIEW_RUBRIC.map(([dimension,questions])=>({dimension,questions,status:'unreviewed',finding:null})),attacks,attackTerminations,defenceOutcomes,trades,visualCases,
    limits:['Synthetic player; no human skill calibration','Silent capture cannot assess sound','Camera comfort/touch feel require device evidence','Authored reach and nominal avoided damage are not measured counterfactuals']};
}
