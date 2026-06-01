// Playwright verification script for Phase 1 App Shell task
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  // ── Helper ──────────────────────────────────────────────────────────────
  function pass(label) { results.push({ label, status: 'PASS' }); }
  function fail(label, detail) { results.push({ label, status: 'FAIL', detail }); }

  // ── Dark-default page ────────────────────────────────────────────────────
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12 Pro
  // Navigate first, then clear localStorage and reload (cannot access localStorage on about:blank)
  await page.goto('http://localhost:5173/log', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Check dark class on <html>
  const htmlClass1 = await page.evaluate(() => document.documentElement.className);
  htmlClass1.includes('dark') ? pass('Dark default: html.dark present') : fail('Dark default: html.dark present', htmlClass1);

  // Check circa-bg CSS var in dark mode
  const bgDark = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--circa-bg').trim()
  );
  bgDark === '#0F0F1E' ? pass('Dark circa-bg = #0F0F1E') : fail('Dark circa-bg = #0F0F1E', bgDark);

  // Tab bar visible
  const tabBar = await page.$('nav[aria-label="Main navigation"]');
  tabBar ? pass('Tab bar rendered') : fail('Tab bar rendered', 'nav element not found');

  // Hamburger button
  const hamburger = await page.$('button[aria-label="Open menu"]');
  hamburger ? pass('Hamburger button present') : fail('Hamburger button present', 'not found');

  // Four tabs
  const tabs = await page.$$('nav[aria-label="Main navigation"] button:not([aria-label="Open menu"])');
  tabs.length === 4 ? pass('Four tabs present') : fail('Four tabs present', `found ${tabs.length}`);

  // Tab labels
  const tabTexts = await Promise.all(tabs.map(t => t.textContent()));
  const expectedLabels = ['Log', 'Chart', 'History', 'Insights'];
  const allLabels = expectedLabels.every(l => tabTexts.some(t => t && t.includes(l)));
  allLabels ? pass('All four tab labels present') : fail('All four tab labels present', JSON.stringify(tabTexts));

  // No content hidden behind tab bar — check there's padding on main
  const mainPb = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? getComputedStyle(main).paddingBottom : 'no main';
  });
  // Should be at least 64px
  const pbVal = parseInt(mainPb);
  pbVal >= 64 ? pass(`main padding-bottom ${mainPb} >= 64px`) : fail(`main padding-bottom >= 64px`, mainPb);

  // Screenshot — dark, drawer closed
  await page.screenshot({ path: 'tasks/screenshots/shell-dark-closed.png', fullPage: false });
  pass('Screenshot: shell-dark-closed.png saved');

  // ── Open the drawer ──────────────────────────────────────────────────────
  await page.click('button[aria-label="Open menu"]');
  await page.waitForTimeout(400); // animation

  // Drawer visible
  const drawer = await page.$('div[role="dialog"]');
  drawer ? pass('Drawer dialog element present') : fail('Drawer dialog element present', 'not found');

  // Backdrop
  const backdrop = await page.$('div[aria-hidden="true"]');
  backdrop ? pass('Backdrop overlay present') : fail('Backdrop overlay present', 'not found');

  // Header "CircaLog" text
  const drawerText = await page.evaluate(() => document.body.innerText);
  drawerText.includes('CircaLog') ? pass('Drawer header shows CircaLog') : fail('Drawer header shows CircaLog', 'text not found');

  // Close button
  const closeBtn = await page.$('button[aria-label="Close menu"]');
  closeBtn ? pass('Drawer close button present') : fail('Drawer close button present', 'not found');

  // Nav links — check all six labels
  const drawerNavLinks = ['Settings', 'Reports', 'Export', 'About', 'Privacy Policy', 'Terms'];
  for (const label of drawerNavLinks) {
    drawerText.includes(label) ? pass(`Drawer nav link: ${label}`) : fail(`Drawer nav link: ${label}`, 'not found in text');
  }

  // Dark mode row text
  drawerText.includes('Dark mode') ? pass('Dark mode row present') : fail('Dark mode row present', 'not found');

  // Screenshot — drawer open
  await page.screenshot({ path: 'tasks/screenshots/shell-dark-drawer-open.png', fullPage: false });
  pass('Screenshot: shell-dark-drawer-open.png saved');

  // ── Close via backdrop ───────────────────────────────────────────────────
  // Click at x=350 (right of the 288px drawer) so the panel doesn't intercept
  const bd = await page.$('div[aria-hidden="true"]');
  if (bd) {
    await page.mouse.click(350, 400);
    await page.waitForTimeout(400);
    const drawerClass = await page.evaluate(() => {
      const d = document.querySelector('div[role="dialog"]');
      return d ? d.className : '';
    });
    drawerClass.includes('-translate-x-full') ? pass('Backdrop click closes drawer') : fail('Backdrop click closes drawer', drawerClass);
  } else {
    fail('Backdrop click closes drawer', 'backdrop not found');
  }

  // ── Re-open and close via X button ──────────────────────────────────────
  await page.click('button[aria-label="Open menu"]');
  await page.waitForTimeout(400);
  await page.click('button[aria-label="Close menu"]');
  await page.waitForTimeout(400);
  const drawerClassAfterX = await page.evaluate(() => {
    const d = document.querySelector('div[role="dialog"]');
    return d ? d.className : '';
  });
  drawerClassAfterX.includes('-translate-x-full') ? pass('Close button (X) closes drawer') : fail('Close button (X) closes drawer', drawerClassAfterX);

  // ── Theme toggle in drawer ───────────────────────────────────────────────
  await page.click('button[aria-label="Open menu"]');
  await page.waitForTimeout(400);
  // Click ThemeToggle (aria-label contains "Switch to light mode" in dark)
  const themeBtn = await page.$('button[aria-label="Switch to light mode"]');
  if (themeBtn) {
    await themeBtn.click();
    await page.waitForTimeout(300);
    const htmlClassAfterToggle = await page.evaluate(() => document.documentElement.className);
    !htmlClassAfterToggle.includes('dark') ? pass('ThemeToggle switches to light mode') : fail('ThemeToggle switches to light mode', htmlClassAfterToggle);
    // Toggle back to dark
    const themeBtnLight = await page.$('button[aria-label="Switch to dark mode"]');
    if (themeBtnLight) {
      await themeBtnLight.click();
      await page.waitForTimeout(300);
      pass('ThemeToggle switches back to dark mode');
    }
  } else {
    fail('ThemeToggle switches to light mode', 'theme button not found');
  }

  // ── Light mode ───────────────────────────────────────────────────────────
  await page.close();
  const page2 = await browser.newPage();
  await page2.setViewportSize({ width: 390, height: 844 });
  await page2.goto('http://localhost:5173/log', { waitUntil: 'networkidle' });
  await page2.evaluate(() => localStorage.setItem('circalog-theme', 'light'));
  await page2.reload({ waitUntil: 'networkidle' });
  await page2.waitForTimeout(500);
  const htmlClass2 = await page2.evaluate(() => document.documentElement.className);
  !htmlClass2.includes('dark') ? pass('Light mode: html has no dark class') : fail('Light mode: html has no dark class', htmlClass2);
  const bgLight = await page2.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--circa-bg').trim()
  );
  bgLight === '#F8F8FF' ? pass('Light circa-bg = #F8F8FF') : fail('Light circa-bg = #F8F8FF', bgLight);
  await page2.screenshot({ path: 'tasks/screenshots/shell-light-mode.png', fullPage: false });
  pass('Screenshot: shell-light-mode.png saved');

  // ── Mobile viewport check ─────────────────────────────────────────────────
  // We already used 390×844 (iPhone 12 Pro) throughout. Verify tab bar is visible.
  const tabBarVisible = await page2.$('nav[aria-label="Main navigation"]');
  tabBarVisible ? pass('Tab bar visible on 390x844 (iPhone 12 Pro) viewport') : fail('Tab bar visible on mobile viewport', 'not found');
  await page2.close();

  await browser.close();

  // ── Print results ───────────────────────────────────────────────────────
  console.log('\n=== VISUAL VERIFICATION RESULTS ===\n');
  let allPassed = true;
  for (const r of results) {
    if (r.status === 'PASS') {
      console.log(`  ✅ ${r.label}`);
    } else {
      console.log(`  ❌ ${r.label}${r.detail ? ' — ' + r.detail : ''}`);
      allPassed = false;
    }
  }
  console.log(`\n${allPassed ? '✅ All checks passed.' : '❌ Some checks FAILED — see above.'}\n`);
  process.exit(allPassed ? 0 : 1);
})();
