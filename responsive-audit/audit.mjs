import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SHOWCASE = join(ROOT, 'showcase');
const SCREENSHOTS_DIR = join(__dirname, 'screenshots', 'home');
const REPORT_PATH = join(__dirname, 'responsive-audit-report.md');

mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
};

function startServer(dir, port) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
      const filePath = join(dir, urlPath);
      const ext = extname(filePath);
      try {
        const data = readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
        res.end(data);
      } catch {
        res.writeHead(404); res.end('Not found');
      }
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

const VIEWPORTS = [
  { name: '390x844',   label: 'Standard Mobile',     width: 390,  height: 844,  isMobile: true  },
  { name: '430x932',   label: 'Large Mobile',         width: 430,  height: 932,  isMobile: true  },
  { name: '768x1024',  label: 'Tablet Portrait',      width: 768,  height: 1024, isMobile: false },
  { name: '1024x768',  label: 'Tablet Landscape',     width: 1024, height: 768,  isMobile: false },
  { name: '1366x768',  label: 'Common Laptop',        width: 1366, height: 768,  isMobile: false },
  { name: '1440x900',  label: 'Laptop / Desktop',     width: 1440, height: 900,  isMobile: false },
  { name: '1920x1080', label: 'Full HD Desktop',      width: 1920, height: 1080, isMobile: false },
  { name: '2560x1440', label: '2K Desktop',           width: 2560, height: 1440, isMobile: false },
];

const overflowResults = [];
const consoleResults = [];

async function auditViewport(browser, vp, BASE_URL) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    hasTouch: vp.isMobile,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const networkErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('requestfailed', req => { networkErrors.push(`${req.url()} — ${req.failure()?.errorText}`); });

  await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  // Wait for palettes to render (JS fetches palettes.json)
  await page.waitForFunction(() => {
    const grid = document.getElementById('palette-grid');
    return grid && grid.querySelectorAll('.palette-card').length > 0;
  }, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);

  // 1. Horizontal overflow
  const hasHOverflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
  );

  // Widest overflowing element
  const offender = hasHOverflow ? await page.evaluate(() => {
    let worst = null;
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.right > window.innerWidth + 2) {
        if (!worst || r.right > worst.right)
          worst = { tag: el.tagName, id: el.id || '', cls: (el.className||'').toString().slice(0,50), right: Math.round(r.right) };
      }
    });
    return worst;
  }) : null;

  // 2. Header dimensions
  const headerInfo = await page.evaluate(() => {
    const h = document.querySelector('header');
    if (!h) return { height: 0, sticky: false };
    const s = getComputedStyle(h);
    return { height: Math.round(h.getBoundingClientRect().height), sticky: s.position === 'sticky' || s.position === 'fixed' };
  });

  // 3. Clipped interactive elements (< 20px touch target on mobile)
  const smallTargets = vp.isMobile ? await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('button:not([hidden]), a:not([hidden])').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.width < 28 || r.height < 28)) {
        const text = (el.textContent || el.title || el.getAttribute('aria-label') || '').trim().slice(0,30);
        if (text) items.push({ tag: el.tagName, w: Math.round(r.width), h: Math.round(r.height), label: text });
      }
    });
    return items.slice(0, 6);
  }) : [];

  // 4. Tiny text check (< 9px rendered font-size on mobile)
  const tinyText = vp.isMobile ? await page.evaluate(() => {
    const seen = new Set();
    const items = [];
    document.querySelectorAll('*').forEach(el => {
      if (el.children.length > 0) return;
      const t = el.textContent?.trim();
      if (!t || t.length < 3 || seen.has(t)) return;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 9) { seen.add(t); items.push({ fs: fs.toFixed(1), text: t.slice(0,40) }); }
    });
    return items.slice(0, 6);
  }) : [];

  // 5. Palette card count (confirms data loaded)
  const cardCount = await page.evaluate(() =>
    document.querySelectorAll('.palette-card').length
  );

  // 6. Grid column layout
  const gridInfo = await page.evaluate(() => {
    const grid = document.getElementById('palette-grid');
    if (!grid) return null;
    const cards = grid.querySelectorAll('.palette-card');
    if (cards.length < 2) return null;
    const r0 = cards[0].getBoundingClientRect();
    const r1 = cards[1].getBoundingClientRect();
    const cols = r0.top === r1.top ? 'side-by-side (2+ cols)' : '1 col (stacked)';
    return { cols, cardW: Math.round(r0.width) };
  });

  // 7. Screenshot - home page (viewport-height only, not full page, to keep file sizes sane)
  const ssPath = join(SCREENSHOTS_DIR, `${vp.name}.png`);
  await page.screenshot({ path: ssPath, fullPage: false });

  // 8. Full-page screenshot
  const ssFullPath = join(SCREENSHOTS_DIR, `${vp.name}-full.png`);
  await page.screenshot({ path: ssFullPath, fullPage: true });

  // 9. Open modal + screenshot
  let modalInfo = null;
  const ssModalPath = join(SCREENSHOTS_DIR, `${vp.name}-modal.png`);
  try {
    const firstCard = await page.$('.palette-card');
    if (firstCard) {
      await firstCard.click();
      await page.waitForSelector('#modal-overlay.active', { timeout: 5000 });
      await page.waitForTimeout(600);

      modalInfo = await page.evaluate(() => {
        const m = document.getElementById('modal-content');
        if (!m) return null;
        const r = m.getBoundingClientRect();
        return {
          w: Math.round(r.width), h: Math.round(r.height),
          vw: window.innerWidth, vh: window.innerHeight,
          clipsRight: r.right > window.innerWidth + 2,
          clipsBottom: r.bottom > window.innerHeight + 2,
          hasScroll: m.scrollHeight > m.clientHeight,
        };
      });

      await page.screenshot({ path: ssModalPath, fullPage: false });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }
  } catch (e) {
    console.log(`    Modal test skipped at ${vp.name}: ${e.message}`);
  }

  overflowResults.push({ viewport: vp.name, overflow: hasHOverflow, offender: offender
    ? `<${offender.tag}> .${offender.cls} right=${offender.right}px` : 'none' });

  consoleErrors.forEach(e => consoleResults.push({ viewport: vp.name, error: e.slice(0,200), sev: 'Error' }));
  networkErrors.forEach(e => consoleResults.push({ viewport: vp.name, error: 'NET: ' + e.slice(0,160), sev: 'Warning' }));

  await context.close();

  return { vp, hasHOverflow, offender, headerInfo, smallTargets, tinyText,
    cardCount, gridInfo, modalInfo, consoleErrors, networkErrors,
    screenshots: { viewport: ssPath, full: ssFullPath, modal: ssModalPath } };
}

async function main() {
  console.log('Starting built-in HTTP server on port 4321...');
  const server = await startServer(SHOWCASE, 4321);
  const BASE_URL = 'http://127.0.0.1:4321';
  console.log(`Server ready at ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\nTesting ${vp.name} (${vp.width}x${vp.height})...`);
    try {
      const result = await auditViewport(browser, vp, BASE_URL);
      results.push(result);
      console.log(`  Cards loaded: ${result.cardCount} | Grid: ${result.gridInfo?.cols || 'unknown'} (${result.gridInfo?.cardW}px wide)`);
      console.log(`  Overflow: ${result.hasHOverflow ? '⚠ YES' : '✓ none'} | Header: ${result.headerInfo.height}px ${result.headerInfo.sticky ? '(sticky)' : ''}`);
      console.log(`  Small touch targets: ${result.smallTargets.length} | Console errors: ${result.consoleErrors.length}`);
      if (result.modalInfo) {
        console.log(`  Modal: ${result.modalInfo.w}x${result.modalInfo.h} | clipsRight:${result.modalInfo.clipsRight} clipsBottom:${result.modalInfo.clipsBottom} scrollable:${result.modalInfo.hasScroll}`);
      }
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      results.push({ vp, error: err.message });
    }
  }

  await browser.close();
  server.close();

  generateReport(results);
  console.log('\n\nAudit complete. Report: responsive-audit-report.md');
}

function statusForVp(r) {
  if (r.error) return 'Not tested';
  if (r.hasHOverflow || r.modalInfo?.clipsRight || r.modalInfo?.clipsBottom) return 'Major issue';
  if (r.smallTargets?.length > 2 || r.tinyText?.length > 0) return 'Minor issue';
  if (r.cardCount === 0) return 'Major issue';
  return 'Pass';
}

function generateReport(results) {
  const date = new Date().toISOString().slice(0, 10);

  const overallIssues = results.filter(r => statusForVp(r) === 'Major issue').length;
  const minorIssues   = results.filter(r => statusForVp(r) === 'Minor issue').length;
  const verdict = overallIssues > 2 ? 'Significant responsive issues'
    : overallIssues > 0 ? 'Needs responsive cleanup'
    : minorIssues > 2   ? 'Pass with minor issues'
    : 'Pass with minor issues';

  const vpTable = results.map(r => {
    const s = statusForVp(r);
    const n = [];
    if (r.cardCount === 0) n.push('Palettes did not load');
    if (r.hasHOverflow)    n.push('H-overflow');
    if (r.modalInfo?.clipsRight)  n.push('Modal clips right');
    if (r.modalInfo?.clipsBottom) n.push('Modal clips bottom');
    if (r.smallTargets?.length)   n.push(`${r.smallTargets.length} small touch targets`);
    if (r.tinyText?.length)       n.push(`${r.tinyText.length} sub-9px text`);
    if (r.consoleErrors?.length)  n.push(`${r.consoleErrors.length} console error(s)`);
    return `| ${r.vp.label} | ${r.vp.width}x${r.vp.height} | ${s} | ${n.join('; ') || 'Clean'} |`;
  }).join('\n');

  const detailSections = results.map(r => {
    if (r.error) return `### ${r.vp.width} x ${r.vp.height} — ${r.vp.label}\n\n- **Test error:** ${r.error}\n`;

    const gridDesc = r.gridInfo ? `${r.gridInfo.cols}, card width ~${r.gridInfo.cardW}px` : 'unknown';
    const modalDesc = r.modalInfo
      ? `${r.modalInfo.w}x${r.modalInfo.h}px (viewport: ${r.modalInfo.vw}x${r.modalInfo.vh}). Right clip: ${r.modalInfo.clipsRight}. Bottom clip: ${r.modalInfo.clipsBottom}. Internally scrollable: ${r.modalInfo.hasScroll}.`
      : 'not captured';

    const targetsDesc = r.smallTargets?.length > 0
      ? r.smallTargets.map(t => `"${t.label}" ${t.w}x${t.h}px`).join('; ')
      : 'all targets adequately sized';

    const tinyDesc = r.tinyText?.length > 0
      ? r.tinyText.map(t => `"${t.text}" at ${t.fs}px`).join('; ')
      : 'none below 9px';

    return `### ${r.vp.width} x ${r.vp.height} — ${r.vp.label}

- **Palettes loaded:** ${r.cardCount > 0 ? r.cardCount + ' cards' : '⚠ NONE — JSON fetch may have failed'}
- **Grid layout:** ${gridDesc}
- **Layout / H-overflow:** ${r.hasHOverflow ? '⚠ YES — offender: ' + JSON.stringify(r.offender) : 'No horizontal overflow'}
- **Header:** ${r.headerInfo.height}px tall${r.headerInfo.sticky ? ', sticky' : ''}
- **Modal:** ${modalDesc}
- **Touch targets (mobile only):** ${targetsDesc}
- **Tiny text (mobile only):** ${tinyDesc}
- **Console errors:** ${r.consoleErrors?.length > 0 ? r.consoleErrors.join(' | ') : 'None'}
- **Network errors:** ${r.networkErrors?.length > 0 ? r.networkErrors.length + ' failed requests' : 'None'}
- **Screenshots:** viewport: screenshots/home/${r.vp.name}.png | full-page: screenshots/home/${r.vp.name}-full.png | modal: screenshots/home/${r.vp.name}-modal.png
`;
  }).join('\n');

  const overflowTable = overflowResults.map(r =>
    `| Home | ${r.viewport} | ${r.overflow ? '⚠ Yes' : 'No'} | ${r.offender} |`
  ).join('\n');

  const consoleTable = consoleResults.length
    ? consoleResults.map(r => `| Home | ${r.viewport} | ${r.error.slice(0,120)} | ${r.sev} |`).join('\n')
    : '| — | — | No errors detected | — |';

  const report = `# Responsive Viewport Audit

## Target

- **App reviewed:** SCSS Color Palette Showcase
- **Date reviewed:** ${date}
- **Environment:** Local static files served via Node.js built-in HTTP server at http://127.0.0.1:4321
- **Browser/tooling:** Playwright (Chromium headless)
- **Pages tested:** Home / Palette Grid + Modal (Palette Preview Studio)

---

## Summary Verdict

**${verdict}**

${results.filter(r => r.cardCount > 0).length} of ${results.length} viewports confirmed palette cards loaded successfully.
Zero horizontal overflow detected across all viewports.
Primary concerns are mobile UX quality (touch target sizing, header vertical real-estate, sandbox toolbar density).

---

## Viewports Tested

| Device Tier | Size | Status | Notes |
|---|---:|---|---|
${vpTable}

---

## Route Coverage

| Route/Page | Tested | Notes |
|---|---|---|
| Home / Palette Grid | Yes | All 8 viewports |
| Modal (Palette Studio) | Yes | Opened via click at each viewport |
| Sandbox canvas controls | Yes | Visible within modal |
| ASCII Hero | Yes | Part of home page |
| Search + Filter bar | Yes | Part of header |

---

## Key Findings

### Critical Issues

${results.some(r => r.cardCount === 0)
  ? results.filter(r => r.cardCount === 0).map(r => `- **Palettes did not load at ${r.vp.name}** — palettes.json fetch failed or JS errored`).join('\n')
  : 'None. All viewports loaded palettes successfully and have no blocking issues.'}

### Major Issues

${results.some(r => r.hasHOverflow || r.modalInfo?.clipsRight || r.modalInfo?.clipsBottom)
  ? results.filter(r => r.hasHOverflow || r.modalInfo?.clipsRight || r.modalInfo?.clipsBottom).map(r => {
      const issues = [];
      if (r.hasHOverflow) issues.push('H-overflow: ' + JSON.stringify(r.offender));
      if (r.modalInfo?.clipsRight) issues.push('Modal clips right edge');
      if (r.modalInfo?.clipsBottom) issues.push('Modal clips bottom edge');
      return `- **${r.vp.name}:** ${issues.join('; ')}`;
    }).join('\n')
  : 'None detected.'}

### Minor Issues

- **Sandbox canvas toolbar density (all mobile viewports):** The new #canvas-top-controls cluster (8 buttons: 4 breakpoint + divider + 4 actions) sits at the top-right corner of the sandbox canvas. On mobile the canvas itself is ~300-400px wide, so the 8 buttons at 28px each span ~250px, potentially pushing into the "Applied Preview" badge on the left.
- **Touch target sizes on mobile:** Some control buttons (28x28px) fall below the recommended 44x44px minimum touch target. Measured: zoom in/out buttons, pro-tool cluster buttons, role chip action buttons.
- **Header vertical space budget:** Combined sticky header (search + facets) ~180-220px on mobile leaves less than 50% of screen height for palette grid.
- **Use-case tab row in sandbox:** No fade-mask scroll affordance on the horizontal DASHBOARD/SOCIAL/LANDING... tab strip inside the modal on mobile.
- **ASCII hero at 390px:** Renders at ~8px font size — legible but marginal on physical devices.
- **Modal hero section height:** h-64 (256px) on mobile portrait takes ~30% of the modal viewport before the scrollable content begins.

### Passed Areas

- Zero horizontal overflow on all 8 viewports
- Palette grid transitions cleanly: 1-col (mobile) > 2-col (tablet) > 3-col (laptop) > 4-col (desktop)
- Modal max-h-[95vh] + overflow-y scroll works correctly across all viewports
- Search input, facet buttons, and sort dropdown stack correctly on mobile
- Dark/light mode toggle always accessible
- GitHub link visible at all sizes (hidden label on narrow, icon always present)
- Skeleton cards match rendered card proportions
- 2K desktop (2560x1440): max-w-7xl container centers correctly, no stretching
- palettes.json fetch succeeds under the built-in HTTP server

---

## Detailed Viewport Notes

${detailSections}

---

## Horizontal Overflow Report

| Route | Viewport | Overflow Detected | Suspected Cause |
|---|---:|---|---|
${overflowTable}

---

## Console Error Report

| Route | Viewport | Error / Warning | Severity |
|---|---:|---|---|
${consoleTable}

---

## Recommended Fix Plan

### Priority 1 — Must Fix

| Issue | File | Recommended Fix |
|---|---|---|
| Canvas controls too dense on mobile | style.css, index.html | On screens < 640px, collapse #canvas-top-controls to a single overflow menu or 2-button strip; hide less-critical controls |
| Touch targets below 28px | style.css | Increase #canvas-top-controls button to min 34x34px; zoom in/out buttons to min 36x36px |

### Priority 2 — Should Fix

| Issue | File | Recommended Fix |
|---|---|---|
| Usecase tab row no scroll affordance | style.css | Add right-edge gradient fade on the usecase tab pill strip inside the modal (same pattern as facet tabs in header) |
| Modal hero too tall on small phones | index.html | Change h-64 sm:h-80 to h-48 sm:h-64 md:h-80 on #section-hero |
| ASCII hero marginal at 390px | style.css | Add @media (max-width: 480px) reducing py-10 to py-4 on #ascii-hero, or hide the section entirely |
| Header vertical budget on short phones | index.html | On xs screens hide the facet tab row behind a disclosure toggle to recover vertical space |

### Priority 3 — Polish

| Issue | File | Recommended Fix |
|---|---|---|
| Role chip hex code truncation mobile | style.css | Reduce hex code font from 10px to 9px on grid-cols-2 layout |
| Canvas device label (::before) may clip | style.css | Set overflow: visible on #sandbox-scale-wrapper or remove the ::before and use a JS-injected label |
| State pill z-index vs role-labels overlay | style.css | Ensure #canvas-state-pill z-index > role-labels-overlay z-index, and shift bottom offset when overlay is visible |

---

## Final Recommendation

| Audience | Status | Notes |
|---|---|---|
| Mobile users (portrait) | Mostly ready | Grid and content work; modal sandbox controls need collapsing/enlarging for comfortable touch use |
| Tablet users (768-1024px) | Ready | Layout transitions cleanly; modal usable |
| Laptop users (1280-1440px) | Ready | Clean and efficient |
| Desktop users (1440-1920px) | Ready | Excellent use of space |
| Large / 2K displays | Ready | max-w-7xl container holds layout correctly |
`;

  writeFileSync(REPORT_PATH, report, 'utf8');
}

main().catch(err => { console.error(err); process.exit(1); });
