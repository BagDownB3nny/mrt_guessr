/**
 * Landing → Game Transition Timing Test
 *
 * Measures the perceived handoff from tapping "Singapore Tour" on the landing
 * page to the MRT map becoming visible.
 *
 * Run:
 *   node src/tests/transitionTiming.test.js
 *
 * Requires:
 *   dev server on http://localhost:3001
 */

let passed = 0;
let failed = 0;

function pass(name, detail = "") {
  console.log(`  ✅ PASS: ${name}${detail ? ` — ${detail}` : ""}`);
  passed++;
}

function fail(name, detail) {
  console.error(`  ❌ FAIL: ${name} — ${detail}`);
  failed++;
}

async function getOpacity(page, selector) {
  return page.$eval(selector, (el) => Number.parseFloat(getComputedStyle(el).opacity || "0"));
}

async function run() {
  let browser;
  try {
    const { chromium } = await import('playwright');

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();

    console.log('\n⏱️  Transition Timing Test — Landing → Singapore Tour\n');

    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForSelector('text=Singapore Tour', { timeout: 10000 });

    const t0 = Date.now();
    await page.getByText('Singapore Tour').click();

    await page.waitForURL('**/singaporetour', { timeout: 4000 });
    const routeChangedMs = Date.now() - t0;

    await page.waitForSelector('[class*="seaVeil"]', { timeout: 4000 });

    // Fade starts once the game veil is told to hide (opacity drops below 1)
    await page.waitForFunction(() => {
      const el = document.querySelector('[class*="seaVeil"]');
      return !!el && Number.parseFloat(getComputedStyle(el).opacity || '0') < 0.99;
    }, { timeout: 4000 });
    const fadeStartedMs = Date.now() - t0;

    // "Map visible" threshold: veil mostly gone
    await page.waitForFunction(() => {
      const el = document.querySelector('[class*="seaVeil"]');
      return !!el && Number.parseFloat(getComputedStyle(el).opacity || '1') < 0.1;
    }, { timeout: 5000 });
    const mapVisibleMs = Date.now() - t0;

    const finalOpacity = await getOpacity(page, '[class*="seaVeil"]');

    console.log(`   click → route change : ${routeChangedMs}ms`);
    console.log(`   click → fade start   : ${fadeStartedMs}ms`);
    console.log(`   click → map visible  : ${mapVisibleMs}ms`);
    console.log(`   final veil opacity   : ${finalOpacity}\n`);

    if (routeChangedMs <= 1400) pass('route change is fast', `${routeChangedMs}ms`);
    else fail('route change is fast', `expected <= 1400ms, got ${routeChangedMs}ms`);

    if (fadeStartedMs <= 1700) pass('game fade starts quickly', `${fadeStartedMs}ms`);
    else fail('game fade starts quickly', `expected <= 1700ms, got ${fadeStartedMs}ms`);

    if (mapVisibleMs <= 2600) pass('map becomes visible quickly enough', `${mapVisibleMs}ms`);
    else fail('map becomes visible quickly enough', `expected <= 2600ms, got ${mapVisibleMs}ms`);

    if (finalOpacity < 0.1) pass('entry veil nearly fully cleared', `opacity=${finalOpacity}`);
    else fail('entry veil nearly fully cleared', `expected opacity < 0.1, got ${finalOpacity}`);

    console.log(`\n   Result: ${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exitCode = 1;
  } catch (err) {
    console.error(`\n💥 Transition timing test error: ${err?.message || err}`);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
}

run();
