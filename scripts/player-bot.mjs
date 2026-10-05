// A local-only browser player: real keyboard input, seeded opponents, full-fight video and event receipts.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const gameRoot = fileURLToPath(new URL('../game/', import.meta.url));
import { chromium } from 'playwright';
import { preview } from 'vite';
import { harnessClock } from './lib/harness-clock.mjs';
import { BOT_CONFIG as CONFIG, chooseChargedAttack, chooseGuardCounter, chooseTacticalAttack, fightSeeds, isHeavyMove } from './lib/player-bot-policy.mjs';
import { chargedAnswers, damageSources, defenceEarned, defenceExchanges, explainDecisions, intentFor, selectMoments, summarizeDefences, videoSecondAt } from './lib/player-bot-review.mjs';
import { limitedObservation } from './lib/player-bot-observation.mjs';
import { chooseProbe, probeNames } from './lib/player-bot-probes.mjs';
import { createSparring } from './lib/sim-bot.mjs';
import { optionValue } from './lib/cli-option.mjs';
import { ENCOUNTERS } from '../game/src/roster.ts';
import { LEVEL_ANCHORS, LONGSWORD, OPPONENTS, RULES, WEAPONS, opponentAt } from '../game/src/moves.ts';
import { RADIUS } from '../game/src/sim.ts';

const LEVEL = LEVEL_ANCHORS.easy;   // the one level the bot fights: the seed, the pick, the assert and his weapon tables all read it

const option = (name, fallback) => optionValue(process.argv, name, fallback);
const seedArg = Number(option('seed', '731'));
assert.ok(Number.isSafeInteger(seedArg) && seedArg >= 0 && seedArg <= 0xffffffff, 'seed must be an unsigned 32-bit integer');
const first = seedArg >>> 0;
const count = Number(option('fights', process.argv.includes('--smoke') ? '1' : '3'));
const reactionMs = Number(option('reaction-ms', '180'));
const stepMs = Number(option('step-ms', '64'));
const recordVideo = !process.argv.includes('--no-video');
const headed = process.argv.includes('--headed');
const browserKind = option('browser', 'chromium');
assert.ok(['chromium', 'chrome'].includes(browserKind), 'browser must be chromium or chrome');
const recordClips = recordVideo && process.argv.includes('--clips') && !process.argv.includes('--no-clips');
const showDebugVideo = process.argv.includes('--show-debug-video');
const strategy = option('strategy', 'tactical');
const observation = option('observation', 'limited');
const probe = option('probe', null);
assert.ok(probe === null || probeNames.includes(probe), 'unknown experimental probe');
const sparringSearch = option('sparring-url', null);
if (sparringSearch) {
  const { config } = createSparring(sparringSearch, first);
  assert.equal(config.engineLevel, LEVEL, 'browser policy currently supports Easy level6 only');
  assert.equal(config.weapon, 'longsword', 'browser reach policy currently supports longsword only');
}
const requested = option('opponents', option('opponent', 'pitborn'));
const playable = ENCOUNTERS.filter(entry => !entry.hold).map(entry => entry.id);
const opponents = requested === 'all' ? playable : requested.split(',');
assert.ok(Number.isInteger(count) && count > 0 && count <= 12);
assert.ok(Number.isFinite(reactionMs) && reactionMs >= 100 && reactionMs <= 700);
assert.ok([16, 32, 64].includes(stepMs));
assert.ok(['charged', 'counter', 'tactical'].includes(strategy));
assert.ok(['debug', 'limited'].includes(observation));
assert.ok(opponents.length && opponents.every(id => playable.includes(id)), 'choose a playable opponent or --opponents=all');
const seedList = option('seeds', null);
const seeds = seedList ? seedList.split(',').map(Number) : fightSeeds(first, count);
assert.ok(seeds.length === count && new Set(seeds).size === count && seeds.every(s => Number.isSafeInteger(s) && s >= 0 && s <= 0xffffffff), 'seeds must contain exactly fights unique unsigned integers');
const dir = option('out', 'artifacts/combat/player-bot');
await fs.mkdir(dir, { recursive: true });
const servedUrl = option('url', null);
if (servedUrl) assert.ok(new URL(servedUrl).hostname === '127.0.0.1', 'external preview must use a loopback URL');
const server = servedUrl ? null : await preview({ root: gameRoot, preview: { host: '127.0.0.1', port: 0 } });
const origin = servedUrl ?? `http://127.0.0.1:${server.httpServer.address().port}`;
const browser = await chromium.launch({ headless: !headed, ...(browserKind === 'chrome' ? { channel: 'chrome' } : { executablePath: chromium.executablePath() }) });
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: gameRoot, encoding: 'utf8', timeout: 20_000 }).trim();
if (servedUrl) assert.equal((await (await fetch(new URL('/.bot-revision', origin))).text()).trim(), revision, 'served build does not match imported engine');
const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: gameRoot, encoding: 'utf8', timeout: 20_000 }).trim() !== '';
const botRoot = fileURLToPath(new URL('../', import.meta.url));
let botRevision = null;
try { botRevision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: botRoot, encoding: 'utf8', timeout: 20_000, stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* staged snapshot: use botContentSha256 */ }
const digest = createHash('sha256');
const hashBotTree = dir => { for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
  const path = join(dir, entry.name);
  if (entry.isDirectory()) hashBotTree(path);
  else digest.update(relative(botRoot, path)).update('\0').update(readFileSync(path));
} };
hashBotTree(join(botRoot, 'scripts'));
for (const file of ['current-game.sha', 'package-lock.json']) digest.update(file).update('\0').update(readFileSync(join(botRoot, file)));
const botContentSha256 = digest.digest('hex');
const identity = probe ? `EXPERIMENT ${probe} (coverage only)` : strategy === 'tactical' ? 'CURRENT tactical test bot' : 'ARCHIVED diagnostic';
console.log(JSON.stringify({ identity, botRevision, botContentSha256, revision: `${revision}${dirty ? '-dirty' : ''}`, strategy, difficulty: 'easy', observation, headed }));
const receipt = { identity, botRevision, botContentSha256, revision: `${revision}${dirty ? '-dirty' : ''}`, opponents, difficulty: 'easy', strategy, reactionMs, stepMs, headed, video: recordVideo, clips: recordClips, observation, observationAccess: observation === 'debug' ? 'exact current debug gap/position/stamina/phase and combat events' : 'player view: stamina/health meters, perceivable events only (a swing seen starting and ending, its side; the charge sound without whose it is; contact sounds, whiffs, rolls), all opponent-side information delayed; charge inferred from the sound or the windup hold time; distance rounded to half-metres; current own phase', fights: [] };
try {
  for (const opponent of opponents) for (const seed of seeds) {
    const [range, defense, extra] = CONFIG[opponent];
    const fought = WEAPONS[opponentAt(OPPONENTS[opponent], LEVEL).weapon];   // what he fights with at the seeded LEVEL (the Centurion: the gladius, not his roster trident)
    const windup = Object.fromEntries(Object.entries(fought.moves).map(([move, timing]) => [move, timing.windup]));
    const config = { range, defense, windup, parryTicks: RULES.parry, thrustRange: LONGSWORD.moves.thrust.reach - .1, wallRadius: RADIUS - RULES.wall.loiter.band - .4,
      heavyBlockCost: fought.moves.heavy_overhead.staminaDamage, ...extra };   // a block of his heavy costs this much stamina (the player's guard costScale is 1)
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, ...(recordVideo ? { recordVideo: { dir, size: { width: 390, height: 844 } } } : {}) });
    const page = await context.newPage(), video = page.video(), held = new Set(), fight = { opponent, seed, inputs: [], decisions: [], eligibleOpportunities: [], events: [], samples: [], track: [], errors: [] };
    const videoStart = performance.now();
    const release = async () => { for (const key of [...held]) { try { await page.keyboard.up(key); fight.inputs.push({ tick: fight.durationSeconds == null ? null : Math.round(fight.durationSeconds * 60), key, edge: 'up', reason: 'end/reset/error' }); } catch (error) { fight.errors.push(`release ${key}: ${error}`); } finally { held.delete(key); } } };
    const keys = async (wanted, tick) => {
      for (const key of [...held]) if (!wanted.includes(key)) { await page.keyboard.up(key); held.delete(key); fight.inputs.push({ tick, key, edge: 'up' }); }
      for (const key of wanted) if (!held.has(key)) { await page.keyboard.down(key); held.add(key); fight.inputs.push({ tick, key, edge: 'down' }); }
    };
    try {
      page.on('pageerror', e => fight.errors.push(String(e)));
      await page.route('**/*sentry.io/**', route => route.abort());
      await page.addInitScript((level) => { try { if (!sessionStorage.getItem('frankendom.dev-kit')) sessionStorage.setItem('frankendom.dev-kit', JSON.stringify({ level })); } catch {} }, LEVEL);   // the Dev kit's level, seeded before boot: a live pick that moves the Centurion's loadout reloads the page (main.ts loadoutMoved)
      const search = sparringSearch ? new URL(sparringSearch, origin).searchParams : new URLSearchParams();
      search.set('opponent', opponent); search.set('debug', '1'); search.set('botSeed', String(seed));
      if (sparringSearch) createSparring(`?${search}`, seed); // reject class/level mismatches before input
      await page.goto(`${origin}/?${search}`);
      await page.evaluate(({ identity, revision, opponent, seed }) => { document.title = `${identity} · ${revision.slice(0, 8)} · ${opponent} ${seed}`; }, { identity, revision, opponent, seed });
      await page.waitForFunction(() => document.querySelector('#attack-button')?.getAttribute('aria-disabled') === 'false', null, { timeout: 90000 });
      fight.renderer = await page.evaluate(() => {
        const canvas = document.querySelector('#world');
        const gl = canvas?.getContext('webgl2') ?? canvas?.getContext('webgl');
        const info = gl?.getExtension('WEBGL_debug_renderer_info');
        return { name: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unavailable', canvas: [canvas?.width, canvas?.height], dpr: devicePixelRatio };
      });
      console.log(JSON.stringify({ opponent, seed, browser: browserKind, renderer: fight.renderer, stage: 'ready', origin }));
      assert.equal(await page.locator('#difficulty-select').inputValue(), String(LEVEL));
      const { run, until } = await harnessClock(page);
      { const enter = page.getByRole('button', { name: 'Enter the arena' }); if (await enter.isVisible().catch(() => false)) await enter.tap(); }
      await until(() => document.querySelector('#welcome').hidden && document.querySelector('#art-status').textContent === '', 20000);
      await page.evaluate(({ showLabel, showDebug }) => {
        window.__botEvents = [];
        window.addEventListener('frankendom:combat', e => window.__botEvents.push(...e.detail.events));
        if (!showDebug) document.querySelector('#debug').style.visibility = 'hidden';
        if (!showLabel) return;
        const label = document.createElement('div'); label.id = 'bot-receipt';
        Object.assign(label.style, { position: 'fixed', top: '2px', left: '2px', zIndex: '9999', background: '#111d', color: 'white', font: '12px monospace', padding: '3px' });
        document.body.append(label);
      }, { showLabel: recordVideo, showDebug: showDebugVideo });
      if (recordVideo && showDebugVideo) fight.debugRect = await page.locator('#debug').boundingBox();
      fight.inputs.push({ tick: 0, key: 'KeyF', edge: 'press' });
      await page.keyboard.press('KeyF');
      await until(() => document.querySelector('#guard-button').getAttribute('aria-disabled') === 'false', 20000);
      fight.openingScreenshot = `${dir}/${opponent}-${seed}-opening.png`;
      await page.screenshot({ path: fight.openingScreenshot });
      let cursor = 0, memory = { tell: null, counterUntil: 0 }, perception = {}, perceivedEvents = [], lastInput = '', seenEligible = new Set();
      for (let steps = 0; steps < 3000; steps++) {
        const obs = await page.evaluate(cursor => {
          const text = document.querySelector('#debug').textContent, lines = text.split('\n'), enemy = lines.findIndex(l => l.startsWith('warden:'));
          const own = lines.findIndex(l => l.startsWith('you:'));
          const pos = lines[own + 2]?.match(/pos (-?[\d.]+),(-?[\d.]+)/);
          if (!pos) throw new Error('combat debug lacks player position');
          const ownBar = lines[own + 1]?.trim() ?? '', enemyBar = lines[enemy + 1]?.trim() ?? '';
          return { tick: Number(document.querySelector('#debug').dataset.tick), gap: Number(text.match(/gap ([\d.]+)/)?.[1] ?? 99),
            radius: Math.hypot(Number(pos[1]), Number(pos[2])),
            hp: Number(document.querySelector('#player-health').value), enemyHp: Number(document.querySelector('#target-health').value),
            stamina: Number(text.match(/you: hp \d+ st (\d+)/)?.[1] ?? 0),
            phase: ownBar.includes('/') ? 'attack' : ownBar.split(/[ +]/)[0], enemyPhase: enemyBar.split(/[ +]/)[0] === 'ready' ? 'ready' : enemyBar.includes('/') ? 'attack' : 'other',
            ownState: ownBar.split(/[ +]/)[0], ownAge: Number(ownBar.match(/\s(\d+)(?:\/|$)/)?.[1] ?? 0), enemyState: enemyBar.split(/[ +]/)[0],
            heavy: document.querySelector('#heavy-button').getAttribute('aria-disabled') === 'false',
            light: document.querySelector('#attack-button').getAttribute('aria-disabled') === 'false',
            thrust: document.querySelector('#thrust-button').getAttribute('aria-disabled') === 'false',
            kick: document.querySelector('#kick-button').getAttribute('aria-disabled') === 'false',
            dodge: document.querySelector('#dodge-button').getAttribute('aria-disabled') === 'false',
            skill: document.querySelector('#skill-button').getAttribute('aria-disabled') === 'false',
            meterStamina: Number(document.querySelector('#stamina').value),
            posture: Number(document.querySelector('#posture').value),   // the player's own posture meter (on screen)
            events: window.__botEvents.slice(cursor), count: window.__botEvents.length };
        }, cursor);
        cursor = obs.count;
        fight.events.push(...obs.events);
        if (fight.track.at(-1)?.tick !== obs.tick) fight.track.push({ tick: obs.tick, gap: obs.gap, radius: +obs.radius.toFixed(2) });
        if (!fight.samples.length || obs.tick - fight.samples.at(-1).tick >= 60) {
          fight.samples.push({ tick: obs.tick, videoSeconds: (performance.now() - videoStart) / 1000, hp: obs.hp, enemyHp: obs.enemyHp, stamina: obs.stamina, gap: obs.gap, radius: obs.radius });
          if (recordVideo) {
            const geometry = await page.evaluate(() => {
              const box = document.querySelector('#world').getBoundingClientRect();
              return { layout: [document.documentElement.clientWidth, document.documentElement.clientHeight], canvas: [box.x, box.y, box.width, box.height] };
            });
            fight.videoGeometry ??= { initial: geometry, checks: 0, changes: [], suitableForReview: true };
            fight.videoGeometry.checks++;
            const [w, h] = geometry.layout, [x, y, cw, ch] = geometry.canvas;
            if (Math.abs(x) > 1 || Math.abs(y) > 1 || Math.abs(cw - w) > 1 || Math.abs(ch - h) > 1 || JSON.stringify(geometry) !== JSON.stringify(fight.videoGeometry.initial)) {
              fight.videoGeometry.suitableForReview = false;
              if (fight.videoGeometry.changes.length < 4) fight.videoGeometry.changes.push({ tick: obs.tick, ...geometry });
            }
          }
        }
        if (steps && steps % 600 === 0) console.log(JSON.stringify({ seed, tick: obs.tick, hp: obs.hp, enemyHp: obs.enemyHp, blocks: fight.events.filter(e => e.type === 'Blocked' && e.actor === 0).length }));
        if (!obs.hp || !obs.enemyHp || obs.tick >= 5400) break;
        const seen = observation === 'limited' ? limitedObservation(obs, perception, Math.ceil(reactionMs / 1000 * 60)) : obs;
        perceivedEvents.push(...seen.events);
        const choose = strategy === 'counter' ? chooseGuardCounter : strategy === 'tactical' ? chooseTacticalAttack : chooseChargedAttack;
        const decision = probe ? chooseProbe(seen, memory, Math.ceil(reactionMs / 1000 * 60), config, probe)
          : choose(seen, memory, Math.ceil(reactionMs / 1000 * 60), config);
        for (const opportunity of decision.eligible ?? []) {
          const id = `${opportunity.kind}/${opportunity.tick}`;
          if (!seenEligible.has(id)) { seenEligible.add(id); fight.eligibleOpportunities.push({ observedTick: obs.tick, ...opportunity }); }
        }
        const input = `${decision.keys.join(',')}/${decision.press ?? ''}`;
        if (input !== lastInput || decision.press) fight.decisions.push({ tick: obs.tick, intent: intentFor(decision, seen, strategy, perceivedEvents.slice(-8)), reason: decision.reason, keys: decision.keys, press: decision.press, phase: seen.phase, gap: seen.gap, gapUpper: seen.gapUpper, gapObservedTick: seen.gapObservedTick, actualGap: obs.gap, stamina: seen.stamina, radius: seen.radius });
        lastInput = input;
        await keys(decision.keys, obs.tick);
        if (decision.press) {
          if (decision.press === 'Skill') await page.locator('#skill-button').click();
          else await page.keyboard.press(decision.press);
          fight.inputs.push({ tick: obs.tick, key: decision.press, edge: decision.press === 'Skill' ? 'click' : 'press' });
        }
        if (recordVideo) await page.evaluate(({ tick, seed, opponent }) => { document.querySelector('#bot-receipt').textContent = `${opponent} ${seed} · tick ${tick}`; }, { tick: obs.tick, seed, opponent });
        await run(stepMs);
      }
      const end = await page.evaluate(() => ({ tick: Number(document.querySelector('#debug').dataset.tick), hp: Number(document.querySelector('#player-health').value), enemyHp: Number(document.querySelector('#target-health').value), events: window.__botEvents }));
      fight.endTick = end.tick;
      fight.events = end.events;
      if (fight.samples.at(-1)?.tick < end.tick) fight.samples.push({ ...fight.samples.at(-1), hp: end.hp, enemyHp: end.enemyHp, tick: end.tick, videoSeconds: (performance.now() - videoStart) / 1000 });
      fight.finalHealth = { player: end.hp, opponent: end.enemyHp };
      fight.finishScreenshot = `${dir}/${opponent}-${seed}-finish.png`;
      await page.screenshot({ path: fight.finishScreenshot });
      fight.outcome = end.enemyHp === 0 ? 'win' : end.hp === 0 ? 'loss' : 'timeout';
      fight.durationSeconds = +(end.tick / 60).toFixed(2);
      fight.damageSources = damageSources(fight.events);
      fight.damageDealt = fight.damageSources.player.total;
      fight.damageTaken = fight.damageSources.opponent.total + fight.damageSources.arena.toPlayer;
      fight.wallWhips = fight.events.filter(e => e.type === 'Whipped' && e.target === 0).length;
      fight.thrustStarts = fight.events.filter(e => e.type === 'AttackStarted' && e.actor === 0 && e.move === 'thrust').length;
      fight.thrustHits = fight.events.filter(e => e.type === 'Hit' && e.actor === 0 && e.move === 'thrust').length;
      fight.thrustDamage = fight.events.filter(e => e.type === 'Hit' && e.actor === 0 && e.move === 'thrust').reduce((n, e) => n + (e.damage ?? 0), 0);
      fight.emptySwings = fight.events.filter(e => e.type === 'AttackMissed' && e.actor === 0).length;
      fight.attacksByMove = Object.fromEntries([...new Set(fight.events.filter(e => e.type === 'AttackStarted' && e.actor === 0).map(e => e.move))].map(move => [move, {
        starts: fight.events.filter(e => e.type === 'AttackStarted' && e.actor === 0 && e.move === move).length,
        hits: fight.events.filter(e => e.type === 'Hit' && e.actor === 0 && e.move === move).length,
        hitDamage: fight.events.filter(e => e.type === 'Hit' && e.actor === 0 && e.move === move).reduce((n, e) => n + (e.damage ?? 0), 0),
        guardBreakDamage: fight.events.filter(e => e.type === 'GuardBroken' && e.actor === 0 && e.move === move).reduce((n, e) => n + (e.damage ?? 0), 0),
      }]));
      const ownStarts = fight.events.filter(e => e.type === 'AttackStarted' && e.actor === 0);
      const heavyStarts = ownStarts.filter(e => isHeavyMove(e.move)).length;
      fight.attackMix = { attacks: ownStarts.length, heavies: heavyStarts, heavyPercent: ownStarts.length ? +(100 * heavyStarts / ownStarts.length).toFixed(1) : null,
        passed: ownStarts.length > 0 && 5 * heavyStarts <= ownStarts.length };
      fight.defenceExchanges = defenceExchanges(fight.events, fight.decisions, fight.samples, end.tick);
      fight.defensiveChoices = Object.fromEntries(['roll', 'backstep', 'guard', 'parry', 'feint'].map(action => [action, fight.events.filter(e => e.type === 'ActionStarted' && e.actor === 0 && e.action === action).length]));
      fight.secondsNearWall = +(fight.samples.reduce((n, s, i) => n + (s.radius >= config.wallRadius ? ((fight.samples[i + 1]?.tick ?? end.tick) - s.tick) / 60 : 0), 0)).toFixed(2);
      const contacts = fight.events.filter(e => ['Hit', 'Blocked', 'Parried'].includes(e.type)).map(e => e.tick);
      const contactTicks = [0, ...contacts, end.tick], contactGaps = contactTicks.slice(1).map((tick, i) => tick - contactTicks[i]);
      fight.longestNoContactSeconds = +(Math.max(...contactGaps) / 60).toFixed(2);
      fight.secondsWithoutContact = +(contactGaps.filter(ticks => ticks >= 300).reduce((n, ticks) => n + ticks, 0) / 60).toFixed(2);
      const defences = fight.events.filter(e => (e.type === 'Blocked' || e.type === 'Parried') && e.actor === 0);
      fight.initiativeAfterDefence = { kept: defences.filter(d => {
        const next = fight.events.find(e => e.tick > d.tick && e.tick <= d.tick + 120 && e.type === 'Hit');
        return next?.actor === 0;
      }).length, chances: defences.length };
      for (const [name, type, move] of [['blocks', 'Blocked'], ['parries', 'Parried'], ['counterStarts', 'AttackStarted', 'heavy_counter'], ['counterHits', 'Hit', 'heavy_counter'], ['exhaustions', 'StaminaExhausted']])
        fight[name] = fight.events.filter(e => e.type === type && e.actor === 0 && (!move || e.move === move)).length;
      await release();
      for (let second = 0; recordVideo && second < 5; second++) {
        await run(1000); // record the consequence and end screen after the decisive health event
        await page.evaluate(({ seed, opponent }) => { document.querySelector('#bot-receipt').textContent = `${opponent} ${seed} · tick ${document.querySelector('#debug').dataset.tick}`; }, { seed, opponent });
      }
      fight.aftermathEvents = await page.evaluate(start => window.__botEvents.slice(start), end.events.length);
      fight.decisions = explainDecisions(fight.decisions, fight.events);
      const moveDamage = Object.fromEntries(Object.entries(fought.moves).map(([move, def]) => [move, def.damage]));
      fight.defences = defenceEarned(fight.events, fight.track, moveDamage, RULES.charge.damage);
      fight.defenceSummary = summarizeDefences(fight.defences);
      fight.chargedHeavies = chargedAnswers(fight.events, fight.decisions);
      fight.moments = selectMoments(fight.events, fight.decisions, end.tick);
      fight.videoTailSeconds = null; // capture tail is not separately measured
      if (fight.outcome === 'loss') {
        await page.evaluate(() => document.querySelector('#reset-button').click());
        await run(50);
        fight.resetCheck = { inputsReleased: held.size === 0, health: await page.locator('#player-health').evaluate(bar => Number(bar.value)) };
        assert.ok(fight.resetCheck.inputsReleased && fight.resetCheck.health > 0, 'rematch starts without held inputs');
      }
      assert.deepEqual(fight.errors, []);
    } catch (error) {
      fight.error = String(error); fight.errorStack = error.stack;
      fight.browserFailure = { pageClosed: page.isClosed(), browserConnected: browser.isConnected(), lastObservedTick: fight.samples.at(-1)?.tick ?? null };
    }
    finally {
      await release();
      fight.inputsReleased = held.size === 0 && !fight.errors.some(e => e.startsWith('release '));
      await context.close();
      if (video) {
        fight.video = `${dir}/${opponent}-${seed}.webm`;
        await fs.rename(await video.path(), fight.video);
        if (recordClips && fight.moments) for (const [index, moment] of fight.moments.entries()) {
          const fromTick = Math.max(0, moment.tick - 180), toTick = Math.min(fight.endTick, moment.tick + 180);
          if (toTick <= fromTick) continue;
          const from = videoSecondAt(fromTick, fight.samples), to = videoSecondAt(toTick, fight.samples);
          if (!Number.isFinite(from) || !Number.isFinite(to) || to - from < .2) continue;
          const speed = (to - from) / ((toTick - fromTick) / 60);
          if (!Number.isFinite(speed) || speed <= 0) continue;
          const path = `${dir}/${opponent}-${seed}-${index + 1}.mp4`;
          const box = fight.debugRect;
          const mask = box ? `drawbox=x=0:y=0:w=iw:h=${Math.ceil(box.y + box.height + 12)}:color=black:t=fill,` : '';
          try {
            execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(from), '-t', String(to - from), '-i', fight.video, '-vf', `${mask}setpts=(PTS-STARTPTS)/${speed},fps=30`, '-fps_mode', 'vfr', '-an', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', path], { timeout: 60000, stdio: 'pipe' });
            moment.clip = path; moment.simSeconds = +((toTick - fromTick) / 60).toFixed(2); moment.audio = false; moment.debugMasked = !!box;
          } catch (error) { moment.clipError = String(error); }
        }
      }
      await fs.writeFile(`${dir}/${opponent}-${seed}.json`, JSON.stringify(fight, null, 2));
      const { inputs, decisions, events, samples, track, defences, ...summary } = fight;
      receipt.fights.push({ ...summary, defenceRows: defences, inputCount: inputs.length, decisionCount: decisions.length, eventCount: events.length, sampleCount: samples.length });
      console.log(JSON.stringify({ opponent, seed, outcome: fight.outcome, durationSeconds: fight.durationSeconds, blocks: fight.blocks, counterHits: fight.counterHits, error: fight.error }));
    }
  }
  receipt.report = Object.fromEntries(opponents.map(id => {
    const fights = receipt.fights.filter(f => f.opponent === id), charged = fights.flatMap(f => f.chargedHeavies ?? []);
    const tally = list => list.reduce((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {});
    return [id, { wins: fights.filter(f => f.outcome === 'win').length, losses: fights.filter(f => f.outcome === 'loss').length, timeouts: fights.filter(f => f.outcome === 'timeout').length,
      chargedHeavies: { total: charged.length, correct: charged.filter(c => c.verdict === 'correct').length, guardedInto: charged.filter(c => c.verdict === 'guarded into').length,
        other: charged.filter(c => c.verdict === 'other').length, answers: tally(charged.map(c => c.answer)), cueNamed: tally(charged.map(c => c.cue)), damageTaken: charged.reduce((n, c) => n + c.damage, 0) },
      defences: summarizeDefences(fights.flatMap(f => f.defenceRows ?? [])) }];
  }));
  receipt.rates = Object.fromEntries(opponents.map(id => [id, receipt.fights.filter(f => f.opponent === id && f.outcome === 'win').length / count]));
  receipt.passed = opponents.every(id => receipt.rates[id] >= 2 / 3) && receipt.fights.every(f => !f.error && !f.errors.length && f.inputsReleased && (strategy !== 'tactical' || f.attackMix.passed));
  receipt.experimental = probe !== null;
  receipt.probe = probe; receipt.sparringSearch = sparringSearch;
  receipt.browserKind = browserKind; receipt.drawsSuppressed = false;
  receipt.clock = 'controlled fixed-step; not realtime FPS';
  receipt.defenceMetricNotes = { avoided: 'Nominal move damage estimate; not a measured counterfactual', distance: 'Before/after gap sampled at observed ticks', wall: 'Radial movement; positive is toward boundary' };
  if (!probe) assert.ok(receipt.passed, 'at least two-thirds real Easy wins per selected opponent; no run errors');
  else assert.ok(receipt.fights.every(f => !f.error && !f.errors.length && f.inputsReleased), 'experimental run must retain every outcome and release inputs');
} finally {
  await fs.writeFile(`${dir}/summary.json`, JSON.stringify(receipt, null, 2));
  await browser.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
}
