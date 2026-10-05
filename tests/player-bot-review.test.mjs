import assert from 'node:assert/strict';
import test from 'node:test';
import { damageSources, defenceExchanges, explainDecisions, intentFor, selectMoments, videoSecondAt } from '../scripts/lib/player-bot-review.mjs';

test('accepted specials and feints are not labelled as movement or credited with later hits', () => {
  const decisions = [{ tick: 192, intent: 'level-matched special', press: 'Skill' },
    { tick: 1543, intent: 'EXPERIMENT feint a close slash', keys: ['KeyQ'] }];
  const events = [{ tick: 193, type: 'SpecialStarted', actor: 0, move: 'skill_shove' },
    { tick: 312, type: 'SpecialLanded', actor: 0, target: 1, move: 'skill_shove', damage: 38 },
    { tick: 1540, type: 'AttackStarted', actor: 0, move: 'heavy_overhead' },
    { tick: 1544, type: 'ActionStarted', actor: 0, action: 'feint' },
    { tick: 1580, type: 'Hit', actor: 0, target: 1, move: 'thrust', damage: 11 }];
  const rows = explainDecisions(decisions, events);
  assert.equal(rows[0].outcome, 'special landed');
  assert.equal(rows[0].evidence, 312);
  assert.equal(rows[1].outcome, 'feint accepted');
  assert.equal(rows[1].canceledMove, 'heavy_overhead');
  assert.equal(rows[1].evidence, 1544);
});

test('two rolls against one held overhead count one avoided threat (real probe537..608)', async () => {
  const { defenceEarned, summarizeDefences } = await import('../scripts/lib/player-bot-review.mjs');
  const events = [{ tick: 537, type: 'AttackStarted', actor: 1, move: 'heavy_overhead' },
    { tick: 567, type: 'ActionStarted', actor: 0, action: 'roll' },
    { tick: 579, type: 'Charged', actor: 1, move: 'heavy_overhead' },
    { tick: 606, type: 'ActionStarted', actor: 0, action: 'roll' },
    { tick: 608, type: 'AttackMissed', actor: 1, move: 'heavy_overhead' }];
  const rows = defenceEarned(events, [], { heavy_overhead: 26 });
  assert.deepEqual(rows.map(r => r.avoided), [0, 39]);
  assert.deepEqual(rows.map(r => r.attackTick), [537, 537]);
  assert.equal(summarizeDefences(rows).roll.avoided, 39);
  assert.equal(summarizeDefences(rows).roll.count, 2);
  assert.equal(summarizeDefences(rows).roll.windowsOpened, 1);
});

test('a blocked slash is not credited with the later thrust hit (real veteran1258 sequence)', () => {
  const decisions = [{ tick: 1257, intent: 'quick slash', press: 'KeyF', phase: 'ready' }];
  const events = [
    { tick: 1258, type: 'AttackStarted', actor: 0, move: 'light_right' },
    { tick: 1278, type: 'Blocked', actor: 1, move: 'light_right' },
    { tick: 1346, type: 'AttackStarted', actor: 0, move: 'thrust' },
    { tick: 1362, type: 'Hit', actor: 0, move: 'thrust' },
  ];
  assert.equal(explainDecisions(decisions, events)[0].outcome, 'blocked');
  assert.equal(explainDecisions(decisions, events)[0].evidence, 1278);
});

test('a stopped attack is interrupted, never credited with the next slash miss', () => {
  const events = [
    { tick: 870, type: 'AttackStarted', actor: 0, move: 'light_right' },
    { tick: 889, type: 'Hit', actor: 1, target: 0, move: 'light_right', damage: 21, counter: true },
    { tick: 889, type: 'Staggered', actor: 0, ticks: 36 },
    { tick: 944, type: 'AttackStarted', actor: 0, move: 'light_left' },
    { tick: 971, type: 'AttackMissed', actor: 0, move: 'light_left' },
  ];
  assert.equal(explainDecisions([{ tick: 869, intent: 'slash', press: 'KeyF' }], events)[0].outcome, 'interrupted');
});

test('a thrust input can legitimately become a posture-earned riposte', () => {
  const events = [{ tick:1391,type:'AttackStarted',actor:0,move:'riposte' },{ tick:1403,type:'Hit',actor:0,target:1,move:'riposte',damage:24 }];
  assert.equal(explainDecisions([{tick:1390,intent:'thrust',press:'KeyT'}],events)[0].outcome,'hit');
});

test('result matching stops at the next own attack even if both attacks use the same move', () => {
  const events = [
    { tick: 101, type: 'AttackStarted', actor: 0, move: 'thrust' },
    { tick: 145, type: 'AttackStarted', actor: 0, move: 'thrust' },
    { tick: 160, type: 'Hit', actor: 0, move: 'thrust' },
  ];
  assert.equal(explainDecisions([{ tick: 100, intent: 'thrust', press: 'KeyT' }], events)[0].outcome, 'unresolved');
});

test('the receipt separates attempted inputs from accepted attacks and results', () => {
  const decisions = [
    { tick: 100, intent: 'punish missed swing with thrust', press: 'KeyT', phase: 'recovery' },
    { tick: 200, intent: 'punish missed swing with thrust', press: 'KeyT', phase: 'ready' },
    { tick: 300, intent: 'charge heavy', press: null, phase: 'ready' },
    { tick: 400, intent: 'close under guard', press: null, phase: 'ready' },
  ];
  const events = [
    { tick: 202, type: 'AttackStarted', actor: 0, move: 'thrust' },
    { tick: 227, type: 'AttackMissed', actor: 0, move: 'thrust' },
    { tick: 302, type: 'AttackStarted', actor: 0, move: 'heavy_overhead' },
    { tick: 360, type: 'Hit', actor: 0, target: 1, move: 'heavy_overhead' },
    { tick: 430, type: 'Hit', actor: 1, target: 0 },
  ];
  const receipt = explainDecisions(decisions, events);
  assert.deepEqual(receipt.map(d => d.outcome), ['no attack started', 'missed', 'hit', 'got hit']);
  assert.equal(receipt[0].evidence, 'input during recovery');
  assert.equal(receipt[1].evidence, 227);
});

test('intent, clip moments and video-time mapping are grounded in observed events', () => {
  assert.equal(intentFor({ keys: [], press: 'KeyG' }, { tick: 112 }, 'counter', [{ tick: 100, type: 'Blocked', actor: 0 }]), 'counter after defence');
  const decisions = [{ tick: 400, intent: 'guard', outcome: 'got hit', evidence: 430 }];
  const events = [{ tick: 227, type: 'AttackMissed', actor: 0 }, { tick: 430, type: 'Hit', actor: 1, target: 0 }, { tick: 900, type: 'Whipped', target: 0 }];
  assert.deepEqual(selectMoments(events, decisions, 1800).map(m => m.kind), ['missed attack', 'failed guard', 'wall punishment', 'long inactivity']);
  assert.equal(videoSecondAt(150, [{ tick: 100, videoSeconds: 8 }, { tick: 200, videoSeconds: 12 }]), 10);
});

test('a later hit is not attributed to guard after the bot changed input', () => {
  const decisions = [{ tick: 100, intent: 'guard' }, { tick: 110, intent: 'close distance' }];
  const events = [{ tick: 120, type: 'Hit', actor: 1, target: 0 }];
  assert.equal(explainDecisions(decisions, events)[0].outcome, 'no contact');
});

test('timeout aftermath cannot become an active-fight highlight or a negative clip', () => {
  const events = [{ tick: 2907, type: 'Hit', actor: 0, target: 1 }, { tick: 5597, type: 'Whipped', actor: 0, target: 0 }];
  assert.ok(!selectMoments(events, [], 5400).some(m => m.tick > 5400 || m.kind === 'wall punishment'));
  const samples = [{ tick: 0, videoSeconds: 4.009 }, { tick: 5400, videoSeconds: 122.369 }];
  assert.equal(videoSecondAt(-1, samples), 4.009);
  assert.equal(videoSecondAt(5417, samples), 122.369);
});

test('damage sources count guard break once and keep arena damage separate', () => {
  const events = [
    { tick: 10, type: 'Hit', actor: 0, target: 1, move: 'heavy_overhead', damage: 12 },
    { tick: 20, type: 'GuardBroken', actor: 0, target: 1, move: 'heavy_overhead', damage: 27 },
    { tick: 20, type: 'Hit', actor: 0, target: 1, move: 'heavy_overhead', damage: 27 }, // duplicate result in a future event emitter
    { tick: 25, type: 'Blocked', actor: 1, target: 0, damage: 2 },
    { tick: 30, type: 'Whipped', actor: 1, target: 1, damage: 3 },
    { tick: 40, type: 'Hit', actor: 1, target: 0, damage: 8 },
  ];
  assert.deepEqual(damageSources(events), {
    player: { hits: 12, guardBreaks: 27, blockedChip: 2, specials: 0, total: 41 },
    opponent: { hits: 8, guardBreaks: 0, blockedChip: 0, specials: 0, total: 8 },
    arena: { toPlayer: 0, toOpponent: 3 },
  });
});

test('special damage counts for both attackers alongside defender chip, excluding terminal events', () => {
  const events = [
    { tick: 10, type: 'SpecialLanded', actor: 0, target: 1, damage: 30 },
    { tick: 11, type: 'SpecialLanded', actor: 1, target: 0, damage: 40 },
    { tick: 12, type: 'Blocked', actor: 1, target: 0, damage: 2 },
    { tick: 13, type: 'Blocked', actor: 0, target: 1, damage: 4 },
    { tick: 14, type: 'SpecialLanded', actor: 0, target: 1, damage: 0 },
    { tick: 15, type: 'SpecialFizzled', actor: 1 },
    { tick: 16, type: 'Killed', actor: 0, target: 1, damage: 30 },
    { tick: 17, type: 'Killed', actor: 1, target: 0, damage: 40 },
    { tick: 18, type: 'Whipped', actor: 0, target: 0, damage: 3 },
  ];
  const sources = damageSources(events);
  assert.deepEqual(sources, {
    player: { hits: 0, guardBreaks: 0, blockedChip: 2, specials: 30, total: 32 },
    opponent: { hits: 0, guardBreaks: 0, blockedChip: 4, specials: 40, total: 44 },
    arena: { toPlayer: 3, toOpponent: 0 },
  });
  assert.equal(sources.player.total, 32); // runner's damageDealt
  assert.equal(sources.opponent.total + sources.arena.toPlayer, 47); // runner's damageTaken
});

test('each defence reports what it earned: damage avoided, window opened and used, distance', async () => {
  const { defenceEarned, summarizeDefences, chargedAnswers } = await import('../scripts/lib/player-bot-review.mjs');
  const events = [
    { tick: 10, type: 'AttackStarted', actor: 1, move: 'light_right' },
    { tick: 30, type: 'Blocked', actor: 0, target: 1, move: 'light_right', perfect: false, damage: 2 },
    { tick: 40, type: 'AttackStarted', actor: 0, move: 'heavy_counter' },
    { tick: 60, type: 'Hit', actor: 0, target: 1, move: 'heavy_counter', damage: 20 },
    { tick: 100, type: 'AttackStarted', actor: 1, move: 'heavy_overhead' },
    { tick: 130, type: 'Charged', actor: 1, move: 'heavy_overhead' },
    { tick: 150, type: 'ActionStarted', actor: 0, action: 'roll' },
    { tick: 165, type: 'Dodged', actor: 0, target: 1, move: 'heavy_overhead' },
    { tick: 300, type: 'ActionStarted', actor: 0, action: 'backstep' },
  ];
  const track = [{ tick: 0, gap: 1.5, radius: 2 }, { tick: 150, gap: 1.2, radius: 3 }, { tick: 180, gap: 2.2, radius: 3.5 }, { tick: 300, gap: 2, radius: 3 }];
  const list = defenceEarned(events, track, { light_right: 10, heavy_overhead: 20 });
  assert.deepEqual(list.map(d => [d.type, d.avoided, d.windowOpened, d.windowUsed, d.counterMove, d.landed, d.result]), [
    ['block', 8, true, true, true, true, 'chip'],
    ['roll', 30, true, false, false, false, 'dodged'],
    ['backstep', 0, false, false, false, false, 'no attack in flight'],
  ]);
  assert.equal(list[1].charged, true);
  assert.equal(list[1].distance, 1);
  const summary = summarizeDefences(list);
  assert.equal(summary.roll.avoided, 30);
  assert.equal(summary.block.landed, 1);
  assert.equal(summary.backstep.underThreat, 0);
  const charged = chargedAnswers(events, [{ tick: 145, reason: 'lateral roll clear of charged overhead (sound)' }]);
  assert.deepEqual(charged, [{ tick: 130, move: 'heavy_overhead', answer: 'rolled', verdict: 'correct', cue: 'sound', playerActions: ['roll'], reactedToCharge: true, damage: 0 }]);
  assert.equal(chargedAnswers(events, [])[0].cue, 'nothing');
});

test('defence report connects a real tell, parry and useful hit without inventing avoided damage', () => {
  const events = [
    { tick: 133, type: 'AttackStarted', actor: 1, move: 'light_right', direction: 'right' },
    { tick: 155, type: 'Parried', actor: 0, move: 'light_right' },
    { tick: 180, type: 'Hit', actor: 0, target: 1, move: 'slash_riposte', damage: 24 },
    { tick: 200, type: 'Hit', actor: 1, target: 0, move: 'thrust', damage: 8 },
  ];
  const choices = [{ tick: 148, intent: 'guard the observed attack', keys: ['KeyQ', 'ArrowLeft'], press: null }];
  const samples = [{ tick: 94, gap: 2.37, radius: 1.4 }, { tick: 155, gap: 0.85, radius: 0.42 }];
  const [exchange] = defenceExchanges(events, choices, samples, 200);
  assert.equal(exchange.result.type, 'Parried');
  assert.equal(exchange.result.damageTaken, 0);
  assert.equal(exchange.result.demonstratedAvoidance, false);
  assert.deepEqual(exchange.nextUsefulHit, { tick: 180, move: 'slash_riposte', damage: 24, secondsLater: 0.42, beforeNextEnemyHit: true, beforeNextEnemyAttack: true });
  assert.deepEqual(exchange.spacing, { before: { tick: 94, gap: 2.37, radius: 1.4 }, after: { tick: 155, gap: 0.85, radius: 0.42 } });
});

test('a stopped enemy attack is reported as an interruption, not an unresolved defence', () => {
  const events = [
    { tick: 600, type: 'AttackStarted', actor: 1, move: 'kick' },
    { tick: 606, type: 'Hit', actor: 0, target: 1, move: 'thrust', damage: 17, stop: true },
  ];
  const [exchange] = defenceExchanges(events, [], [], 606);
  assert.equal(exchange.result.type, 'Interrupted');
  assert.equal(exchange.result.damageTaken, 0);
  assert.equal(exchange.nextUsefulHit.secondsLater, 0);
});

test('an enemy feint is recorded without pretending a defence landed', () => {
  const events = [
    { tick: 639, type: 'AttackStarted', actor: 1, move: 'light_right' },
    { tick: 650, type: 'ActionStarted', actor: 1, action: 'feint' },
  ];
  const [exchange] = defenceExchanges(events, [], [], 650);
  assert.equal(exchange.result.type, 'Feinted');
  assert.equal(exchange.result.damageTaken, 0);
  assert.equal(exchange.nextUsefulHit, null);
});

test('a later hit after a new incoming attack is not credited to the previous defence', () => {
  const events = [
    { tick: 387, type: 'AttackStarted', actor: 1, move: 'kick' },
    { tick: 405, type: 'Hit', actor: 1, target: 0, move: 'kick', damage: 4 },
    { tick: 451, type: 'AttackStarted', actor: 1, move: 'light_right' },
    { tick: 473, type: 'Parried', actor: 0, move: 'light_right' },
    { tick: 505, type: 'Hit', actor: 0, target: 1, move: 'heavy_riposte', damage: 24 },
  ];
  const rows = defenceExchanges(events, [], [], 505);
  assert.equal(rows[0].nextUsefulHit.tick, 505);
  assert.equal(rows[0].nextUsefulHit.beforeNextEnemyAttack, false);
  assert.equal(rows[1].nextUsefulHit.beforeNextEnemyAttack, true);
});
