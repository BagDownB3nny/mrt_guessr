/**
 * Game Simulation Test — Singapore Tour
 *
 * Plays through the entire Singapore Tour game (all ~145 deduplicated stations)
 * with a deterministic strategy, verifying:
 *   1. Final score is mathematically correct
 *   2. Guess stat counters (1 try / 2 tries / 3 tries / failed) are correct
 *   3. Restart resets all state cleanly
 *
 * Strategy cycles every 4 stations:
 *   index % 4 === 0  → correct on 1st try  (score: 3 pts)
 *   index % 4 === 1  → wrong once, then correct  (score: 2 pts)
 *   index % 4 === 2  → wrong twice, then correct  (score: 1 pt)
 *   index % 4 === 3  → wrong 3×, then correct  (score: 0 pts)
 *
 * Run: node src/tests/gameSimulation.test.js
 * Requires: dev server on port 3001
 */

const STRATEGY = { FIRST: 0, SECOND: 1, THIRD: 2, FAIL: 3 };

let passed = 0;
let failed_count = 0;

function pass(name) { console.log(`  ✅ PASS: ${name}`); passed++; }
function fail(name, detail) { console.error(`  ❌ FAIL: ${name} — ${detail}`); failed_count++; }

/** Read the current station name from the HUD */
async function getCurrentStation(page) {
  return page.evaluate(() => {
    const el = document.querySelector('[class*="stationName"]');
    return el ? el.textContent.trim() : null;
  });
}

/** Click a station that is NOT the current station (to register a wrong guess) */
async function clickWrongStation(page, currentStation) {
  await page.evaluate((current) => {
    const mainSvg = document.querySelector('.react-transform-component svg');
    if (!mainSvg) throw new Error('Main SVG not found');
    const all = Array.from(mainSvg.querySelectorAll('[id$="_Button"]'));
    const wrong = all.find((el) => {
      const name = el.id.slice(0, -7).replace(/_/g, ' ');
      return name !== current;
    });
    if (!wrong) throw new Error('No wrong station found');
    wrong.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }, currentStation);
  await page.waitForTimeout(120);
}

/** Click the correct station */
async function clickCorrectStation(page, currentStation) {
  await page.evaluate((current) => {
    const mainSvg = document.querySelector('.react-transform-component svg');
    if (!mainSvg) throw new Error('Main SVG not found');
    const targetId = current.replaceAll(' ', '_') + '_Button';
    // Use attribute selector to avoid CSS.escape issues with underscores/special chars
    const el = mainSvg.querySelector(`[id="${targetId}"]`);
    if (!el) throw new Error(`Station button not found: ${targetId}`);
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }, currentStation);
  await page.waitForTimeout(150);
}

/** Wait until the station name in the HUD changes (i.e. next station loaded) */
async function waitForNextStation(page, prevStation, timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const current = await getCurrentStation(page);
    if (current && current !== prevStation) return current;
    await page.waitForTimeout(100);
  }
  return null;
}

/** Wait for the modal to appear */
async function waitForModal(page, timeout = 5000) {
  try {
    await page.waitForSelector('.ReactModal__Content', { timeout });
    return true;
  } catch {
    return false;
  }
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

    console.log('\n🎮  Game Simulation Test — Singapore Tour');
    console.log('   Loading http://localhost:3001/singaporetour ...\n');

    await page.goto('http://localhost:3001/singaporetour', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForSelector('[class*="stationName"]', { timeout: 12000 });
    await page.waitForSelector('[data-bound-click="true"]', { timeout: 12000 });
    await page.waitForTimeout(1000);

    // ── Discover total stations from the SVG (source of truth) ───────────────
    // We use the SVG button count rather than the data file to catch any
    // mismatch between stations.ts and what is actually clickable in the map.
    const totalStations = await page.evaluate(() => {
      const mainSvg = document.querySelector('.react-transform-component svg');
      return mainSvg ? mainSvg.querySelectorAll('[id$="_Button"]').length : 0;
    });

    if (totalStations === 0) {
      console.error('  💥 Could not find any station buttons — aborting');
      await browser.close();
      process.exitCode = 1;
      return;
    }

    console.log(`   Found ${totalStations} stations in SVG`);

    // ── Pre-compute expected results ──────────────────────────────────────────
    let expectedInOneTry = 0, expectedInTwoTries = 0;
    let expectedInThreeTries = 0, expectedAfterThreeTries = 0;
    let expectedRawScore = 0;

    for (let i = 0; i < totalStations; i++) {
      const strategy = i % 4;
      if (strategy === STRATEGY.FIRST)  { expectedInOneTry++;       expectedRawScore += 3; }
      if (strategy === STRATEGY.SECOND) { expectedInTwoTries++;      expectedRawScore += 2; }
      if (strategy === STRATEGY.THIRD)  { expectedInThreeTries++;    expectedRawScore += 1; }
      if (strategy === STRATEGY.FAIL)   { expectedAfterThreeTries++; expectedRawScore += 0; }
    }

    const expectedNormalized = expectedRawScore / (totalStations * 3);
    const expectedScoreDisplay = String(Math.floor(expectedNormalized * 10) / 10);

    console.log(`   Expected: score=${expectedScoreDisplay} | 1-try=${expectedInOneTry} | 2-try=${expectedInTwoTries} | 3-try=${expectedInThreeTries} | failed=${expectedAfterThreeTries}\n`);
    console.log('   Playing through all stations...\n');

    // ── Play through the game ─────────────────────────────────────────────────
    let stationsPlayed = 0;
    let currentStation = await getCurrentStation(page);

    while (currentStation && stationsPlayed < totalStations) {
      const strategy = stationsPlayed % 4;

      if (strategy === STRATEGY.FIRST) {
        // Click correct immediately
        await clickCorrectStation(page, currentStation);

      } else if (strategy === STRATEGY.SECOND) {
        // Wrong once, then correct
        await clickWrongStation(page, currentStation);
        await clickCorrectStation(page, currentStation);

      } else if (strategy === STRATEGY.THIRD) {
        // Wrong twice, then correct
        await clickWrongStation(page, currentStation);
        await clickWrongStation(page, currentStation);
        await clickCorrectStation(page, currentStation);

      } else {
        // Wrong 3×, wait for reveal animation, then click correct
        await clickWrongStation(page, currentStation);
        await clickWrongStation(page, currentStation);
        await clickWrongStation(page, currentStation);
        // Wait for the pan + circle reveal (550ms + animation buffer)
        await page.waitForTimeout(1200);
        await clickCorrectStation(page, currentStation);
      }

      stationsPlayed++;

      if (stationsPlayed % 20 === 0) {
        console.log(`   ... ${stationsPlayed}/${totalStations} stations played`);
      }

      // Wait for next station (or modal at end)
      if (stationsPlayed < totalStations) {
        const next = await waitForNextStation(page, currentStation);
        if (!next) {
          console.warn(`   ⚠️  Station didn't advance after ${stationsPlayed} — may be stuck`);
          break;
        }
        currentStation = next;
      }
    }

    console.log(`\n   Played ${stationsPlayed} stations. Waiting for results modal...\n`);

    // ── Check modal appears ───────────────────────────────────────────────────
    const modalAppeared = await waitForModal(page, 6000);
    if (modalAppeared) pass('results modal appeared after final station');
    else fail('results modal appeared', 'modal never opened after all stations were played');

    if (!modalAppeared) {
      await browser.close();
      process.exitCode = 1;
      return;
    }

    // ── Read modal stats ──────────────────────────────────────────────────────
    const modalStats = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('[class*="row"] [class*="number"]'));
      const numbers = rows.map(el => parseInt(el.textContent.trim(), 10)).filter(n => !isNaN(n));
      const scoreEl = document.querySelector('[class*="scoresRow"] [class*="number"]');
      const score = scoreEl ? scoreEl.textContent.trim() : null;
      return { numbers, score };
    });

    console.log(`   Modal stats: numbers=${JSON.stringify(modalStats.numbers)} score=${modalStats.score}`);

    const [actualOneTry, actualTwoTries, actualThreeTries, actualAfterThree] = modalStats.numbers;

    if (actualOneTry === expectedInOneTry)
      pass(`1-try count correct (${actualOneTry})`);
    else
      fail('1-try count', `got ${actualOneTry}, expected ${expectedInOneTry}`);

    if (actualTwoTries === expectedInTwoTries)
      pass(`2-try count correct (${actualTwoTries})`);
    else
      fail('2-try count', `got ${actualTwoTries}, expected ${expectedInTwoTries}`);

    if (actualThreeTries === expectedInThreeTries)
      pass(`3-try count correct (${actualThreeTries})`);
    else
      fail('3-try count', `got ${actualThreeTries}, expected ${expectedInThreeTries}`);

    if (actualAfterThree === expectedAfterThreeTries)
      pass(`failed count correct (${actualAfterThree})`);
    else
      fail('failed count', `got ${actualAfterThree}, expected ${expectedAfterThreeTries}`);

    if (modalStats.score === expectedScoreDisplay)
      pass(`score display correct (${modalStats.score})`);
    else
      fail('score display', `got "${modalStats.score}", expected "${expectedScoreDisplay}"`);

    // ── Test restart ──────────────────────────────────────────────────────────

    // Close modal
    const closeBtn = await page.$('[class*="closeButton"] button, .btn-close');
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(500);

    // Click restart button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('[class*="iconBtn"]'));
      // The restart button is the second one (home is first)
      if (btns[1]) btns[1].click();
    });
    await page.waitForTimeout(1000);

    // Verify state reset
    const afterRestart = await page.evaluate(() => {
      const stationName = document.querySelector('[class*="stationName"]');
      const scoreEl = document.querySelector('[class*="statValue"]');
      const foundEl = document.querySelectorAll('[class*="statValue"]')[1];
      const tries = document.querySelectorAll('[class*="try"]');
      // Count grey X images (tries remaining — grey = available, red = used)
      const redX = Array.from(tries).filter(img => img.src && img.src.includes('greyX'));

      // Check revealed station labels are hidden
      const mainSvg = document.querySelector('.react-transform-component svg');
      const visibleLabels = mainSvg
        ? Array.from(mainSvg.querySelectorAll('[id$="_Text"]')).filter(
            el => el.style.display !== 'none' && el.style.display !== ''
          ).length
        : -1;

      return {
        hasStationName: !!stationName && stationName.textContent.trim().length > 0,
        scoreText: scoreEl ? scoreEl.textContent.trim() : null,
        foundText: foundEl ? foundEl.textContent.trim() : null,
        redXCount: redX.length,
        visibleLabelCount: visibleLabels,
        modalOpen: !!document.querySelector('.ReactModal__Content'),
      };
    });

    if (afterRestart.hasStationName)
      pass('restart: new station prompt is shown');
    else
      fail('restart: station shown', 'no station name visible after restart');

    if (afterRestart.scoreText === '0.0')
      pass(`restart: score reset to 0.0`);
    else
      fail('restart: score reset', `score shows "${afterRestart.scoreText}" after restart`);

    if (afterRestart.foundText && afterRestart.foundText.startsWith('0/'))
      pass(`restart: found counter reset (${afterRestart.foundText})`);
    else
      fail('restart: found counter', `found shows "${afterRestart.foundText}" after restart`);

    if (afterRestart.redXCount === 3)
      pass('restart: tries reset to 3 (all grey)');
    else
      fail('restart: tries reset', `${afterRestart.redXCount}/3 grey X shown — tries not fully reset`);

    if (afterRestart.visibleLabelCount === 0)
      pass('restart: all station labels hidden');
    else
      fail('restart: station labels hidden', `${afterRestart.visibleLabelCount} labels still visible`);

    if (!afterRestart.modalOpen)
      pass('restart: results modal is closed');
    else
      fail('restart: modal closed', 'modal is still open after restart');

    await browser.close();

    console.log(`\n   ${passed} passed, ${failed_count} failed\n`);
    if (failed_count > 0) process.exitCode = 1;

  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error('\n💥 Test runner error:', err.message, err.stack);
    process.exitCode = 1;
  }
}

run();
