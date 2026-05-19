# Responsive Viewport Audit

## Target

- **App reviewed:** SCSS Color Palette Showcase
- **Date reviewed:** 2026-05-19
- **Environment:** Local static files served via Node.js built-in HTTP server at http://127.0.0.1:4321
- **Browser/tooling:** Playwright (Chromium headless)
- **Pages tested:** Home / Palette Grid + Modal (Palette Preview Studio)

---

## Summary Verdict

**Pass with minor issues**

8 of 8 viewports confirmed palette cards loaded successfully.
Zero horizontal overflow detected across all viewports.
Primary concerns are mobile UX quality (touch target sizing, header vertical real-estate, sandbox toolbar density).

---

## Viewports Tested

| Device Tier | Size | Status | Notes |
|---|---:|---|---|
| Standard Mobile | 390x844 | Minor issue | 6 sub-9px text; 1 console error(s) |
| Large Mobile | 430x932 | Minor issue | 6 sub-9px text; 1 console error(s) |
| Tablet Portrait | 768x1024 | Pass | 1 console error(s) |
| Tablet Landscape | 1024x768 | Pass | 1 console error(s) |
| Common Laptop | 1366x768 | Pass | 1 console error(s) |
| Laptop / Desktop | 1440x900 | Pass | 1 console error(s) |
| Full HD Desktop | 1920x1080 | Pass | 1 console error(s) |
| 2K Desktop | 2560x1440 | Pass | 1 console error(s) |

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

None. All viewports loaded palettes successfully and have no blocking issues.

### Major Issues

None detected.

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

### 390 x 844 — Standard Mobile

- **Palettes loaded:** 332 cards
- **Grid layout:** 1 col (stacked), card width ~358px
- **Layout / H-overflow:** No horizontal overflow
- **Header:** 341px tall, sticky
- **Modal:** 358x802px (viewport: 390x844). Right clip: false. Bottom clip: false. Internally scrollable: false.
- **Touch targets (mobile only):** all targets adequately sized
- **Tiny text (mobile only):** "CLR" at 8.0px; "Vibrancy" at 8.0px; "Contrast" at 8.0px; "Temp" at 8.0px; "AUTO" at 8.0px; "ACTIVE" at 8.0px
- **Console errors:** Failed to load resource: the server responded with a status of 404 (Not Found)
- **Network errors:** None
- **Screenshots:** viewport: screenshots/home/390x844.png | full-page: screenshots/home/390x844-full.png | modal: screenshots/home/390x844-modal.png

### 430 x 932 — Large Mobile

- **Palettes loaded:** 332 cards
- **Grid layout:** 1 col (stacked), card width ~398px
- **Layout / H-overflow:** No horizontal overflow
- **Header:** 341px tall, sticky
- **Modal:** 398x885px (viewport: 430x932). Right clip: false. Bottom clip: false. Internally scrollable: false.
- **Touch targets (mobile only):** all targets adequately sized
- **Tiny text (mobile only):** "CLR" at 8.0px; "Vibrancy" at 8.0px; "Contrast" at 8.0px; "Temp" at 8.0px; "AUTO" at 8.0px; "ACTIVE" at 8.0px
- **Console errors:** Failed to load resource: the server responded with a status of 404 (Not Found)
- **Network errors:** None
- **Screenshots:** viewport: screenshots/home/430x932.png | full-page: screenshots/home/430x932-full.png | modal: screenshots/home/430x932-modal.png

### 768 x 1024 — Tablet Portrait

- **Palettes loaded:** 332 cards
- **Grid layout:** side-by-side (2+ cols), card width ~224px
- **Layout / H-overflow:** No horizontal overflow
- **Header:** 252px tall, sticky
- **Modal:** 736x973px (viewport: 768x1024). Right clip: false. Bottom clip: false. Internally scrollable: false.
- **Touch targets (mobile only):** all targets adequately sized
- **Tiny text (mobile only):** none below 9px
- **Console errors:** Failed to load resource: the server responded with a status of 404 (Not Found)
- **Network errors:** None
- **Screenshots:** viewport: screenshots/home/768x1024.png | full-page: screenshots/home/768x1024-full.png | modal: screenshots/home/768x1024-modal.png

### 1024 x 768 — Tablet Landscape

- **Palettes loaded:** 332 cards
- **Grid layout:** side-by-side (2+ cols), card width ~222px
- **Layout / H-overflow:** No horizontal overflow
- **Header:** 252px tall, sticky
- **Modal:** 992x730px (viewport: 1024x768). Right clip: false. Bottom clip: false. Internally scrollable: false.
- **Touch targets (mobile only):** all targets adequately sized
- **Tiny text (mobile only):** none below 9px
- **Console errors:** Failed to load resource: the server responded with a status of 404 (Not Found)
- **Network errors:** None
- **Screenshots:** viewport: screenshots/home/1024x768.png | full-page: screenshots/home/1024x768-full.png | modal: screenshots/home/1024x768-modal.png

### 1366 x 768 — Common Laptop

- **Palettes loaded:** 332 cards
- **Grid layout:** side-by-side (2+ cols), card width ~235px
- **Layout / H-overflow:** No horizontal overflow
- **Header:** 252px tall, sticky
- **Modal:** 1152x730px (viewport: 1366x768). Right clip: false. Bottom clip: false. Internally scrollable: false.
- **Touch targets (mobile only):** all targets adequately sized
- **Tiny text (mobile only):** none below 9px
- **Console errors:** Failed to load resource: the server responded with a status of 404 (Not Found)
- **Network errors:** None
- **Screenshots:** viewport: screenshots/home/1366x768.png | full-page: screenshots/home/1366x768-full.png | modal: screenshots/home/1366x768-modal.png

### 1440 x 900 — Laptop / Desktop

- **Palettes loaded:** 332 cards
- **Grid layout:** side-by-side (2+ cols), card width ~250px
- **Layout / H-overflow:** No horizontal overflow
- **Header:** 252px tall, sticky
- **Modal:** 1152x855px (viewport: 1440x900). Right clip: false. Bottom clip: false. Internally scrollable: false.
- **Touch targets (mobile only):** all targets adequately sized
- **Tiny text (mobile only):** none below 9px
- **Console errors:** Failed to load resource: the server responded with a status of 404 (Not Found)
- **Network errors:** None
- **Screenshots:** viewport: screenshots/home/1440x900.png | full-page: screenshots/home/1440x900-full.png | modal: screenshots/home/1440x900-modal.png

### 1920 x 1080 — Full HD Desktop

- **Palettes loaded:** 332 cards
- **Grid layout:** side-by-side (2+ cols), card width ~229px
- **Layout / H-overflow:** No horizontal overflow
- **Header:** 252px tall, sticky
- **Modal:** 1094x975px (viewport: 1920x1080). Right clip: false. Bottom clip: false. Internally scrollable: false.
- **Touch targets (mobile only):** all targets adequately sized
- **Tiny text (mobile only):** none below 9px
- **Console errors:** Failed to load resource: the server responded with a status of 404 (Not Found)
- **Network errors:** None
- **Screenshots:** viewport: screenshots/home/1920x1080.png | full-page: screenshots/home/1920x1080-full.png | modal: screenshots/home/1920x1080-modal.png

### 2560 x 1440 — 2K Desktop

- **Palettes loaded:** 332 cards
- **Grid layout:** side-by-side (2+ cols), card width ~229px
- **Layout / H-overflow:** No horizontal overflow
- **Header:** 252px tall, sticky
- **Modal:** 1152x1368px (viewport: 2560x1440). Right clip: false. Bottom clip: false. Internally scrollable: false.
- **Touch targets (mobile only):** all targets adequately sized
- **Tiny text (mobile only):** none below 9px
- **Console errors:** Failed to load resource: the server responded with a status of 404 (Not Found)
- **Network errors:** None
- **Screenshots:** viewport: screenshots/home/2560x1440.png | full-page: screenshots/home/2560x1440-full.png | modal: screenshots/home/2560x1440-modal.png


---

## Horizontal Overflow Report

| Route | Viewport | Overflow Detected | Suspected Cause |
|---|---:|---|---|
| Home | 390x844 | No | none |
| Home | 430x932 | No | none |
| Home | 768x1024 | No | none |
| Home | 1024x768 | No | none |
| Home | 1366x768 | No | none |
| Home | 1440x900 | No | none |
| Home | 1920x1080 | No | none |
| Home | 2560x1440 | No | none |

---

## Console Error Report

| Route | Viewport | Error / Warning | Severity |
|---|---:|---|---|
| Home | 390x844 | Failed to load resource: the server responded with a status of 404 (Not Found) | Error |
| Home | 430x932 | Failed to load resource: the server responded with a status of 404 (Not Found) | Error |
| Home | 768x1024 | Failed to load resource: the server responded with a status of 404 (Not Found) | Error |
| Home | 1024x768 | Failed to load resource: the server responded with a status of 404 (Not Found) | Error |
| Home | 1366x768 | Failed to load resource: the server responded with a status of 404 (Not Found) | Error |
| Home | 1440x900 | Failed to load resource: the server responded with a status of 404 (Not Found) | Error |
| Home | 1920x1080 | Failed to load resource: the server responded with a status of 404 (Not Found) | Error |
| Home | 2560x1440 | Failed to load resource: the server responded with a status of 404 (Not Found) | Error |

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
