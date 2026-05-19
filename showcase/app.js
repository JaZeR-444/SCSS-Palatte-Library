document.addEventListener('DOMContentLoaded', () => {
    console.log('Showcase: Initializing professional design system v2.4.2...');

    // --- DOM Elements ---
    const getEl = (id) => document.getElementById(id);
    
    const elements = {
        grid: getEl('palette-grid'),
        nav: getEl('filter-nav'),
        overlay: getEl('modal-overlay'),
        modal: getEl('modal-content'),
        close: getEl('close-modal'),
        title: getEl('modal-title'),
        vibe: getEl('modal-vibe'),
        hero: getEl('hero-gradient'),
        lab: getEl('color-lab-grid'),
        code: getEl('code-block'),
        theme: getEl('theme-toggle'),
        sim: getEl('vision-simulator'),
        search: getEl('palette-search'),
        toast: getEl('toast-container'),
        facetTabs: getEl('facet-tabs'),
        subFilterContainer: getEl('sub-filter-container'),
        zoomIn: getEl('zoom-in'),
        zoomOut: getEl('zoom-out'),
        zoomDisplay: getEl('zoom-display'),
        scaleWrapper: getEl('sandbox-scale-wrapper'),
        roleToggle: getEl('toggle-role-labels'),
        roleOverlay: getEl('role-labels-overlay'),
        roleContent: getEl('role-labels-content'),
        roleChips: getEl('palette-role-chips'),
        contrastStatus: getEl('contrast-status'),
        facetSummary: getEl('facet-summary'),
        resetFilters: getEl('reset-filters'),
        resultsCount: getEl('results-count'),
        colorPicker: getEl('color-proximity-picker'),
        colorPickerSwatch: getEl('color-picker-swatch'),
        clearColorProximity: getEl('clear-color-proximity'),
        libraryCount: getEl('library-count'),
        // Pro Studio Elements
        toggleStates: getEl('toggle-states'),
        playAnims: getEl('play-animations'),
        splitView: getEl('toggle-split-view'),
        heatmap: getEl('toggle-heatmap'),
        sandboxBg: getEl('toggle-sandbox-bg'),
        exportComp: getEl('export-component'),
        roleTooltip: getEl('role-tooltip'),
        sandbox: getEl('section-sandbox')
    };

    // --- State ---
    let allPalettes = [];
    let currentPalette = null;
    let activeFacet = 'all';
    let activeSubFilter = null;
    let searchQuery = '';
    let activeDashVariant = 'analytics';
    let sandboxZoom = 100;
    let showRoleLabels = false;
    let heatmapActive = false;
    let splitViewActive = false;
    let statesActive = false;
    let sandboxBgActive = false;
    let recentIds = loadJson('paletteShowcase.recentIds', []);
    let savedIds = loadJson('paletteShowcase.favorites', []);
    let colorProximity = null;
    let sortOrder = 'name';
    let labContrastBg = null;

    function loadJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function saveJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function rememberPalette(paletteId) {
        recentIds = [paletteId, ...recentIds.filter(id => id !== paletteId)].slice(0, 24);
        saveJson('paletteShowcase.recentIds', recentIds);
    }

    // --- Core Logic: Search & Filtering ---

    function applyFilters() {
        const query = searchQuery.trim().toLowerCase();
        let filtered = allPalettes.filter(p => {
            const matchesFacet = 
                activeFacet === 'all' || 
                (activeFacet === 'recent' && recentIds.includes(p.id)) ||
                (activeFacet === 'favorites' && savedIds.includes(p.id)) ||
                (activeFacet === 'count' && p.count === parseInt(activeSubFilter));

            const matchesSearch = 
                !query || 
                p.name.toLowerCase().includes(query) || 
                (p.category && p.category.toLowerCase().includes(query)) ||
                (p.tags && p.tags.mood && p.tags.mood.some(m => m.toLowerCase().includes(query))) ||
                (p.tags && p.tags.aesthetic && p.tags.aesthetic.some(a => a.toLowerCase().includes(query)));

            return matchesFacet && matchesSearch;
        });
        if (colorProximity && sortOrder === 'proximity') {
            filtered = filtered
                .map(p => ({ palette: p, distance: getPaletteDistance(p, colorProximity) }))
                .sort((a, b) => a.distance - b.distance || a.palette.name.localeCompare(b.palette.name))
                .map(item => item.palette);
        } else {
            filtered = sortPalettes(filtered);
        }
        renderPalettes(filtered);
        updateFacetSummary(filtered.length);
        if (elements.resultsCount) {
            elements.resultsCount.textContent = `${filtered.length} palettes`;
        }
    }

    function sortPalettes(palettes) {
        const list = [...palettes];
        if (activeFacet === 'recent' && sortOrder === 'recent') {
            return list.sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));
        }
        if (sortOrder === 'recent') {
            return list.sort((a, b) => {
                const aTime = Date.parse(a.updated || a.created || '') || 0;
                const bTime = Date.parse(b.updated || b.created || '') || 0;
                return bTime - aTime || a.name.localeCompare(b.name);
            });
        }
        if (sortOrder === 'count-asc') return list.sort((a, b) => a.count - b.count || a.name.localeCompare(b.name));
        if (sortOrder === 'count-desc') return list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }

    function getPaletteDistance(palette, targetHex) {
        const target = hexToRgb255(targetHex);
        return Math.min(...palette.colors.map(color => {
            const rgb = hexToRgb255(color.hex);
            return Math.sqrt(
                Math.pow(rgb[0] - target[0], 2) +
                Math.pow(rgb[1] - target[1], 2) +
                Math.pow(rgb[2] - target[2], 2)
            );
        }));
    }

    function hexToRgb255(hex) {
        const clean = (hex || '#000000').replace('#', '').slice(0, 6).padEnd(6, '0');
        return [
            parseInt(clean.slice(0, 2), 16) || 0,
            parseInt(clean.slice(2, 4), 16) || 0,
            parseInt(clean.slice(4, 6), 16) || 0
        ];
    }

    function getPaletteColorGroups(palette) {
        const text = [
            palette.category,
            palette.name,
            ...((palette.tags && palette.tags.mood) || []),
            ...((palette.tags && palette.tags.aesthetic) || [])
        ].join(' ').toLowerCase();
        const groups = [];
        ['white', 'black', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray', 'neutral', 'dark', 'warm', 'cool'].forEach(group => {
            if (text.includes(group) || (group === 'gray' && text.includes('grey'))) groups.push(group);
        });
        return groups.length ? groups : ['mixed'];
    }

    function getFacetLabel() {
        const labels = {
            all: 'Explore the full palette library.',
            recent: 'Recently opened palettes from this browser.',
            favorites: 'Saved palettes from this browser.',
            count: activeSubFilter ? `Showing ${activeSubFilter}-color palettes.` : 'Group palettes by swatch count.'
        };
        const colorText = colorProximity ? ` Sorted near ${colorProximity.toUpperCase()}.` : '';
        return `${labels[activeFacet] || labels.all}${colorText}`;
    }

    function updateFacetSummary(count) {
        if (!elements.facetSummary) return;
        elements.facetSummary.textContent = `${getFacetLabel()} ${count} match${count === 1 ? '' : 'es'}.`;
    }

    // --- UI Utilities ---

    function hexToHsl(hex) {
        const [r, g, b] = hexToRgb(hex);
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const l = (max + min) / 2;
        let h = 0, s = 0;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            else if (max === g) h = ((b - r) / d + 2) / 6;
            else h = ((r - g) / d + 4) / 6;
        }
        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }

    function hexToRgb(hex) {
        try {
            const clean = (hex || '#000000').replace('#', '').slice(0, 6);
            const r = parseInt(clean.slice(0, 2), 16) / 255 || 0;
            const g = parseInt(clean.slice(2, 4), 16) / 255 || 0;
            const b = parseInt(clean.slice(4, 6), 16) / 255 || 0;
            return [r, g, b];
        } catch (e) { return [0, 0, 0]; }
    }

    function getLuminance(rgb) {
        const a = rgb.map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    function getContrast(rgb1, rgb2) {
        const l1 = getLuminance(rgb1) + 0.05;
        const l2 = getLuminance(rgb2) + 0.05;
        return l1 > l2 ? l1 / l2 : l2 / l1;
    }

    function getA11yBadge(contrast) {
        if (contrast >= 7) return '<span class="px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 text-[8px] font-black tracking-tighter">AAA</span>';
        if (contrast >= 4.5) return '<span class="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[8px] font-black tracking-tighter">AA</span>';
        return '<span class="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[8px] font-black tracking-tighter italic opacity-50">FAIL</span>';
    }

    function showToast(message, type = 'success') {
        if (!elements.toast) return;
        const toast = document.createElement('div');
        toast.className = 'px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl flex items-center gap-3 transition-all duration-300 pointer-events-auto transform translate-y-10 opacity-0 z-[100]';
        toast.innerHTML = `
            <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-green-400' : 'fa-circle-exclamation text-red-400'}"></i>
            <span class="text-sm font-bold">${message}</span>
        `;
        elements.toast.appendChild(toast);
        setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 10);
        setTimeout(() => {
            toast.classList.add('translate-y-[-20px]', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    const copyToClipboard = (text, msg) => {
        navigator.clipboard.writeText(text).then(() => showToast(msg || 'Copied!'));
    };
    window.copyToClipboard = copyToClipboard;

    // --- Rendering ---

    function getTagStyles(tag) {
        const t = tag.toLowerCase();
        const base = "text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter border transition-all hover:scale-105 ";
        
        if (t.includes('nature') || t.includes('forest') || t.includes('garden') || t.includes('leaf') || t.includes('eco')) 
            return base + "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50";
        
        if (t.includes('neon') || t.includes('cyber') || t.includes('fuchsia') || t.includes('hot') || t.includes('vibrant')) 
            return base + "bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-800/50";
        
        if (t.includes('warm') || t.includes('sunset') || t.includes('orange') || t.includes('fire') || t.includes('heat')) 
            return base + "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800/50";
        
        if (t.includes('cool') || t.includes('arctic') || t.includes('ice') || t.includes('blue') || t.includes('ocean') || t.includes('winter')) 
            return base + "bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-800/50";
        
        if (t.includes('retro') || t.includes('vintage') || t.includes('90s') || t.includes('classic') || t.includes('amber')) 
            return base + "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50";
        
        if (t.includes('pro') || t.includes('minimal') || t.includes('clean') || t.includes('corporate') || t.includes('modern') || t.includes('industrial')) 
            return base + "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
        
        if (t.includes('dark') || t.includes('midnight') || t.includes('void') || t.includes('black') || t.includes('night')) 
            return base + "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";

        return base + "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50";
    }

    function renderPalettes(palettes) {
        if (!elements.grid) return;
        elements.grid.innerHTML = '';

        if (palettes.length === 0) {
            elements.grid.innerHTML = '<div class="col-span-full py-20 text-center opacity-50 flex flex-col items-center gap-4"><i class="fa-solid fa-ghost text-4xl"></i><p class="text-xl font-bold">No results found</p></div>';
            return;
        }

        palettes.forEach(p => {
            const card = document.createElement('div');
            card.className = 'palette-card group relative bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col';
            card.dataset.id = p.id;

            const gradientStops = p.colors.map(c => c.hex.slice(0, 7)).join(', ');

            const swatches = p.colors.map(c =>
                `<div class="swatch-item" style="background-color:${c.hex}" onclick="event.stopPropagation(); copyToClipboard('${c.hex}', 'Copied ${c.hex}')"></div>`
            ).join('');

            const moodTags = (p.tags && p.tags.mood ? p.tags.mood : []).map(t => `<span class="${getTagStyles(t)}">${t}</span>`);
            const aestheticTags = (p.tags && p.tags.aesthetic ? p.tags.aesthetic : []).map(t => `<span class="${getTagStyles(t)}">${t}</span>`);
            const allTagsHtml = [...moodTags, ...aestheticTags].slice(0, 3).join('');

            const dotMax = 6;
            const colorDots = p.colors.slice(0, dotMax).map((c, i) =>
                `<span class="inline-block w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm flex-shrink-0 relative${i > 0 ? ' -ml-1.5' : ''}" style="background:${c.hex};z-index:${dotMax - i}" title="${c.name}"></span>`
            ).join('');
            const extraDots = p.colors.length > dotMax ? p.colors.length - dotMax : 0;

            const isSaved = savedIds.includes(p.id);
            const categoryLabel = p.folder ? p.folder.replace(' Palette', '') : 'Collection';

            card.innerHTML = `
                <div class="relative overflow-hidden" style="height:108px">
                    <div class="absolute inset-0 transition-transform duration-700 group-hover:scale-110" style="background:linear-gradient(135deg,${gradientStops})"></div>
                    <div class="absolute inset-0 bg-gradient-to-b from-black/0 via-black/5 to-black/40"></div>
                    <div class="absolute bottom-0 left-0 right-0 flex overflow-hidden" style="height:28px">${swatches}</div>
                    <span class="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest text-white" style="background:rgba(0,0,0,0.28);border:1px solid rgba(255,255,255,0.18);backdrop-filter:blur(4px)">${p.count} <span style="opacity:0.55;font-size:8px">CLR</span></span>
                    <button class="palette-favorite-btn absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100" style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.18);backdrop-filter:blur(4px)" data-palette-id="${p.id}" title="${isSaved ? 'Remove from saved' : 'Save palette'}">
                        <i class="fa-solid fa-heart text-[10px] ${isSaved ? 'text-red-400' : 'text-white opacity-50'}"></i>
                    </button>
                </div>
                <div class="px-4 pt-4 pb-3 flex-1 flex flex-col gap-2">
                    <div>
                        <h3 class="font-extrabold text-[15px] leading-snug text-gray-900 dark:text-gray-100 group-hover:text-indigo-500 transition-colors">${p.name}</h3>
                        <p class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">${categoryLabel}</p>
                    </div>
                    ${allTagsHtml ? `<div class="flex flex-wrap gap-1">${allTagsHtml}</div>` : ''}
                </div>
                <div class="px-4 pb-4 pt-1 flex items-center justify-between gap-2">
                    <div class="flex items-center">${colorDots}${extraDots > 0 ? `<span class="text-[9px] font-bold text-gray-400 ml-1.5">+${extraDots}</span>` : ''}</div>
                    <div class="w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm flex-shrink-0"><i class="fa-solid fa-arrow-right text-xs"></i></div>
                </div>
            `;
            elements.grid.appendChild(card);
        });
    }

    // --- Modal Logic ---

    function openModal(p) {
        console.log(`Showcase: Opening modal for ${p.name}`);
        currentPalette = p;
        rememberPalette(p.id);
        if (elements.title) elements.title.textContent = p.name;
        if (elements.vibe) elements.vibe.textContent = `${(p.folder || '').replace(' Palette', '') || 'Collection'} • ${p.count} Colors`;
        const descEl = document.getElementById('modal-description');
        if (descEl) { descEl.textContent = p.description || ''; descEl.classList.toggle('hidden', !p.description); }
        if (elements.code) elements.code.textContent = '/* Loading SCSS... */';
        sandboxZoom = 100;
        if (elements.scaleWrapper) elements.scaleWrapper.style.transform = 'scale(1)';
        if (elements.zoomDisplay) elements.zoomDisplay.textContent = '100%';

        if (elements.hero) {
            const hexes = p.colors.map(c => c.hex).join(', ');
            elements.hero.style.background = `radial-gradient(circle at center, ${hexes})`;
        }

        applyPaletteMapping(p.colors, 'modal-content');
        applyPaletteMapping(p.colors, 'section-sandbox');
        applyPaletteMapping(p.colors, 'section-typography');
        applyPaletteMapping(p.colors, 'section-iconography');

        renderColorLab(p);

        switchUseCase('dashboard');

        // Studio Animations
        if (window.gsap) {
            gsap.from(".typography-specimen", { opacity: 0, x: -20, duration: 0.6, stagger: 0.2, delay: 0.5, ease: "power2.out" });
            gsap.from(".studio-icon", { opacity: 0, scale: 0.5, duration: 0.5, stagger: 0.1, delay: 0.8, ease: "back.out(2)" });
        }

        fetch('../' + p.path)
            .then(res => res.text())
            .then(text => {
                p.source = text;
                if (elements.code) elements.code.textContent = text;
            })
            .catch(() => { if (elements.code) elements.code.textContent = '/* Error loading file */'; });

        populateRelatedPalettes(p);
        if (elements.overlay) {
            elements.overlay.classList.remove('hidden');
            setTimeout(() => elements.overlay.classList.add('active'), 10);
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal() {
        if (!elements.overlay) return;
        elements.overlay.classList.remove('active');
        setTimeout(() => {
            elements.overlay.classList.add('hidden');
            document.body.style.overflow = '';
            if (elements.sim) elements.sim.value = 'none';
            if (elements.modal) elements.modal.style.filter = '';
            gsap.killTweensOf(".usecase-content *, .dash-view *, .typography-specimen, .studio-icon");
        }, 300);
    }

    // --- Event Listeners ---

    // Use Event Delegation for palette cards
    if (elements.grid) {
        elements.grid.addEventListener('click', (e) => {
            const favBtn = e.target.closest('.palette-favorite-btn');
            if (favBtn) {
                e.stopPropagation();
                toggleFavorite(favBtn.dataset.paletteId, favBtn);
                return;
            }
            const card = e.target.closest('[data-id]');
            if (card) {
                const id = card.dataset.id;
                const palette = allPalettes.find(p => p.id === id);
                if (palette) openModal(palette);
            }
        });
    }

    document.addEventListener('click', (e) => {
        // Handle Palette Navigation Actions
        const actionBtn = e.target.closest('[data-action]');
        if (actionBtn && currentPalette) {
            const action = actionBtn.dataset.action;
            if (allPalettes.length === 0) return;
            
            const currentIndex = allPalettes.findIndex(p => p.id === currentPalette.id);
            let target = null;
            
            if (action === 'random-palette') {
                target = allPalettes[Math.floor(Math.random() * allPalettes.length)];
            } else if (action === 'next-palette') {
                target = allPalettes[(currentIndex + 1) % allPalettes.length];
            } else if (action === 'prev-palette') {
                target = allPalettes[(currentIndex - 1 + allPalettes.length) % allPalettes.length];
            }
            
            if (target) {
                openModal(target);
                showToast(action === 'random-palette' ? 'Randomized palette!' : 'Jumping to next...');
            }
            return;
        }

        const randomPaletteGlobal = e.target.closest('#random-palette');
        if (randomPaletteGlobal) {
            if (allPalettes.length === 0) return;
            const target = allPalettes[Math.floor(Math.random() * allPalettes.length)];
            openModal(target);
            showToast('Jumped to random palette!');
            return;
        }

        // Section Shuffles
        const shuffleBtn = e.target.closest('[data-shuffle]');
        if (shuffleBtn) shuffleSectionColors(shuffleBtn.dataset.shuffle);

        const useBtn = e.target.closest('.usecase-btn');
        if (useBtn) switchUseCase(useBtn.dataset.usecase);

        const dashBtn = e.target.closest('.dash-btn');
        if (dashBtn) switchDashboardVariant(dashBtn.dataset.dash);

        const copyBtn = e.target.closest('[data-copy]');
        if (copyBtn && currentPalette) {
            const mode = copyBtn.dataset.copy;
            if (mode === 'full-scss') copyToClipboard(currentPalette.source || '/* Source not loaded */', 'Full SCSS copied!');
            else if (mode === 'current') copyToClipboard(elements.code ? elements.code.textContent : '', 'Code copied!');
            return;
        }

        const tabBtn = e.target.closest('.tab-btn');
        if (tabBtn && currentPalette) {
            const tab = tabBtn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active', 'text-indigo-400', 'border-indigo-500', 'bg-indigo-500/5');
                b.classList.add('text-gray-500', 'border-transparent');
            });
            tabBtn.classList.add('active', 'text-indigo-400', 'border-indigo-500', 'bg-indigo-500/5');
            
            if (tab === 'scss') elements.code.textContent = currentPalette.source || '/* Loading... */';
            if (tab === 'css') {
                let css = ':root {\n';
                currentPalette.colors.forEach(c => css += `  --${c.name.toLowerCase().replace(/\s+/g, '-')}: ${c.hex};\n`);
                css += '}';
                elements.code.textContent = css;
            }
            if (tab === 'tailwind') {
                let colors = '';
                currentPalette.colors.forEach(c => colors += `        '${c.name.toLowerCase().replace(/\s+/g, '-')}': '${c.hex.slice(0, 7)}',\n`);
                elements.code.textContent = `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${colors}      },\n    },\n  },\n};`;
            }
        }
    });

    if (elements.close) elements.close.addEventListener('click', closeModal);
    if (elements.overlay) elements.overlay.addEventListener('click', (e) => e.target === elements.overlay && closeModal());
    document.addEventListener('keydown', (e) => e.key === 'Escape' && closeModal());

    if (elements.search) {
        elements.search.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            applyFilters();
        });
    }

    const sortSelect = getEl('sort-order');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortOrder = e.target.value;
            if (sortOrder === 'proximity' && !colorProximity) {
                setColorProximity(elements.colorPicker ? elements.colorPicker.value : '#6366f1');
                return;
            }
            applyFilters();
        });
    }

    if (elements.theme) {
        elements.theme.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.theme = isDark ? 'dark' : 'light';
        });
    }

    if (elements.sim && elements.modal) {
        elements.sim.addEventListener('change', (e) => {
            elements.modal.style.filter = e.target.value === 'none' ? '' : `url(#${e.target.value})`;
        });
    }

    if (elements.zoomIn && elements.zoomOut && elements.scaleWrapper) {
        elements.zoomIn.addEventListener('click', () => {
            sandboxZoom = Math.min(sandboxZoom + 10, 150);
            elements.scaleWrapper.style.transform = `scale(${sandboxZoom / 100})`;
            elements.zoomDisplay.textContent = `${sandboxZoom}%`;
        });
        elements.zoomOut.addEventListener('click', () => {
            sandboxZoom = Math.max(sandboxZoom - 10, 50);
            elements.scaleWrapper.style.transform = `scale(${sandboxZoom / 100})`;
            elements.zoomDisplay.textContent = `${sandboxZoom}%`;
        });
    }

    if (elements.roleToggle && elements.roleOverlay) {
        elements.roleToggle.addEventListener('click', () => {
            const isVisible = !elements.roleOverlay.classList.contains('hidden');
            elements.roleOverlay.classList.toggle('hidden');
            elements.roleToggle.classList.toggle('bg-indigo-100', !isVisible);
            elements.roleToggle.classList.toggle('text-indigo-600', !isVisible);
            showRoleLabels = !isVisible;
            if (showRoleLabels) updateRoleLabels();
        });
    }

    // --- Sub-Functions ---

    function applyPaletteMapping(colors, targetId = null) {
        if (!colors || colors.length === 0) return;
        const target = targetId ? document.getElementById(targetId) : document.documentElement;
        if (!target) return;
        for (let i = 1; i <= 10; i++) {
            const colorIdx = (i - 1) % colors.length;
            const hex = colors[colorIdx].hex;
            target.style.setProperty(`--ui-color-${i}`, hex);
            
            // Apply data-role for Heatmap/Inspector logic
            if (targetId === 'section-sandbox') {
                const elementsWithRole = target.querySelectorAll(`[data-role="--ui-color-${i}"]`);
                elementsWithRole.forEach(el => {
                    if (heatmapActive) updateHeatmapElement(el, hex);
                });
            }
        }
        if (targetId === 'section-sandbox') {
            renderSandboxRoleChips();
            updateContrastStatus();
        }
    }

    function updateHeatmapElement(el, hex) {
        // Simple logic: if it's text, check against bg. If it's bg, check against surface.
        const parent = el.parentElement;
        const bgHex = getSandboxHex(1); // Default bg
        const contrast = getContrast(hexToRgb(hex), hexToRgb(bgHex));
        el.classList.toggle('heatmap-pass', contrast >= 4.5);
        el.classList.toggle('heatmap-fail', contrast < 4.5);
    }

    const sandboxRoles = ['Background', 'Surface', 'Primary', 'Accent', 'Text', 'Border', 'Success', 'Warning'];

    function getSandboxHex(index) {
        const target = document.getElementById('section-sandbox');
        if (!target) return '';
        return getComputedStyle(target).getPropertyValue(`--ui-color-${index}`).trim();
    }

    function getReadableTextColor(hex) {
        const rgb = hexToRgb(hex);
        const whiteContrast = getContrast(rgb, [1, 1, 1]);
        const darkContrast = getContrast(rgb, [15/255, 23/255, 42/255]);
        return whiteContrast >= darkContrast ? '#ffffff' : '#0f172a';
    }

    function renderSandboxRoleChips() {
        if (!elements.roleChips || !currentPalette) return;
        elements.roleChips.innerHTML = sandboxRoles.map((role, index) => {
            const hex = getSandboxHex(index + 1) || currentPalette.colors[index % currentPalette.colors.length].hex;
            return `
                <button class="role-chip rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    draggable="true" data-index="${index}"
                    onclick="copyToClipboard('${hex.slice(0, 7).toUpperCase()}', '${role} color copied')">
                    <span class="block h-8 rounded-lg mb-2 border border-black/5" style="background:${hex}; color:${getReadableTextColor(hex)}">
                        <span class="sr-only">${role}</span>
                    </span>
                    <span class="block text-[9px] font-black uppercase tracking-widest text-gray-400">${role}</span>
                    <code class="block truncate text-[10px] font-bold text-gray-700 dark:text-gray-200">${hex.slice(0, 7).toUpperCase()}</code>
                </button>
            `;
        }).join('');
        initDragAndDrop();
    }

    function updateContrastStatus() {
        if (!elements.contrastStatus || !currentPalette) return;
        const bg = getSandboxHex(1) || currentPalette.colors[0].hex;
        const surface = getSandboxHex(2) || currentPalette.colors[1 % currentPalette.colors.length].hex;
        const primary = getSandboxHex(3) || currentPalette.colors[2 % currentPalette.colors.length].hex;
        const text = getSandboxHex(5) || currentPalette.colors[Math.min(4, currentPalette.colors.length - 1)].hex;
        const textContrast = getContrast(hexToRgb(bg), hexToRgb(text));
        const primaryContrast = getContrast(hexToRgb(surface), hexToRgb(primary));
        const score = Math.min(textContrast, primaryContrast);
        let label = 'Needs Review';
        let classes = 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
        if (score >= 4.5) {
            label = 'AA Ready';
            classes = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
        } else if (score < 3) {
            label = 'Decorative Only';
            classes = 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300';
        }
        elements.contrastStatus.className = `rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${classes}`;
        elements.contrastStatus.textContent = label;
        elements.contrastStatus.title = `Text/background ${textContrast.toFixed(1)}:1, primary/surface ${primaryContrast.toFixed(1)}:1`;
    }

    function renderColorLab(p) {
        if (!elements.lab || !p) return;
        elements.lab.innerHTML = '';
        const white = [1, 1, 1];
        const dark = [15/255, 23/255, 42/255];
        p.colors.forEach(color => {
            const rgb = hexToRgb(color.hex);
            const contrastW = getContrast(rgb, white);
            const contrastD = getContrast(rgb, dark);
            const hex6 = color.hex.slice(0, 7).toUpperCase();
            const textOnSwatch = contrastW >= contrastD ? '#ffffff' : '#0f172a';
            const [h, s, l] = hexToHsl(color.hex);
            const customRow = labContrastBg ? (() => {
                const customRgb = hexToRgb(labContrastBg);
                const contrastC = getContrast(rgb, customRgb);
                return `<div class="flex items-center gap-2">
                    <span class="text-[9px] font-bold text-pink-400 w-14 shrink-0">Custom</span>
                    ${getA11yBadge(contrastC)}
                    <span class="text-[9px] text-gray-400 font-mono">${contrastC.toFixed(1)}:1</span>
                </div>`;
            })() : '';
            const labCard = document.createElement('div');
            labCard.className = 'bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center gap-4 shadow border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all group';
            labCard.innerHTML = `
                <div class="w-16 h-16 rounded-xl shadow-inner border border-black/5 flex-shrink-0 cursor-pointer transition-transform active:scale-95 flex items-center justify-center"
                    style="background-color:${color.hex}"
                    onclick="copyToClipboard('${hex6}', 'HEX ${hex6} copied!')">
                    <span style="color:${textOnSwatch}" class="text-xs font-black select-none opacity-80">Aa</span>
                </div>
                <div class="flex-1 overflow-hidden">
                    <h4 class="font-bold text-sm mb-1 truncate">${color.name}</h4>
                    <div class="flex items-center gap-2 mb-1">
                        <code class="text-[10px] text-gray-400 font-mono">${hex6}</code>
                        <button onclick="copyToClipboard('${hex6}', 'HEX ${hex6} copied!')" class="text-gray-300 hover:text-indigo-500 transition-colors">
                            <i class="fa-solid fa-copy text-[10px]"></i>
                        </button>
                    </div>
                    <code class="block text-[9px] text-gray-300 font-mono mb-2">hsl(${h}, ${s}%, ${l}%)</code>
                    <div class="space-y-1.5">
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] font-bold text-gray-400 w-14 shrink-0">On Light</span>
                            ${getA11yBadge(contrastW)}
                            <span class="text-[9px] text-gray-400 font-mono">${contrastW.toFixed(1)}:1</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] font-bold text-gray-400 w-14 shrink-0">On Dark</span>
                            ${getA11yBadge(contrastD)}
                            <span class="text-[9px] text-gray-400 font-mono">${contrastD.toFixed(1)}:1</span>
                        </div>
                        ${customRow}
                    </div>
                </div>
            `;
            elements.lab.appendChild(labCard);
        });
    }

    function shuffleSectionColors(section) {
        if (!currentPalette) return;

        const targetId = `section-${section}`;
        if (section === 'lab') {
            const grid = document.getElementById('color-lab-grid');
            if (grid) {
                const cards = Array.from(grid.children);
                cards.sort(() => Math.random() - 0.5);
                grid.innerHTML = '';
                cards.forEach(c => grid.appendChild(c));
            }
        } else if (section === 'hero') {
            const hexes = [...currentPalette.colors].sort(() => Math.random() - 0.5).map(c => c.hex).join(', ');
            if (elements.hero) elements.hero.style.background = `radial-gradient(circle at center, ${hexes})`;
        } else {
            const shuffled = [...currentPalette.colors].sort(() => Math.random() - 0.5);
            applyPaletteMapping(shuffled, targetId);
            if (section === 'sandbox' && showRoleLabels) updateRoleLabels();
            if (section === 'sandbox') {
                renderSandboxRoleChips();
                updateContrastStatus();
            }
        }

        if (window.gsap) {
            gsap.fromTo(`#${targetId}`, { opacity: 0.5, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" });
        }
        showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} shuffled!`);
    }

    function toggleFavorite(id, btn) {
        if (!id) return;
        if (savedIds.includes(id)) {
            savedIds = savedIds.filter(sid => sid !== id);
            showToast('Removed from saved');
        } else {
            savedIds = [...savedIds, id];
            showToast('Palette saved!');
        }
        saveJson('paletteShowcase.favorites', savedIds);
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) {
                const nowSaved = savedIds.includes(id);
                icon.className = `fa-solid fa-heart text-[10px] ${nowSaved ? 'text-red-400' : 'text-white opacity-50'}`;
            }
        }
        if (activeFacet === 'favorites') applyFilters();
    }

    function populateRelatedPalettes(current) {
        const container = document.getElementById('related-palettes');
        if (!container) return;
        const currentTags = [...(current.tags?.mood || []), ...(current.tags?.aesthetic || [])];
        const scored = allPalettes
            .filter(p => p.id !== current.id)
            .map(p => {
                let score = p.folder === current.folder ? 3 : 0;
                const pTags = [...(p.tags?.mood || []), ...(p.tags?.aesthetic || [])];
                currentTags.forEach(t => { if (pTags.includes(t)) score += 1; });
                return { p, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 4)
            .map(item => item.p);
        container.innerHTML = scored.map(p => {
            const swatches = p.colors.map(c => `<span style="flex:1;height:100%;display:block;background:${c.hex.slice(0,7)}"></span>`).join('');
            return `<div class="related-card group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:-translate-y-0.5 transition-all" data-id="${p.id}">
                <div class="related-swatches">${swatches}</div>
                <div class="p-3">
                    <h4 class="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-indigo-500 transition-colors truncate">${p.name}</h4>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">${p.count} Colors</p>
                </div>
            </div>`;
        }).join('');
        container.querySelectorAll('.related-card').forEach(card => {
            card.addEventListener('click', () => {
                const palette = allPalettes.find(p => p.id === card.dataset.id);
                if (palette) openModal(palette);
            });
        });
    }

    function switchDashboardVariant(variant) {
        document.querySelectorAll('.dash-btn').forEach(b => {
            const isActive = b.dataset.dash === variant;
            b.classList.toggle('active', isActive);
            b.classList.toggle('text-gray-500', !isActive);
        });
        document.querySelectorAll('.dash-view').forEach(view => {
            const isTarget = view.id === 'dash-' + variant;
            view.classList.toggle('opacity-0', !isTarget);
            view.classList.toggle('pointer-events-none', !isTarget);
        });
        activeDashVariant = variant;
        if (!window.gsap) return;
        gsap.killTweensOf(".dash-view *");
        if (variant === 'analytics') gsap.from("#dash-analytics .lg\\:col-span-8", { y: 20, opacity: 0, duration: 0.6, ease: "power2.out" });
        else if (variant === 'crm') gsap.from("#dash-crm .space-y-4 > div", { x: -20, opacity: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" });
        else if (variant === 'monitor') gsap.from("#dash-monitor .aspect-square", { scale: 0, opacity: 0, duration: 0.6, stagger: 0.1, ease: "elastic.out(1, 0.5)" });
        else if (variant === 'profile') gsap.from("#dash-profile .bg-gradient-to-br", { y: -50, opacity: 0, duration: 0.8, ease: "power3.out" });
    }

    function switchUseCase(usecase) {
        const descriptions = {
            dashboard: 'Multi-layout dashboard - Analytics, CRM, Monitor & Profile',
            social: 'Social post and interaction preview',
            landing: 'Landing page hero and navigation preview',
            commerce: 'Product card and shopping UI preview',
            mobile: 'Compact app shell and navigation preview',
            typography: 'Headings, body text, links, quotes, badges, and inline code'
        };
        const descriptionEl = document.getElementById('usecase-description');
        if (descriptionEl) descriptionEl.textContent = descriptions[usecase] || descriptions.dashboard;

        // Adaptive Skeleton Flash
        const wrapper = elements.sandbox;
        if (wrapper && window.gsap) {
            const skeleton = document.createElement('div');
            skeleton.className = 'absolute inset-0 z-40 bg-gray-50 dark:bg-slate-950 flex items-center justify-center';
            skeleton.innerHTML = '<div class="w-full h-full skeleton opacity-40"></div>';
            wrapper.appendChild(skeleton);
            gsap.to(skeleton, { opacity: 0, duration: 0.4, delay: 0.15, onComplete: () => skeleton.remove() });
        }

        document.querySelectorAll('.usecase-btn').forEach(b => {
            const isActive = b.dataset.usecase === usecase;
            b.classList.toggle('active', isActive);
            b.classList.toggle('text-gray-500', !isActive);
        });
        document.querySelectorAll('.usecase-content').forEach(panel => {
            const isTarget = panel.id === 'case-' + usecase;
            panel.classList.toggle('opacity-0', !isTarget);
            panel.classList.toggle('pointer-events-none', !isTarget);
            if (panel.id === 'case-dashboard') panel.classList.toggle('hidden', !isTarget);
        });
        if (!window.gsap) return;
        gsap.killTweensOf(".usecase-content *");
        if (usecase === 'dashboard') switchDashboardVariant(activeDashVariant);
        else if (usecase === 'social') gsap.from("#social-card", { scale: 0.9, opacity: 0, duration: 0.6, ease: "back.out(1.7)" });
        else if (usecase === 'landing') gsap.from("#monitor-frame", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" });
        else if (usecase === 'commerce') gsap.from("#commerce-card", { x: -30, opacity: 0, duration: 0.7, ease: "power3.out" });
        else if (usecase === 'mobile') gsap.from("#mobile-shell", { y: 50, opacity: 0, duration: 0.8, ease: "power4.out" });
    }

    function updateRoleLabels() {
        if (!elements.roleContent || !currentPalette) return;
        const target = document.getElementById('section-sandbox');
        const computed = getComputedStyle(target);
        elements.roleContent.innerHTML = '';
        for (let i = 1; i <= 10; i++) {
            const hex = computed.getPropertyValue(`--ui-color-${i}`).trim().toUpperCase();
            if (!hex) continue;
            const role = sandboxRoles[i - 1] || `Color ${i}`;
            const chip = document.createElement('div');
            chip.className = 'flex items-center gap-1.5 px-2 py-1 rounded bg-black/50 border border-white/10 backdrop-blur-md';
            chip.innerHTML = `<div class="w-2 h-2 rounded-full flex-shrink-0" style="background:${hex}"></div><span class="text-[8px] font-black text-white/70 uppercase tracking-tighter">${role}: ${hex}</span>`;
            elements.roleContent.appendChild(chip);
        }
    }

    // --- Pro Studio Tools ---

    function initDragAndDrop() {
        if (!elements.roleChips) return;
        const chips = elements.roleChips.querySelectorAll('.role-chip');
        
        chips.forEach(chip => {
            chip.addEventListener('dragstart', (e) => {
                chip.classList.add('dragging');
                e.dataTransfer.setData('text/plain', chip.dataset.index);
            });

            chip.addEventListener('dragend', () => {
                chip.classList.remove('dragging');
                chips.forEach(c => c.classList.remove('drag-over'));
            });

            chip.addEventListener('dragover', (e) => {
                e.preventDefault();
                chip.classList.add('drag-over');
            });

            chip.addEventListener('dragleave', () => {
                chip.classList.remove('drag-over');
            });

            chip.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = parseInt(chip.dataset.index);
                
                if (fromIndex !== toIndex) {
                    swapRoles(fromIndex + 1, toIndex + 1);
                }
            });
        });
    }

    function swapRoles(idx1, idx2) {
        const sandbox = elements.sandbox;
        const color1 = getComputedStyle(sandbox).getPropertyValue(`--ui-color-${idx1}`).trim();
        const color2 = getComputedStyle(sandbox).getPropertyValue(`--ui-color-${idx2}`).trim();
        
        sandbox.style.setProperty(`--ui-color-${idx1}`, color2);
        sandbox.style.setProperty(`--ui-color-${idx2}`, color1);
        
        renderSandboxRoleChips();
        updateContrastStatus();
        showToast(`Swapped Role ${idx1} and ${idx2}`);
    }

    function initProTools() {
        // Vision Simulator
        if (elements.sim && elements.sandbox) {
            elements.sim.addEventListener('change', (e) => {
                elements.sandbox.style.filter = e.target.value === 'none' ? '' : `url(#${e.target.value})`;
            });
        }

        // Toggle States
        elements.toggleStates?.addEventListener('click', () => {
            statesActive = !statesActive;
            elements.sandbox.classList.toggle('simulate-states', statesActive);
            elements.toggleStates.classList.toggle('bg-indigo-100', statesActive);
            showToast(statesActive ? 'States simulation ON' : 'States simulation OFF');
        });

        // Heatmap
        elements.heatmap?.addEventListener('click', () => {
            heatmapActive = !heatmapActive;
            elements.sandbox.classList.toggle('heatmap-mode', heatmapActive);
            elements.heatmap.classList.toggle('bg-indigo-100', heatmapActive);
            if (heatmapActive) {
                const elementsWithRole = elements.sandbox.querySelectorAll('[data-role]');
                elementsWithRole.forEach(el => {
                    const role = el.dataset.role;
                    const hex = getComputedStyle(elements.sandbox).getPropertyValue(role).trim();
                    updateHeatmapElement(el, hex);
                });
            } else {
                elements.sandbox.querySelectorAll('.heatmap-pass, .heatmap-fail').forEach(el => {
                    el.classList.remove('heatmap-pass', 'heatmap-fail');
                });
            }
            showToast(heatmapActive ? 'Heatmap enabled' : 'Heatmap disabled');
        });

        // Play Animations
        elements.playAnims?.addEventListener('click', () => {
            if (!window.gsap) return;
            showToast('Playing interaction timeline...');
            switchUseCase(document.querySelector('.usecase-btn.active').dataset.usecase);
        });

        // Sandbox BG
        elements.sandboxBg?.addEventListener('click', () => {
            sandboxBgActive = !sandboxBgActive;
            elements.sandbox.classList.toggle('sandbox-bg-image', sandboxBgActive);
            elements.sandboxBg.classList.toggle('bg-indigo-100', sandboxBgActive);
        });

        // Split View
        elements.splitView?.addEventListener('click', () => {
            splitViewActive = !splitViewActive;
            elements.sandbox.classList.toggle('split-view-active', splitViewActive);
            elements.splitView.classList.toggle('bg-indigo-100', splitViewActive);
            
            const scaleWrapper = elements.scaleWrapper;
            if (splitViewActive) {
                const activeContent = elements.sandbox.querySelector('.usecase-content:not(.opacity-0)');
                if (activeContent) {
                    const clone = activeContent.cloneNode(true);
                    clone.classList.remove('opacity-0', 'pointer-events-none');
                    clone.classList.add('split-clone', 'card-dark'); 
                    activeContent.classList.add('card-light'); 
                    scaleWrapper.appendChild(clone);
                }
            } else {
                const clone = scaleWrapper.querySelector('.split-clone');
                if (clone) clone.remove();
                document.querySelectorAll('.usecase-content').forEach(el => el.classList.remove('card-dark', 'card-light'));
            }
        });

        // Export Component
        elements.exportComp?.addEventListener('click', () => {
            const activeContent = elements.sandbox.querySelector('.usecase-content:not(.opacity-0)');
            if (!activeContent) return;
            
            let cssVars = ':root {\n';
            for (let i = 1; i <= 10; i++) {
                cssVars += `  --ui-color-${i}: ${getSandboxHex(i)};\n`;
            }
            cssVars += '}\n';
            
            const html = activeContent.outerHTML;
            const fullExport = `<style>\n${cssVars}</style>\n\n${html}`;
            copyToClipboard(fullExport, 'Component exported to clipboard!');
        });

        // Role Inspector (Tooltip)
        elements.sandbox?.addEventListener('mousemove', (e) => {
            const target = e.target.closest('[data-role]');
            if (target && elements.roleTooltip) {
                const role = target.dataset.role;
                const hex = getComputedStyle(elements.sandbox).getPropertyValue(role).trim().toUpperCase();
                elements.roleTooltip.innerHTML = `<span class="text-indigo-400 mr-2">${role}</span> ${hex}`;
                elements.roleTooltip.classList.remove('hidden');
                
                // Position logic
                const tooltipW = 180;
                let left = e.clientX + 15;
                if (left + tooltipW > window.innerWidth) left = e.clientX - tooltipW - 15;
                
                elements.roleTooltip.style.left = `${left}px`;
                elements.roleTooltip.style.top = `${e.clientY + 15}px`;
            } else if (elements.roleTooltip) {
                elements.roleTooltip.classList.add('hidden');
            }
        });
    }

    function setupFacetedFilters() {
        if (!elements.facetTabs) return;
        elements.facetTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-facet]');
            if (!btn) return;
            document.querySelectorAll('.facet-btn').forEach(b => {
                b.classList.remove('active', 'border-indigo-500', 'bg-indigo-500', 'text-white');
                b.classList.add('border-gray-200', 'dark:border-slate-800', 'text-gray-500');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active', 'border-indigo-500', 'bg-indigo-500', 'text-white');
            btn.classList.remove('border-gray-200', 'dark:border-slate-800', 'text-gray-500');
            btn.setAttribute('aria-selected', 'true');
            activeFacet = btn.dataset.facet;
            renderSubFilters(activeFacet);
            applyFilters();
        });

        if (elements.resetFilters) {
            elements.resetFilters.addEventListener('click', () => {
                activeFacet = 'all';
                activeSubFilter = null;
                searchQuery = '';
                clearColorProximity();
                if (elements.search) elements.search.value = '';
                document.querySelector('[data-facet="all"]')?.click();
            });
        }
    }

    function renderSubFilters(facet) {
        if (!elements.nav || !elements.subFilterContainer) return;
        elements.nav.innerHTML = '';
        activeSubFilter = null;
        if (facet === 'all' || facet === 'recent' || facet === 'favorites') { elements.subFilterContainer.classList.add('hidden'); return; }
        elements.subFilterContainer.classList.remove('hidden');
        let values = [];
        if (facet === 'count') values = [...new Set(allPalettes.map(p => p.count))].sort((a,b)=>a-b);
        if (!values.length) { elements.subFilterContainer.classList.add('hidden'); return; }
        values.forEach((val, i) => {
            const btn = document.createElement('button');
            btn.className = `sub-filter-btn px-4 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${i === 0 ? 'active border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 dark:border-slate-800 text-gray-500'}`;
            btn.textContent = facet === 'count' ? `${val} Colors` : val;
            if (i === 0) activeSubFilter = val;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sub-filter-btn').forEach(b => {
                    b.classList.remove('active', 'border-indigo-500', 'bg-indigo-50', 'text-indigo-600');
                    b.classList.add('border-gray-200', 'dark:border-slate-800', 'text-gray-500');
                });
                btn.classList.add('active', 'border-indigo-500', 'bg-indigo-50', 'text-indigo-600');
                activeSubFilter = val;
                applyFilters();
            });
            elements.nav.appendChild(btn);
        });
    }

    function setColorProximity(hex) {
        colorProximity = hex;
        sortOrder = 'proximity';
        const sortSelect = getEl('sort-order');
        if (sortSelect) sortSelect.value = 'proximity';
        if (elements.colorPickerSwatch) elements.colorPickerSwatch.style.background = hex;
        if (elements.clearColorProximity) elements.clearColorProximity.classList.remove('hidden');
        applyFilters();
    }

    function clearColorProximity() {
        colorProximity = null;
        if (sortOrder === 'proximity') {
            sortOrder = 'name';
            const sortSelect = getEl('sort-order');
            if (sortSelect) sortSelect.value = 'name';
        }
        if (elements.colorPicker) elements.colorPicker.value = '#6366f1';
        if (elements.colorPickerSwatch) elements.colorPickerSwatch.style.background = '#6366f1';
        if (elements.clearColorProximity) elements.clearColorProximity.classList.add('hidden');
    }

    if (elements.colorPicker) {
        elements.colorPicker.addEventListener('input', (e) => setColorProximity(e.target.value));
        elements.colorPicker.addEventListener('change', (e) => setColorProximity(e.target.value));
    }

    if (elements.clearColorProximity) {
        elements.clearColorProximity.addEventListener('click', () => {
            clearColorProximity();
            applyFilters();
        });
    }

    const copyAllColorsBtn = getEl('copy-all-colors');
    if (copyAllColorsBtn) {
        copyAllColorsBtn.addEventListener('click', () => {
            if (!currentPalette) return;
            let css = ':root {\n';
            currentPalette.colors.forEach(c => css += `  --${c.name.toLowerCase().replace(/\s+/g, '-')}: ${c.hex.slice(0, 7)};\n`);
            css += '}';
            copyToClipboard(css, 'All CSS variables copied!');
        });
    }

    const labBgPicker = getEl('lab-bg-picker');
    const labBgSwatch = getEl('lab-bg-swatch');
    const labBgReset  = getEl('lab-bg-reset');
    if (labBgPicker) {
        labBgPicker.addEventListener('input', e => {
            labContrastBg = e.target.value;
            if (labBgSwatch) labBgSwatch.style.background = labContrastBg;
            if (labBgReset) labBgReset.classList.remove('hidden');
            if (currentPalette) renderColorLab(currentPalette);
        });
    }
    if (labBgReset) {
        labBgReset.addEventListener('click', () => {
            labContrastBg = null;
            if (labBgPicker) labBgPicker.value = '#ffffff';
            if (labBgSwatch) labBgSwatch.style.background = '#ffffff';
            labBgReset.classList.add('hidden');
            if (currentPalette) renderColorLab(currentPalette);
        });
    }

    const downloadBtn = getEl('download-png');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!currentPalette) return;
            const colors = currentPalette.colors;
            const swatchW = 160, swatchH = 120, pad = 24, textH = 44, titleH = 56;
            const cols = Math.min(colors.length, 5);
            const rows = Math.ceil(colors.length / cols);
            const canvas = document.createElement('canvas');
            canvas.width  = cols * swatchW + pad * 2;
            canvas.height = titleH + rows * (swatchH + textH) + pad;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#f9fafb';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#111827'; ctx.font = 'bold 18px system-ui';
            ctx.fillText(currentPalette.name, pad, pad + 20);
            ctx.fillStyle = '#6366f1'; ctx.font = 'bold 11px system-ui';
            ctx.fillText(`${colors.length} Colors`, pad, pad + 40);
            colors.forEach((color, i) => {
                const col = i % cols, row = Math.floor(i / cols);
                const x = pad + col * swatchW, y = titleH + row * (swatchH + textH);
                ctx.fillStyle = color.hex.slice(0, 7);
                ctx.fillRect(x + 4, y, swatchW - 12, swatchH);
                ctx.fillStyle = '#374151'; ctx.font = 'bold 10px monospace';
                ctx.fillText(color.hex.slice(0, 7).toUpperCase(), x + 4, y + swatchH + 16);
                ctx.fillStyle = '#9ca3af'; ctx.font = '9px system-ui';
                ctx.fillText(color.name.replace(currentPalette.name, '').trim().slice(0, 22), x + 4, y + swatchH + 30);
            });
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `${currentPalette.id}.png`; a.click();
                URL.revokeObjectURL(url);
                showToast('PNG downloaded!');
            });
        });
    }

    initProTools();

    fetch('palettes.json')
        .then(res => res.json())
        .then(data => {
            allPalettes = data;
            if (elements.libraryCount) {
                elements.libraryCount.textContent = `${data.length} palettes`;
            }
            setupFacetedFilters();
            applyFilters();
        })
        .catch(err => console.error('Showcase Error:', err));
});
