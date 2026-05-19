document.addEventListener('DOMContentLoaded', () => {
    console.log('Showcase: Initializing professional sandbox v2.3.0...');

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
        shuffleBtn: getEl('shuffle-colors'),
        colorPicker: getEl('color-proximity-picker'),
        colorSwatch: getEl('color-picker-swatch'),
        clearColor: getEl('clear-color-proximity')
    };

    // --- State ---
    let allPalettes = [];
    let currentPalette = null;
    let activeFacet = 'all';
    let activeSubFilter = null;
    let searchQuery = '';
    let activeUseCase = 'dashboard';
    let activeDashVariant = 'analytics';
    let favorites = new Set(JSON.parse(localStorage.getItem('sc_favorites') || '[]'));
    let proximityHex = null;

    // --- Core Logic: Search & Filtering ---

    function colorDistance(hex1, hex2) {
        const [r1, g1, b1] = hexToRgb(hex1).map(v => v * 255);
        const [r2, g2, b2] = hexToRgb(hex2).map(v => v * 255);
        return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
    }

    function getPaletteProximity(palette, targetHex) {
        return Math.min(...palette.colors.map(c => colorDistance(c.hex, targetHex)));
    }

    function toggleFavorite(id) {
        if (favorites.has(id)) { favorites.delete(id); } else { favorites.add(id); }
        localStorage.setItem('sc_favorites', JSON.stringify([...favorites]));
        document.querySelectorAll(`.fav-btn[data-id="${id}"]`).forEach(btn => {
            const icon = btn.querySelector('i');
            const isFav = favorites.has(id);
            icon.className = `fa-solid fa-heart text-sm ${isFav ? 'text-red-400' : 'text-gray-200 dark:text-slate-700'}`;
        });
        if (activeFacet === 'favorites') applyFilters();
    }

    function applyFilters() {
        const query = searchQuery.trim().toLowerCase();
        let filtered = allPalettes.filter(p => {
            const matchesFacet =
                activeFacet === 'all' ||
                (activeFacet === 'favorites' && favorites.has(p.id)) ||
                (activeFacet === 'count' && p.count === parseInt(activeSubFilter)) ||
                (activeFacet === 'category' && p.category === activeSubFilter) ||
                (activeFacet === 'mood' && p.tags?.mood?.includes(activeSubFilter)) ||
                (activeFacet === 'aesthetic' && p.tags?.aesthetic?.includes(activeSubFilter)) ||
                (activeFacet === 'color' && getColorGroup(p) === activeSubFilter);

            const matchesSearch =
                !query ||
                p.name.toLowerCase().includes(query) ||
                (p.category && p.category.toLowerCase().includes(query)) ||
                (p.intent && p.intent.toLowerCase().includes(query)) ||
                (p.tags?.mood?.some(m => m.toLowerCase().includes(query))) ||
                (p.tags?.aesthetic?.some(a => a.toLowerCase().includes(query)));

            return matchesFacet && matchesSearch;
        });
        if (proximityHex) {
            filtered = filtered.sort((a, b) => getPaletteProximity(a, proximityHex) - getPaletteProximity(b, proximityHex));
        }
        renderPalettes(filtered);
    }

    // --- Facet & Filter UI ---

    function setupFacetedFilters() {
        if (!elements.facetTabs) return;

        elements.facetTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-facet]');
            if (!btn) return;

            document.querySelectorAll('.facet-btn').forEach(b => {
                b.classList.remove('active', 'border-indigo-500', 'bg-indigo-500', 'text-white');
                b.classList.add('border-gray-200', 'dark:border-slate-800', 'text-gray-500');
            });

            btn.classList.add('active', 'border-indigo-500', 'bg-indigo-500', 'text-white');
            btn.classList.remove('border-gray-200', 'dark:border-slate-800', 'text-gray-500');

            activeFacet = btn.dataset.facet;
            renderSubFilters(activeFacet);
            applyFilters();
        });
    }

    function renderSubFilters(facet) {
        if (!elements.nav || !elements.subFilterContainer) return;
        elements.nav.innerHTML = '';

        if (facet === 'all' || facet === 'favorites') {
            elements.subFilterContainer.classList.add('hidden');
            activeSubFilter = null;
            return;
        }

        elements.subFilterContainer.classList.remove('hidden');

        const COLOR_DOTS = { Red:'#ef4444', Orange:'#f97316', Yellow:'#eab308', Green:'#22c55e', Teal:'#14b8a6', Blue:'#3b82f6', Purple:'#a855f7', Pink:'#ec4899', Neutral:'#9ca3af' };
        const COLOR_ORDER = ['Red','Orange','Yellow','Green','Teal','Blue','Purple','Pink','Neutral'];
        let entries = [];

        if (facet === 'count') {
            const map = {};
            allPalettes.forEach(p => { map[p.count] = (map[p.count] || 0) + 1; });
            entries = [...new Set(allPalettes.map(p => p.count))].sort((a, b) => a - b)
                .map(v => ({ value: v, label: `${v} Colors`, count: map[v] }));
        } else if (facet === 'category') {
            const map = {};
            allPalettes.forEach(p => { if (p.category) map[p.category] = (map[p.category] || 0) + 1; });
            entries = Object.keys(map).sort().map(v => ({ value: v, label: v, count: map[v] }));
        } else if (facet === 'mood') {
            const map = {};
            allPalettes.forEach(p => (p.tags?.mood || []).forEach(m => { map[m] = (map[m] || 0) + 1; }));
            entries = Object.keys(map).sort().map(v => ({ value: v, label: v, count: map[v] }));
        } else if (facet === 'aesthetic') {
            const map = {};
            allPalettes.forEach(p => (p.tags?.aesthetic || []).forEach(a => { map[a] = (map[a] || 0) + 1; }));
            entries = Object.keys(map).sort().map(v => ({ value: v, label: v, count: map[v] }));
        } else if (facet === 'color') {
            const map = {};
            allPalettes.forEach(p => { const g = getColorGroup(p); map[g] = (map[g] || 0) + 1; });
            entries = COLOR_ORDER.filter(v => map[v]).map(v => ({ value: v, label: v, count: map[v], dot: COLOR_DOTS[v] }));
        }

        if (entries.length === 0) { elements.subFilterContainer.classList.add('hidden'); return; }

        entries.forEach((entry, i) => {
            const btn = document.createElement('button');
            btn.className = `sub-filter-btn px-4 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${i === 0 ? 'active border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 dark:border-slate-800 text-gray-500'}`;
            const dot = entry.dot ? `<span style="color:${entry.dot}">● </span>` : '';
            btn.innerHTML = `${dot}${entry.label} <span class="opacity-50 font-normal">(${entry.count})</span>`;
            if (i === 0) activeSubFilter = entry.value;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sub-filter-btn').forEach(b => {
                    b.classList.remove('active', 'border-indigo-500', 'bg-indigo-50', 'text-indigo-600');
                    b.classList.add('border-gray-200', 'dark:border-slate-800', 'text-gray-500');
                });
                btn.classList.add('active', 'border-indigo-500', 'bg-indigo-50', 'text-indigo-600');
                activeSubFilter = entry.value;
                applyFilters();
            });
            elements.nav.appendChild(btn);
        });
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

    function hexToHsl(hex) {
        const clean = (hex || '#000000').replace('#', '').slice(0, 6);
        let r = parseInt(clean.slice(0, 2), 16) / 255;
        let g = parseInt(clean.slice(2, 4), 16) / 255;
        let b = parseInt(clean.slice(4, 6), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return [h * 360, s * 100, l * 100];
    }

    function getColorGroup(palette) {
        const tally = {};
        palette.colors.forEach(c => {
            const [h, s, l] = hexToHsl(c.hex);
            let family;
            if (s < 12 || l < 8 || l > 92) family = 'Neutral';
            else if (h < 20 || h >= 340) family = 'Red';
            else if (h < 45) family = 'Orange';
            else if (h < 70) family = 'Yellow';
            else if (h < 160) family = 'Green';
            else if (h < 200) family = 'Teal';
            else if (h < 260) family = 'Blue';
            else if (h < 300) family = 'Purple';
            else family = 'Pink';
            if (family !== 'Neutral') tally[family] = (tally[family] || 0) + 1;
        });
        const entries = Object.entries(tally);
        return entries.length ? entries.sort((a, b) => b[1] - a[1])[0][0] : 'Neutral';
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

    // --- Rendering ---

    function renderPalettes(palettes) {
        if (!elements.grid) return;
        elements.grid.innerHTML = '';
        
        if (palettes.length === 0) {
            const emptyMsg = activeFacet === 'favorites'
                ? '<i class="fa-solid fa-heart-crack text-4xl"></i><p class="text-xl font-bold">No saved palettes</p><p class="text-sm opacity-60">Click the heart on any card to save it.</p>'
                : '<i class="fa-solid fa-ghost text-4xl"></i><p class="text-xl font-bold">No results found</p>';
            elements.grid.innerHTML = `<div class="col-span-full py-20 text-center opacity-50 flex flex-col items-center gap-4">${emptyMsg}</div>`;
            return;
        }

        palettes.forEach(p => {
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full';

            const swatches = p.colors.map(c =>
                `<div class="swatch-item" style="background-color: ${c.hex}" onclick="event.stopPropagation(); copyToClipboard('${c.hex.slice(0,7)}', 'Copied ${c.hex.slice(0,7)}')"></div>`
            ).join('');

            const allTags = [...(p.tags?.mood || []), ...(p.tags?.aesthetic || [])];
            const tags = allTags.map(t => `<span class="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-tighter">${t}</span>`).join('');
            const isFav = favorites.has(p.id);

            card.innerHTML = `
                <div class="swatch-group mb-4">${swatches}</div>
                <div class="flex-1 mb-6">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-extrabold text-lg text-gray-800 dark:text-gray-100 group-hover:text-indigo-500 transition-colors">${p.name}</h3>
                        <span class="px-2 py-0.5 rounded-md bg-gray-50 dark:bg-slate-800 text-gray-400 text-[10px] font-bold uppercase tracking-wider">${p.count}</span>
                    </div>
                    <p class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">${p.category || 'Collection'}</p>
                    <div class="flex flex-wrap gap-1 mb-4">${tags}</div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 italic">"${p.intent || p.description || ''}"</p>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-800">
                    <div class="flex items-center gap-1">
                        <button class="fav-btn p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" data-id="${p.id}" onclick="event.stopPropagation()" title="${isFav ? 'Remove from saved' : 'Save palette'}">
                            <i class="fa-solid fa-heart text-sm ${isFav ? 'text-red-400' : 'text-gray-200 dark:text-slate-700'}"></i>
                        </button>
                        <button class="quick-copy-btn p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-200 dark:text-slate-700 hover:text-indigo-500 dark:hover:text-indigo-400" data-id="${p.id}" onclick="event.stopPropagation()" title="Copy all HEX values">
                            <i class="fa-solid fa-copy text-sm"></i>
                        </button>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 group-hover:bg-indigo-500 group-hover:text-white transition-all transform group-hover:rotate-45 shadow-sm">
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            `;
            card.addEventListener('click', () => openModal(p));
            elements.grid.appendChild(card);
        });
    }

    // --- Modal & Switcher Logic ---

    function applyPaletteMapping(colors) {
        for (let i = 1; i <= 10; i++) {
            const colorIdx = (i - 1) % colors.length;
            document.documentElement.style.setProperty(`--ui-color-${i}`, colors[colorIdx].hex);
        }
    }

    function shufflePaletteMapping() {
        if (!currentPalette) return;
        const shuffled = [...currentPalette.colors].sort(() => Math.random() - 0.5);
        applyPaletteMapping(shuffled);
        
        if (window.gsap) {
            gsap.fromTo("#sandbox-viewport", { opacity: 0.5, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" });
        }
        showToast('Colors shuffled!');
    }

    function switchDashboardVariant(variant) {
        document.querySelectorAll('.dash-btn').forEach(b => {
            const isActive = b.dataset.dash === variant;
            b.classList.toggle('active', isActive);
            b.classList.toggle('bg-white', isActive);
            b.classList.toggle('shadow-sm', isActive);
            b.classList.toggle('text-gray-900', isActive);
            b.classList.toggle('text-gray-500', !isActive);
        });

        document.querySelectorAll('.dash-view').forEach(view => {
            const isTarget = view.id === 'dash-' + variant;
            view.classList.toggle('opacity-0', !isTarget);
            view.classList.toggle('pointer-events-none', !isTarget);
            if (variant !== 'analytics') {
                view.classList.toggle('absolute', !isTarget);
                view.classList.toggle('inset-0', !isTarget);
            }
        });

        activeDashVariant = variant;

        // GSAP Animations for Dashboard Variants
        if (!window.gsap) return;
        gsap.killTweensOf(".dash-view *");

        if (variant === 'analytics') {
            gsap.from("#dash-analytics .lg\\:col-span-8", { y: 20, opacity: 0, duration: 0.6, ease: "power2.out" });
        } else if (variant === 'crm') {
            gsap.from("#dash-crm .space-y-4 > div", { x: -20, opacity: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" });
        } else if (variant === 'kanban') {
            gsap.from("#dash-kanban .flex-shrink-0", { scale: 0.9, opacity: 0, duration: 0.5, stagger: 0.1, ease: "back.out(1.2)" });
        } else if (variant === 'monitor') {
            gsap.from("#dash-monitor .aspect-square", { scale: 0, opacity: 0, duration: 0.6, stagger: 0.1, ease: "elastic.out(1, 0.5)" });
            gsap.from("#dash-monitor .space-y-2 div", { width: 0, duration: 1, delay: 0.5, ease: "power4.out" });
        } else if (variant === 'profile') {
            gsap.from("#dash-profile .bg-gradient-to-br", { y: -50, opacity: 0, duration: 0.8, ease: "power3.out" });
            gsap.from("#dash-profile .w-24", { scale: 0, duration: 0.6, delay: 0.4, ease: "back.out(2)" });
        }
    }

    function switchUseCase(usecase) {
        document.querySelectorAll('.usecase-btn').forEach(b => {
            const isActive = b.dataset.usecase === usecase;
            b.classList.toggle('active', isActive);
            b.classList.toggle('bg-white', isActive);
            b.classList.toggle('shadow-sm', isActive);
            b.classList.toggle('text-gray-900', isActive);
            b.classList.toggle('text-gray-500', !isActive);
        });

        document.querySelectorAll('.usecase-content').forEach(panel => {
            const isTarget = panel.id === 'case-' + usecase;
            panel.classList.toggle('opacity-0', !isTarget);
            panel.classList.toggle('pointer-events-none', !isTarget);
            if (panel.id === 'case-dashboard') panel.classList.toggle('hidden', !isTarget);
        });

        activeUseCase = usecase;

        // GSAP Animations
        if (!window.gsap) return;
        gsap.killTweensOf(".usecase-content *");

        if (usecase === 'dashboard') {
            switchDashboardVariant(activeDashVariant);
        } else if (usecase === 'social') {
            gsap.from("#social-card", { scale: 0.9, opacity: 0, duration: 0.6, ease: "back.out(1.7)" });
            gsap.from("#case-social .w-14", { scale: 0, opacity: 0, duration: 0.4, stagger: 0.1, ease: "back.out" });
            gsap.to(".fa-heart", { scale: 1.2, duration: 0.6, repeat: -1, yoyo: true, ease: "sine.inOut" });
        } else if (usecase === 'landing') {
            gsap.from("#landing-title", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" });
            gsap.from("#case-landing p, #case-landing button", { y: 20, opacity: 0, duration: 0.6, stagger: 0.1, delay: 0.2, ease: "power2.out" });
            gsap.from("#case-landing .grid > div", { scale: 0.8, opacity: 0, duration: 0.5, stagger: 0.1, delay: 0.5, ease: "back.out" });
        } else if (usecase === 'commerce') {
            gsap.from("#commerce-card", { x: -30, opacity: 0, duration: 0.7, ease: "power3.out" });
            gsap.from("#case-commerce .space-y-3 > div", { x: 30, opacity: 0, duration: 0.5, stagger: 0.1, delay: 0.2, ease: "power2.out" });
        } else if (usecase === 'mobile') {
            gsap.from("#mobile-shell", { y: 50, opacity: 0, duration: 0.8, ease: "power4.out" });
            gsap.from("#mobile-fab", { scale: 0, duration: 0.6, delay: 0.5, ease: "back.out(2)" });
        }
    }

    function openModal(p) {
        currentPalette = p;
        if (elements.title) elements.title.textContent = p.name;
        if (elements.vibe) elements.vibe.textContent = `${p.category} • ${p.count} Colors`;
        if (elements.code) elements.code.textContent = '/* Loading SCSS... */';
        
        if (elements.hero) {
            const hexes = p.colors.map(c => c.hex).join(', ');
            elements.hero.style.background = `radial-gradient(circle at center, ${hexes})`;
        }

        applyPaletteMapping(p.colors);

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
                            <button onclick="copyToClipboard('${hex6}', '${hex6} copied!')" class="text-gray-300 hover:text-indigo-500 transition-colors">
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
        history.replaceState(null, '', '#' + p.id);
    }

    function closeModal() {
        if (!elements.overlay) return;
        elements.overlay.classList.remove('active');
        setTimeout(() => {
            elements.overlay.classList.add('hidden');
            document.body.style.overflow = '';
            if (elements.sim) elements.sim.value = 'none';
            if (elements.modal) elements.modal.style.filter = '';
            gsap.killTweensOf(".usecase-content *, .dash-view *");
        }, 300);
        history.replaceState(null, '', location.pathname + location.search);
    }

    // --- Listeners ---

    if (elements.close) elements.close.addEventListener('click', closeModal);
    if (elements.overlay) elements.overlay.addEventListener('click', (e) => e.target === elements.overlay && closeModal());
    document.addEventListener('keydown', (e) => e.key === 'Escape' && closeModal());

    if (elements.search) {
        elements.search.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            applyFilters();
        });
    }

    if (elements.shuffleBtn) elements.shuffleBtn.addEventListener('click', shufflePaletteMapping);

    if (elements.colorPicker) {
        elements.colorPicker.addEventListener('input', (e) => {
            proximityHex = e.target.value;
            if (elements.colorSwatch) elements.colorSwatch.style.background = e.target.value;
            if (elements.clearColor) elements.clearColor.classList.remove('hidden');
            applyFilters();
        });
    }

    if (elements.clearColor) {
        elements.clearColor.addEventListener('click', () => {
            proximityHex = null;
            if (elements.colorPicker) elements.colorPicker.value = '#6366f1';
            if (elements.colorSwatch) elements.colorSwatch.style.background = '#6366f1';
            elements.clearColor.classList.add('hidden');
            applyFilters();
        });
    }

    document.addEventListener('click', (e) => {
        const useBtn = e.target.closest('.usecase-btn');
        if (useBtn) switchUseCase(useBtn.dataset.usecase);

        const dashBtn = e.target.closest('.dash-btn');
        if (dashBtn) switchDashboardVariant(dashBtn.dataset.dash);

        const favBtn = e.target.closest('.fav-btn');
        if (favBtn) { e.stopPropagation(); toggleFavorite(favBtn.dataset.id); }

        const quickCopyBtn = e.target.closest('.quick-copy-btn');
        if (quickCopyBtn) {
            const palette = allPalettes.find(p => p.id === quickCopyBtn.dataset.id);
            if (palette) {
                const hexList = palette.colors.map(c => c.hex.slice(0, 7).toUpperCase()).join('\n');
                window.copyToClipboard(hexList, `${palette.colors.length} HEX values copied!`);
            }
        }

        const copyBtn = e.target.closest('[data-copy]');
        if (copyBtn && currentPalette) {
            if (copyBtn.dataset.copy === 'full-scss') window.copyToClipboard(currentPalette.source || '', 'Full SCSS copied!');
            if (copyBtn.dataset.copy === 'current') window.copyToClipboard(elements.code?.textContent || '', 'Code copied!');
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
                let tw = 'colors: {\n';
                currentPalette.colors.forEach(c => tw += `  '${c.name.toLowerCase().replace(/\s+/g, '-')}': '${c.hex}',\n`);
                tw += '}';
                elements.code.textContent = tw;
            }
        }
    });

    const modalThemeToggle = document.getElementById('modal-theme-toggle');
    if (modalThemeToggle) {
        modalThemeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
        });
    }

    if (elements.sim && elements.modal) {
        elements.sim.addEventListener('change', (e) => {
            elements.modal.style.filter = e.target.value === 'none' ? '' : `url(#${e.target.value})`;
        });
    }

    if (elements.theme) {
        elements.theme.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.theme = isDark ? 'dark' : 'light';
        });
    }

    // --- Initialization ---

    fetch('palettes.json')
        .then(res => res.json())
        .then(data => {
            allPalettes = data;
            setupFacetedFilters();
            renderPalettes(data);
            if (location.hash) {
                const target = allPalettes.find(p => p.id === location.hash.slice(1));
                if (target) setTimeout(() => openModal(target), 150);
            }
        })
        .catch(err => console.error('Showcase: Failed to load palettes.json', err));

    window.copyToClipboard = (text, msg) => {
        navigator.clipboard.writeText(text).then(() => showToast(msg || 'Copied!'));
    };
});
