document.addEventListener('DOMContentLoaded', () => {
    console.log('Showcase: Initializing stable v2.0.1...');

    // --- DOM Elements with Null Safety ---
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
        toast: getEl('toast-container')
    };

    // Verify critical elements
    for (const [name, el] of Object.entries(elements)) {
        if (!el && name !== 'search' && name !== 'sim') {
            console.error(`Showcase Error: Critical element '${name}' not found in DOM.`);
        }
    }

    // --- State ---
    let allPalettes = [];
    let currentPalette = null;
    let activeFilter = 'all';
    let searchQuery = '';

    // --- Filtering ---

    function applyFilters() {
        let filtered = allPalettes;
        if (activeFilter !== 'all') filtered = filtered.filter(p => p.count === activeFilter);
        if (searchQuery) filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(searchQuery) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery)))
        );
        renderPalettes(filtered);
    }

    // --- Utilities ---

    function hexToRgb(hex) {
        try {
            const clean = (hex || '#000000').replace('#', '').slice(0, 6);
            const r = parseInt(clean.slice(0, 2), 16) / 255 || 0;
            const g = parseInt(clean.slice(2, 4), 16) / 255 || 0;
            const b = parseInt(clean.slice(4, 6), 16) / 255 || 0;
            return [r, g, b];
        } catch (e) {
            return [0, 0, 0];
        }
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
        toast.className = 'px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl flex items-center gap-3 transition-all duration-300 pointer-events-auto transform translate-y-10 opacity-0';
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

    window.copyToClipboard = (text, msg) => {
        navigator.clipboard.writeText(text).then(() => showToast(msg || 'Copied!'));
    };

    // --- Rendering ---

    function renderPalettes(palettes) {
        if (!elements.grid) return;
        elements.grid.innerHTML = '';
        
        if (palettes.length === 0) {
            elements.grid.innerHTML = '<div class="col-span-full py-20 text-center opacity-50"><p class="text-xl font-bold">No palettes found</p></div>';
            return;
        }

        palettes.forEach(p => {
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full';
            
            const swatches = p.colors.map(c => 
                `<div class="swatch-item" style="background-color: ${c.hex}" onclick="event.stopPropagation(); copyToClipboard('${c.hex}', 'Copied ${c.hex}')"></div>`
            ).join('');

            const tags = (p.tags || []).map(t => `<span class="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-tighter">${t}</span>`).join('');

            card.innerHTML = `
                <div class="swatch-group mb-4">${swatches}</div>
                <div class="flex-1 mb-6">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-extrabold text-lg text-gray-800 dark:text-gray-100 group-hover:text-indigo-500 transition-colors">${p.name}</h3>
                        <span class="px-2 py-0.5 rounded-md bg-gray-50 dark:bg-slate-800 text-gray-400 text-[10px] font-bold uppercase tracking-wider">${p.count}</span>
                    </div>
                    <div class="flex flex-wrap gap-1 mb-4">${tags}</div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">${p.description}</p>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-800">
                    <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Details</span>
                    <div class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 group-hover:bg-indigo-500 group-hover:text-white transition-all transform group-hover:rotate-45 shadow-sm">
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            `;
            card.addEventListener('click', () => openModal(p));
            elements.grid.appendChild(card);
        });
    }

    // --- Modal Logic ---

    function openModal(p) {
        currentPalette = p;
        if (elements.title) elements.title.textContent = p.name;
        if (elements.vibe) elements.vibe.textContent = (p.tags || []).join(' • ') || 'Collection';
        if (elements.code) elements.code.textContent = '/* Loading SCSS... */';
        
        // Hero
        if (elements.hero) {
            const hexes = p.colors.map(c => c.hex).join(', ');
            elements.hero.style.background = `radial-gradient(circle at center, ${hexes})`;
        }

        // Sandbox CSS Vars (Enhanced for 10-color mapping)
        const colors = p.colors;
        for (let i = 1; i <= 10; i++) {
            // Map index to color, looping if palette is smaller than 10
            const colorIdx = (i - 1) % colors.length;
            document.documentElement.style.setProperty(`--ui-color-${i}`, colors[colorIdx].hex);
        }

        // --- RENDER COLOR LAB (Critical Section) ---
        if (elements.lab) {
            elements.lab.innerHTML = '';
            const white = [1, 1, 1];
            const dark = [15/255, 23/255, 42/255];

            p.colors.forEach((color, i) => {
                try {
                    const rgb = hexToRgb(color.hex);
                    const contrastW = getContrast(rgb, white);
                    const contrastD = getContrast(rgb, dark);
                    const hex6 = color.hex.slice(0, 7).toUpperCase();
                    const textOnSwatch = contrastW >= contrastD ? '#ffffff' : '#0f172a';

                    const labCard = document.createElement('div');
                    labCard.className = 'bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all group';
                    labCard.innerHTML = `
                        <div class="w-16 h-16 rounded-xl shadow-inner border border-black/5 flex-shrink-0 cursor-pointer transition-transform active:scale-95 flex items-center justify-center"
                            style="background-color: ${color.hex}"
                            onclick="copyToClipboard('${hex6}', '${hex6} copied!')">
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
                    
                    if (window.gsap) {
                        gsap.from(labCard, { opacity: 0, y: 10, duration: 0.3, delay: 0.1 + (i * 0.05) });
                    }
                } catch (err) {
                    console.error('Error rendering Color Lab card:', err);
                }
            });
        }

        // Reset sandbox to dashboard view
        switchUseCase('dashboard');

        // Fetch SCSS
        fetch('../' + p.path)
            .then(res => res.text())
            .then(text => {
                currentPalette.source = text;
                if (elements.code) elements.code.textContent = text;
            })
            .catch(() => { if (elements.code) elements.code.textContent = '/* Error loading file */'; });

        // Show Modal
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
        }, 300);
    }

    // --- Initialization & Listeners ---

    if (elements.close) elements.close.addEventListener('click', closeModal);
    if (elements.overlay) elements.overlay.addEventListener('click', (e) => e.target === elements.overlay && closeModal());
    document.addEventListener('keydown', (e) => e.key === 'Escape' && closeModal());

    if (elements.search) {
        elements.search.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            applyFilters();
        });
    }

    // Use-case switcher
    function switchUseCase(usecase) {
        document.querySelectorAll('.usecase-btn').forEach(b => {
            const isActive = b.dataset.usecase === usecase;
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
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.usecase-btn');
        if (btn) switchUseCase(btn.dataset.usecase);
    });

    // "All" filter button
    const allFilterBtn = document.querySelector('[data-filter="all"]');
    if (allFilterBtn) {
        allFilterBtn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active', 'bg-indigo-500', 'text-white', 'bg-indigo-50', 'text-indigo-600', 'border-indigo-500');
                b.classList.add('border-gray-200', 'dark:border-slate-800');
            });
            allFilterBtn.classList.remove('border-gray-200', 'dark:border-slate-800');
            allFilterBtn.classList.add('active', 'bg-indigo-500', 'text-white', 'border-indigo-500');
            activeFilter = 'all';
            applyFilters();
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

    // Tabs
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            const tab = e.target.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active', 'text-indigo-400', 'border-indigo-500', 'bg-indigo-500/5');
                b.classList.add('text-gray-500', 'border-transparent');
            });
            e.target.classList.add('active', 'text-indigo-400', 'border-indigo-500', 'bg-indigo-500/5');
            
            if (currentPalette && elements.code) {
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
        }
    });

    // Copy Current Code
    const copyBtn = document.querySelector('[data-copy="current"]');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            if (elements.code) copyToClipboard(elements.code.textContent, 'Code copied!');
        });
    }

    // Load Data
    fetch('palettes.json')
        .then(res => res.json())
        .then(data => {
            allPalettes = data;
            
            // Build count filters
            if (elements.nav) {
                const counts = [...new Set(data.map(p => p.count))].sort((a, b) => a - b);
                counts.forEach(count => {
                    const btn = document.createElement('button');
                    btn.className = 'filter-btn px-4 py-1.5 rounded-full text-sm font-medium border border-gray-200 dark:border-slate-800 hover:border-indigo-500 transition-all whitespace-nowrap';
                    btn.textContent = `${count} Colors`;
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.filter-btn').forEach(b => {
                            b.classList.remove('active', 'bg-indigo-500', 'text-white', 'bg-indigo-50', 'text-indigo-600', 'border-indigo-500');
                            b.classList.add('border-gray-200', 'dark:border-slate-800');
                        });
                        btn.classList.remove('border-gray-200', 'dark:border-slate-800');
                        btn.classList.add('active', 'bg-indigo-50', 'text-indigo-600', 'border-indigo-500');
                        activeFilter = count;
                        applyFilters();
                    });
                    elements.nav.appendChild(btn);
                });
            }

            renderPalettes(data);
            console.log('Showcase: Successfully loaded palettes.');
        })
        .catch(err => {
            console.error('Showcase: Failed to load palettes.json', err);
            if (elements.grid) elements.grid.innerHTML = '<div class="col-span-full py-20 text-center text-red-500 font-bold">Failed to load palettes data. Check browser console.</div>';
        });
});
