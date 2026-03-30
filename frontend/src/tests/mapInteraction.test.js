/**
 * MRT Map Interaction Tests
 *
 * These tests run against the live dev server (localhost:3001/quickgame).
 * They verify pinch/pan behaviour after any changes to MrtMapController,
 * MrtMap.module.css, or Game.module.css.
 *
 * Run via: node src/tests/mapInteraction.test.js
 * Requires: dev server running on port 3001
 */

let passed = 0;
let failed = 0;

function pass(name) {
  console.log(`  \u2705 PASS: ${name}`);
  passed++;
}
function fail(name, detail) {
  console.error(`  \u274C FAIL: ${name}${detail ? ' \u2014 ' + detail : ''}`);
  failed++;
}
function skip(name, reason) {
  console.log(`  \u23ED  SKIP: ${name} (${reason})`);
}

async function run() {
  let browser;
  try {
    const { chromium } = await import('playwright');

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      hasTouch: true,
      isMobile: true,
    });

    const page = await context.newPage();

    console.log('\n\uD83D\uDDFA\uFE0F  MRT Map Interaction Tests');
    console.log('   Loading http://localhost:3001/quickgame ...\n');

    await page.goto('http://localhost:3001/quickgame', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForSelector('[id$="_Button"]', { timeout: 12000 }).catch(() => {});
    // Wait for click handlers to be bound (addStyleToStationsAndText runs after SVG onLoad)
    await page.waitForFunction(
      () => document.querySelectorAll('[data-bound-click="true"]').length > 0,
      { timeout: 10000 }
    ).catch(() => {});
    await page.waitForTimeout(500);

    // Trigger a touchstart to populate __rzpp via our container listener
    await page.evaluate(() => {
      const container = document.querySelector('[class*="mapContainer"]');
      if (!container) return;
      const t = new Touch({ identifier: 1, target: container, clientX: 50, clientY: 50 });
      container.dispatchEvent(new TouchEvent('touchstart', {
        touches: [t], changedTouches: [t], bubbles: true, cancelable: true
      }));
      container.dispatchEvent(new TouchEvent('touchend', {
        touches: [], changedTouches: [t], bubbles: true, cancelable: true
      }));
    });

    // Find + expose rzpp internal instance via the map container's React fiber
    await page.evaluate(() => {
      // The container has our non-passive touchstart listener which sets window.__rzpp via transformRef
      // Trigger a 2-touch event so it gets exposed
      const container = document.querySelector('[class*="mapContainer"]');
      if (!container) return;
      const t1 = new Touch({ identifier: 50, target: container, clientX: 100, clientY: 200 });
      const t2 = new Touch({ identifier: 51, target: container, clientX: 250, clientY: 350 });
      container.dispatchEvent(new TouchEvent('touchstart', {
        touches: [t1, t2], changedTouches: [t1, t2], bubbles: true, cancelable: true
      }));
      container.dispatchEvent(new TouchEvent('touchend', {
        touches: [], changedTouches: [t1, t2], bubbles: true, cancelable: true
      }));
      // Also try fiber walk from container
      const fiberKey = Object.keys(container).find(k => k.startsWith('__reactFiber'));
      if (!fiberKey) return;
      const visited = new Set();
      const queue = [container[fiberKey]];
      let count = 0;
      while (queue.length && count < 300) {
        const f = queue.shift();
        if (!f || visited.has(f)) continue;
        visited.add(f);
        count++;
        if (
          f.stateNode &&
          typeof f.stateNode === 'object' &&
          f.stateNode !== null &&
          'lastTouch' in f.stateNode &&
          'isPanning' in f.stateNode &&
          'pinchStartDistance' in f.stateNode
        ) {
          window.__rzpp_test = f.stateNode;
          return;
        }
        if (f.return && !visited.has(f.return)) queue.push(f.return);
        if (f.child && !visited.has(f.child)) queue.push(f.child);
        if (f.sibling && !visited.has(f.sibling)) queue.push(f.sibling);
      }
    });

    console.log('   Running checks:\n');

    // ── Test 1: touch-action chain ───────────────────────────────────────────
    {
      const r = await page.evaluate(() => {
        const mainSvg = document.querySelector('.react-transform-component svg');
        const station = mainSvg ? mainSvg.querySelector('[id$="_Button"]') : null;
        if (!station) return { skip: true, reason: 'SVG not loaded' };
        const bad = [];
        let el = station;
        // Walk up to GameContainer only (root/body/html are outside the map, expected to be auto)
        while (el) {
          const ta = getComputedStyle(el).touchAction;
          if (ta !== 'none') bad.push({ tag: el.tagName, id: (el.id || '').slice(0, 30), ta });
          if (el.className && typeof el.className === 'string' && el.className.includes('GameContainer')) break;
          if (el.tagName === 'BODY') break;
          el = el.parentElement;
        }
        return { bad };
      });
      if (r.skip) skip('touch-action chain', r.reason);
      else if (r.bad.length === 0) pass('touch-action chain clean (all none from station to GameContainer)');
      else fail('touch-action chain', `${r.bad.length} nodes with wrong touch-action: ${JSON.stringify(r.bad)}`);
    }

    // ── Test 2: lastTouch cleared in capture phase ───────────────────────────
    {
      const r = await page.evaluate(() => {
        const rzpp = window.__rzpp_test;
        if (!rzpp) return { skip: true, reason: '__rzpp_test not found — fiber walk failed or SVG not loaded' };
        rzpp.lastTouch = Date.now();
        const container = document.querySelector('[class*="mapContainer"]');
        if (!container) return { skip: true, reason: 'map container not found' };
        const t1 = new Touch({ identifier: 98, target: container, clientX: 100, clientY: 200 });
        const t2 = new Touch({ identifier: 99, target: container, clientX: 280, clientY: 400 });
        container.dispatchEvent(new TouchEvent('touchstart', {
          touches: [t1, t2], changedTouches: [t2], bubbles: true, cancelable: true
        }));
        return { cleared: rzpp.lastTouch === null };
      });
      if (r.skip) skip('lastTouch cleared in capture phase', r.reason);
      else if (r.cleared) pass('lastTouch cleared before library handler (fast-pinch double-tap guard bypassed)');
      else fail('lastTouch cleared', 'lastTouch NOT cleared — fast pinch will still fail on iOS');
    }

    // ── Test 3: no touch listeners on station elements ───────────────────────
    {
      const r = await page.evaluate(() => {
        const mainSvg = document.querySelector('.react-transform-component svg');
        const stations = mainSvg ? Array.from(mainSvg.querySelectorAll('[id$="_Button"]')) : [];
        if (!stations.length) return { skip: true, reason: 'SVG not loaded' };
        const withTouch = stations.filter(el => el.getAttribute('data-bound-touch') === 'true');
        return { count: withTouch.length, ids: withTouch.slice(0, 3).map(el => el.id) };
      });
      if (r.skip) skip('no touch listeners on stations', r.reason);
      else if (r.count === 0) pass('no touch listeners on station elements');
      else fail('no touch listeners on stations', `${r.count} stations have bound touch listeners: ${r.ids.join(', ')}`);
    }

    // ── Test 4: stations have click listeners ────────────────────────────────
    {
      const r = await page.evaluate(() => {
        // Only check the main map SVG (first one), not the MiniMap duplicate
        const mainSvg = document.querySelector('.react-transform-component svg');
        if (!mainSvg) return { skip: true, reason: 'main SVG not found' };
        const stations = Array.from(mainSvg.querySelectorAll('[id$="_Button"]'));
        if (!stations.length) return { skip: true, reason: 'SVG not loaded' };
        const missing = stations.filter(el => el.getAttribute('data-bound-click') !== 'true');
        return { missing: missing.length, total: stations.length };
      });
      if (r.skip) skip('stations have click listener', r.reason);
      else if (r.missing === 0) pass(`all ${r.total} stations have click listener`);
      else fail('stations have click listener', `${r.missing}/${r.total} stations missing click listener`);
    }

    // ── Test 5: react-transform-component touch-action ───────────────────────
    {
      const r = await page.evaluate(() => {
        const content = document.querySelector('.react-transform-component');
        if (!content) return { skip: true, reason: 'component not mounted' };
        return { ta: getComputedStyle(content).touchAction };
      });
      if (r.skip) skip('react-transform-component touch-action', r.reason);
      else if (r.ta === 'none') pass('react-transform-component has touch-action: none');
      else fail('react-transform-component touch-action', `got "${r.ta}" — should be "none"`);
    }

    // ── Test 6: GameContainer touch-action ───────────────────────────────────
    {
      const r = await page.evaluate(() => {
        const gc = document.querySelector('[class*="GameContainer"]');
        if (!gc) return { skip: true, reason: 'GameContainer not found' };
        return { ta: getComputedStyle(gc).touchAction };
      });
      if (r.skip) skip('GameContainer touch-action', r.reason);
      else if (r.ta === 'none') pass('GameContainer has touch-action: none');
      else fail('GameContainer touch-action', `got "${r.ta}" — should be "none" (not "manipulation" or "auto")`);
    }

    await browser.close();

    console.log(`\n   ${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exitCode = 1;

  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error('\n\uD83D\uDCA5 Test runner error:', err.message);
    process.exitCode = 1;
  }
}

run();
