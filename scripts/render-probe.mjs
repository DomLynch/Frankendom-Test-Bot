// Local test tooling only: locate stalled browser stages with real drawing enabled.
import { chromium } from 'playwright';
import { preview } from 'vite';
import { harnessClock } from './lib/harness-clock.mjs';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { optionValue } from './lib/cli-option.mjs';
const out = optionValue(process.argv, 'out', 'artifacts/combat/render-probe');
await mkdir(out, { recursive: true });
const server = await preview({ root: fileURLToPath(new URL('../game/', import.meta.url)), preview: { host: '127.0.0.1', port: 0 } });
const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
const browser = await chromium.launch({ headless: true });
const records = [];
try {
  for (const variant of ['baseline', 'phone-tier']) {
    const record = { variant, stages: [], errors: [], pageErrors: [], drawsSuppressed: false };
    records.push(record);
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    page.on('pageerror', e => record.pageErrors.push(String(e)));
    const stage = async (name, run, limit = 30000) => {
      const start = performance.now();
      await appendFile(`${out}/progress.jsonl`, JSON.stringify({ variant, stage: name, edge: 'begin', wallMs: start }) + '\n');
      let timer;
      try {
        const value = await Promise.race([run(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${name}: exceeded ${limit}ms wall time`)), limit); })]);
        const row = { name, elapsedMs: +(performance.now() - start).toFixed(1) };
        record.stages.push(row);
        await appendFile(`${out}/progress.jsonl`, JSON.stringify({ variant, ...row, edge: 'end' }) + '\n');
        return value;
      } finally { clearTimeout(timer); }
    };
    try {
      await page.addInitScript(() => sessionStorage.setItem('frankendom.dev-kit', JSON.stringify({ level: 6 })));
      await stage('navigation', () => page.goto(`${origin}/?opponent=pitborn&debug=1&botSeed=731${variant === 'phone-tier' ? '&gfx=phone&dpr=1' : ''}`, { waitUntil: 'domcontentloaded' }), 60000);
      await stage('attack-ready', () => page.waitForFunction(() => document.querySelector('#attack-button')?.getAttribute('aria-disabled') === 'false', null, { polling: 100, timeout: 60000 }), 65000);
      record.beforeClock = await stage('graphics-and-status', () => page.evaluate(() => {
        const canvas = document.querySelector('#world');
        const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
        const info = gl?.getExtension('WEBGL_debug_renderer_info');
        return { tick: document.querySelector('#debug')?.dataset.tick, art: document.querySelector('#art-status')?.textContent,
          welcomeHidden: document.querySelector('#welcome')?.hidden, canvas: [canvas.width, canvas.height], dpr: devicePixelRatio,
          renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : null, vendor: info ? gl.getParameter(info.UNMASKED_VENDOR_WEBGL) : null,
          url: location.href };
      }));
      await stage('before-clock-screenshot', () => page.screenshot({ path: `${out}/${variant}-before.png` }));
      const clock = await stage('clock-install-and-pause', () => harnessClock(page), 45000);
      const enter = page.getByRole('button', { name: 'Enter the arena' });
      if (await enter.isVisible().catch(() => false)) await stage('enter', () => enter.tap());
      await stage('welcome-and-art', () => clock.until(() => document.querySelector('#welcome').hidden && document.querySelector('#art-status').textContent === '', 20000), 45000);
      record.frames = [];
      for (let i = 0; i < 6; i++) record.frames.push(await stage(`frame-${i}`, async () => {
        await clock.run(16);
        return page.evaluate(() => ({ tick: document.querySelector('#debug').dataset.tick, hp: document.querySelector('#player-health').value }));
      }, 15000));
      await stage('after-clock-screenshot', () => page.screenshot({ path: `${out}/${variant}-after.png` }));
    } catch (e) { record.errors.push(String(e)); }
    finally {
      await writeFile(`${out}/${variant}.json`, JSON.stringify(record, null, 2));
      console.log(JSON.stringify(record));
      await context.close();
    }
  }
} finally {
  await writeFile(`${out}/summary.json`, JSON.stringify(records, null, 2));
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
if (records.some(r => r.errors.length)) process.exitCode = 1;
