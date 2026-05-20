import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * UNIVERSAL RESPONSIVE AUDIT TOOL
 * 
 * This script audits a web page for:
 * 1. Horizontal Overflow (Broken layouts)
 * 2. Tiny Touch Targets (Accessibility/UX)
 * 3. Tiny Rendered Text (Legibility)
 * 4. Console & Network Errors (Stability)
 * 5. Visual Consistency (Full-page screenshots)
 */

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- CONFIGURATION ---
const CONFIG = {
  port: 8080,
  staticDir: join(__dirname, '../'), // Folder to serve. Change to '../dist' or '../public' if needed.
  screenshotsDir: join(__dirname, 'screenshots'),
  reportPath: join(__dirname, 'audit-report.md'),
  baseUrl: 'http://127.0.0.1:8080', // Can also be a live URL (e.g., 'https://example.com')
  useLocalServer: true               // Set to false if auditing a live URL
};

const VIEWPORTS = [
  { name: 'Mobile_S',      label: 'Small Mobile',     width: 360,  height: 640,  isMobile: true  },
  { name: 'Mobile_L',      label: 'Large Mobile',     width: 430,  height: 932,  isMobile: true  },
  { name: 'Tablet_P',      label: 'Tablet Portrait',  width: 768,  height: 1024, isMobile: true  },
  { name: 'Tablet_L',      label: 'Tablet Landscape', width: 1024, height: 768,  isMobile: false },
  { name: 'Laptop',        label: 'Common Laptop',    width: 1366, height: 768,  isMobile: false },
  { name: 'Desktop_FHD',   label: 'Full HD Desktop',  width: 1920, height: 1080, isMobile: false },
  { name: 'Desktop_2K',    label: '2K Desktop',       width: 2560, height: 1440, isMobile: false },
];

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

// --- HELPER: STATIC SERVER ---
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

// --- CORE AUDIT LOGIC ---
async function auditViewport(browser, vp, url) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    hasTouch: vp.isMobile,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const networkErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('requestfailed', req => { networkErrors.push(`${req.url()} - ${req.failure()?.errorText}`); });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000); // Wait for animations

  // 1. Horizontal overflow
  const overflow = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    if (scrollWidth > docWidth + 2) {
      let worst = null;
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.right > docWidth + 2) {
          if (!worst || r.right > worst.right)
            worst = { tag: el.tagName, id: el.id, cls: el.className.toString().slice(0,50), right: Math.round(r.right) };
        }
      });
      return { detected: true, offender: worst };
    }
    return { detected: false };
  });

  // 2. Tiny Touch Targets (< 28px)
  const smallTargets = vp.isMobile ? await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('button, a, input, select').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.width < 28 || r.height < 28)) {
        items.push({ tag: el.tagName, w: Math.round(r.width), h: Math.round(r.height), text: el.innerText.slice(0,20) });
      }
    });
    return items.slice(0, 5);
  }) : [];

  // 3. Tiny Text (< 10px)
  const tinyText = vp.isMobile ? await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('p, span, div, li').forEach(el => {
      if (el.children.length > 0) return;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs > 0 && fs < 10) {
        items.push({ fs: fs.toFixed(1), text: el.innerText.slice(0,30) });
      }
    });
    return [...new Set(items.map(JSON.stringify))].map(JSON.parse).slice(0, 5);
  }) : [];

  const screenshotPath = join(CONFIG.screenshotsDir, `${vp.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await context.close();
  return { vp, overflow, smallTargets, tinyText, consoleErrors, networkErrors };
}

// --- MAIN EXECUTION ---
async function main() {
  console.log('🚀 Starting Universal Responsive Audit...');
  
  if (!existsSync(CONFIG.screenshotsDir)) mkdirSync(CONFIG.screenshotsDir, { recursive: true });

  let server;
  if (CONFIG.useLocalServer) {
    console.log(`📦 Serving static files from: ${CONFIG.staticDir}`);
    server = await startServer(CONFIG.staticDir, CONFIG.port);
  }

  const browser = await chromium.launch();
  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`🔍 Checking ${vp.label} (${vp.width}x${vp.height})...`);
    const result = await auditViewport(browser, vp, CONFIG.baseUrl);
    results.push(result);
  }

  await browser.close();
  if (server) server.close();

  // --- REPORT GENERATION ---
  let report = `# Responsive Audit Report\n\nGenerated on: ${new Date().toLocaleString()}\n\n`;
  
  report += `## Summary\n| Viewport | Overflow | Console Errors | Small Targets | Tiny Text |\n|---|---|---|---|---|\n`;
  results.forEach(r => {
    report += `| ${r.vp.label} | ${r.overflow.detected ? '❌' : '✅'} | ${r.consoleErrors.length > 0 ? '❌' : '✅'} | ${r.smallTargets.length > 0 ? '⚠️' : '✅'} | ${r.tinyText.length > 0 ? '⚠️' : '✅'} |\n`;
  });

  report += `\n## Screenshots\n`;
  results.forEach(r => {
    report += `### ${r.vp.label} (${r.vp.width}x${r.vp.height})\n![${r.vp.label}](./screenshots/${r.vp.name}.png)\n\n`;
  });

  report += `\n## Critical Issues\n`;
  results.filter(r => r.overflow.detected || r.consoleErrors.length > 0).forEach(r => {
    report += `### ${r.vp.label}\n`;
    if (r.overflow.detected) report += `- **Overflow:** Detected at ${r.overflow.offender.right}px on element \`<${r.overflow.offender.tag} class="${r.overflow.offender.cls}">\`\n`;
    r.consoleErrors.forEach(err => report += `- **Console Error:** ${err}\n`);
  });

  writeFileSync(CONFIG.reportPath, report);
  console.log(`\n✨ Audit Complete! Report saved to: ${CONFIG.reportPath}`);
}

main().catch(err => {
  console.error('❌ Audit Failed:', err);
  process.exit(1);
});
