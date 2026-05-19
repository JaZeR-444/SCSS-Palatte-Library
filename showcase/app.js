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
        libraryCount: getEl('library-count')
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
    let recentIds = loadJson('paletteShowcase.recentIds', []);
    let savedIds = loadJson('paletteShowcase.favorites', []);
    let colorProximity = null;
    let sortOrder = 'name';

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

    function renderPalettes(palettes) {
        if (!elements.grid) return;
        elements.grid.innerHTML = '';
        
        if (palettes.length === 0) {
            elements.grid.innerHTML = '<div class="col-span-full py-20 text-center opacity-50 flex flex-col items-center gap-4"><i class="fa-solid fa-ghost text-4xl"></i><p class="text-xl font-bold">No results found</p></div>';
            return;
        }

        palettes.forEach(p => {
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full';
            card.dataset.id = p.id;
            
            const swatches = p.colors.map(c => 
                `<div class="swatch-item" style="background-color: ${c.hex}" onclick="event.stopPropagation(); copyToClipboard('${c.hex}', 'Copied ${c.hex}')"></div>`
            ).join('');

            const allTags = [
                ...(p.tags && p.tags.mood ? p.tags.mood : []),
                ...(p.tags && p.tags.aesthetic ? p.tags.aesthetic : [])
            ];
            const tags = allTags.map(t => `<span class="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-tighter">${t}</span>`).join('');

            card.innerHTML = `
                <div class="swatch-group mb-4">${swatches}</div>
                <div class="flex-1 mb-6">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-extrabold text-lg text-gray-800 dark:text-gray-100 group-hover:text-indigo-500 transition-colors">${p.name}</h3>
                        <span class="px-2 py-0.5 rounded-md bg-gray-50 dark:bg-slate-800 text-gray-400 text-[10px] font-bold uppercase tracking-wider">${p.count}</span>
                    </div>
                    <p class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">${p.category || 'Collection'}</p>
                    <div class="flex flex-wrap gap-1 mb-4">${tags}</div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 italic">"${p.intent || ''}"</p>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-800">
                    <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-xs">v1.0.0</span>
                    <div class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 group-hover:bg-indigo-500 group-hover:text-white transition-all transform group-hover:rotate-45 shadow-sm">
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>
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
        if (elements.vibe) elements.vibe.textContent = `${p.category} • ${p.count} Colors`;
        if (elements.code) elements.code.textContent = '/* Loading SCSS... */';
        
        if (elements.hero) {
            const hexes = p.colors.map(c => c.hex).join(', ');
            elements.hero.style.background = `radial-gradient(circle at center, ${hexes})`;
        }

        applyPaletteMapping(p.colors, 'modal-content');
        applyPaletteMapping(p.colors, 'section-sandbox');
        applyPaletteMapping(p.colors, 'section-typography');
        applyPaletteMapping(p.colors, 'section-iconography');

        // Color Lab
        if (elements.lab) {
            elements.lab.innerHTML = '';
            const white = [1, 1, 1];
            const dark = [15/255, 23/255, 42/255];

            p.colors.forEach((color, i) => {
                const rgb = hexToRgb(color.hex);
                const contrastW = getContrast(rgb, white);
                const contrastD = getContrast(rgb, dark);
                const hex6 = color.hex.slice(0, 7).toUpperCase();
                const textOnSwatch = contrastW >= contrastD ? '#ffffff' : '#0f172a';

                const labCard = document.createElement('div');
                labCard.className = 'bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center gap-4 shadow border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all group';
                labCard.innerHTML = `
                    <div class="w-16 h-16 rounded-xl shadow-inner border border-black/5 flex-shrink-0 cursor-pointer transition-transform active:scale-95 flex items-center justify-center"
                        style="background-color: ${color.hex}"
                        onclick="copyToClipboard('${hex6}', 'HEX ${hex6} copied!')">
                        <span style="color: ${textOnSwatch}" class="text-xs font-black select-none opacity-80">Aa</span>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <h4 class="font-bold text-sm mb-1 truncate">${color.name}</h4>
                        <div class="flex items-center gap-2 mb-3">
                            <code class="text-[10px] text-gray-400 font-mono">${hex6}</code>
                            <button onclick="copyToClipboard('${hex6}', 'HEX ${hex6} copied!')" class="text-gray-300 hover:text-indigo-500 transition-colors">
                                <i class="fa-solid fa-copy text-[10px]"></i>
                            </button>
                        </div>
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
                        </div>
                    </div>
                `;
                elements.lab.appendChild(labCard);
            });
        }

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
                let tw = 'colors: {\n';
                currentPalette.colors.forEach(c => tw += `  '${c.name.toLowerCase().replace(/\s+/g, '-')}': '${c.hex}',\n`);
                tw += '}';
                elements.code.textContent = tw;
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
            target.style.setProperty(`--ui-color-${i}`, colors[colorIdx].hex);
        }
        if (targetId === 'section-sandbox') {
            renderSandboxRoleChips();
            updateContrastStatus();
        }
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
                    onclick="copyToClipboard('${hex.slice(0, 7).toUpperCase()}', '${role} color copied')">
                    <span class="block h-8 rounded-lg mb-2 border border-black/5" style="background:${hex}; color:${getReadableTextColor(hex)}">
                        <span class="sr-only">${role}</span>
                    </span>
                    <span class="block text-[9px] font-black uppercase tracking-widest text-gray-400">${role}</span>
                    <code class="block truncate text-[10px] font-bold text-gray-700 dark:text-gray-200">${hex.slice(0, 7).toUpperCase()}</code>
                </button>
            `;
        }).join('');
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
