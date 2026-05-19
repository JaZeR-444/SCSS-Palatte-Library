document.addEventListener('DOMContentLoaded', () => {
    const paletteGrid = document.getElementById('palette-grid');
    const filterNav = document.getElementById('filter-nav');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const closeModal = document.getElementById('close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalVibe = document.getElementById('modal-vibe');
    const heroGradient = document.getElementById('hero-gradient');
    const colorLabGrid = document.getElementById('color-lab-grid');
    const codeBlock = document.getElementById('code-block');
    const themeToggle = document.getElementById('theme-toggle');
    const visionSimulator = document.getElementById('vision-simulator');
    const searchInput = document.getElementById('palette-search');

    let allPalettes = [];
    let currentSourceCode = '';
    let currentPalette = null;
    let currentFilter = 'all';

    // Theme Management
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }

    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    // Inject SVG filters for color blindness
    const svgFilters = `
        <svg style="display:none">
            <defs>
                <filter id="protanopia">
                    <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0"/>
                </filter>
                <filter id="deuteranopia">
                    <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0"/>
                </filter>
                <filter id="tritanopia">
                    <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0"/>
                </filter>
                <filter id="achromatopsia">
                    <feColorMatrix type="matrix" values="0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 1, 0"/>
                </filter>
            </defs>
        </svg>
    `;
    document.body.insertAdjacentHTML('beforeend', svgFilters);

    visionSimulator.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'none') {
            gsap.to(modalContent, { filter: 'none', duration: 0.5 });
        } else {
            modalContent.style.filter = `url(#${val})`;
        }
    });

    // Search & Filtering
    function filterAndRender() {
        const searchTerm = searchInput.value.toLowerCase();
        const filtered = allPalettes.filter(p => {
            const matchesFilter = currentFilter === 'all' || p.count === parseInt(currentFilter);
            const matchesSearch = p.name.toLowerCase().includes(searchTerm) || 
                                p.colors.some(c => c.name.toLowerCase().includes(searchTerm));
            return matchesFilter && matchesSearch;
        });
        renderPalettes(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', filterAndRender);

    function handleFilter(e, count) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-indigo-500', 'text-white', 'border-indigo-500');
            btn.classList.add('border-gray-200', 'dark:border-slate-800');
        });
        
        e.target.classList.add('active', 'bg-indigo-500', 'text-white', 'border-indigo-500');
        currentFilter = count;
        filterAndRender();
    }

    // Toast Logic
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl flex items-center gap-3 transform translate-y-10 opacity-0 transition-all duration-300 pointer-events-auto';
        toast.innerHTML = `
            <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-green-400' : 'fa-circle-exclamation text-red-400'}"></i>
            <span class="text-sm font-bold">${message}</span>
        `;
        container.appendChild(toast);
        
        gsap.to(toast, { y: 0, opacity: 1, duration: 0.4, ease: "back.out" });
        
        setTimeout(() => {
            gsap.to(toast, { y: 20, opacity: 0, duration: 0.3, onComplete: () => toast.remove() });
        }, 2000);
    }

    // Accessibility Math
    function hexToRgb(hex) {
        const cleanHex = hex.replace('#', '').slice(0, 6);
        const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
        const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
        const b = parseInt(cleanHex.slice(4, 6), 16) / 255;
        return [r, g, b];
    }

    function getLuminance([r, g, b]) {
        const a = [r, g, b].map(v => {
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
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

    // Load Palettes
    fetch('palettes.json')
        .then(response => response.json())
        .then(data => {
            allPalettes = data;
            setupFilters(data);
            renderPalettes(data);
        })
        .catch(err => console.error('Error loading palettes:', err));

    function setupFilters(data) {
        const counts = [...new Set(data.map(p => p.count))].sort((a, b) => a - b);
        counts.forEach(count => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn px-4 py-1.5 rounded-full text-sm font-medium border border-gray-200 dark:border-slate-800 hover:border-indigo-500 transition-all whitespace-nowrap';
            btn.textContent = `${count} Colors`;
            btn.addEventListener('click', (e) => handleFilter(e, count));
            filterNav.appendChild(btn);
        });
    }

    document.querySelector('[data-filter="all"]').addEventListener('click', (e) => handleFilter(e, 'all'));

    function renderPalettes(palettes) {
        paletteGrid.innerHTML = '';
        if (palettes.length === 0) {
            paletteGrid.innerHTML = '<div class="col-span-full py-20 text-center opacity-50 flex flex-col items-center gap-4"><i class="fa-solid fa-ghost text-4xl"></i><p class="font-bold">No results found...</p></div>';
            return;
        }

        palettes.forEach(palette => {
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full';
            
            const swatches = palette.colors.map(color => 
                `<div class="swatch-item" style="background-color: ${color.hex}" title="${color.name}: ${color.hex}" onclick="event.stopPropagation(); navigator.clipboard.writeText('${color.hex}'); showToast('Copied ${color.hex}')">
                    <span class="swatch-tooltip text-[10px] font-bold absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">${color.name}</span>
                </div>`
            ).join('');

            card.innerHTML = `
                <div class="swatch-group mb-4">${swatches}</div>
                <div class="flex-1 mb-6">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-extrabold text-lg text-gray-800 dark:text-gray-100 group-hover:text-indigo-500 transition-colors">${palette.name}</h3>
                        <span class="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">${palette.count} Colors</span>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">${palette.description}</p>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-800">
                    <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Click for Info</span>
                    <div class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 group-hover:bg-indigo-500 group-hover:text-white transition-all transform group-hover:rotate-45 shadow-sm">
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => openPaletteModal(palette));
            paletteGrid.appendChild(card);
        });
    }

    function getAesthetic(palette) {
        if (palette.name.includes('Neon') || palette.name.includes('Cyber')) return 'Cyberpunk / Tech';
        if (palette.name.includes('Forest') || palette.name.includes('Nature')) return 'Organic / Natural';
        if (palette.name.includes('Sunset') || palette.name.includes('Flare')) return 'Vibrant / Warm';
        if (palette.name.includes('Ocean') || palette.name.includes('Arctic')) return 'Cool / Refreshing';
        if (palette.name.includes('Minimalist') || palette.name.includes('Monochrome')) return 'Modern / Minimal';
        return 'Thematic Collection';
    }

    function animateSandbox(palette) {
        const primary = palette.colors[0].hex;
        const secondary = palette.colors.length > 2 ? palette.colors[1].hex : palette.colors[palette.colors.length - 1].hex;
        const tertiary = palette.colors.length > 3 ? palette.colors[2].hex : primary;

        // Apply dynamic gradients to sandbox elements
        const uiGradient = `linear-gradient(135deg, ${primary}, ${secondary})`;
        const header = document.getElementById('ui-header');
        const sidebar = document.getElementById('ui-sidebar');
        const mobileCard = document.getElementById('ui-card-mobile');

        if (header) header.style.background = uiGradient;
        if (sidebar) sidebar.style.background = primary;
        if (mobileCard) mobileCard.style.borderTop = `4px solid ${primary}`;
        
        // GSAP Animations
        gsap.from("#mock-desktop", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" });
        gsap.from("#ui-card-mobile", { x: 20, opacity: 0, duration: 0.8, delay: 0.2, ease: "power3.out" });
        
        // Animated chart bar
        gsap.to("#ui-chart-bar > div", { 
            width: "85%", 
            duration: 1.5, 
            ease: "elastic.out(1, 0.3)",
            backgroundColor: secondary
        });

        // Floating mobile card
        gsap.to("#ui-card-mobile", {
            y: -10,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Pulse effect for buttons
        gsap.to("#ui-btn-main", {
            boxShadow: `0 0 20px ${primary}44`,
            duration: 1,
            repeat: -1,
            yoyo: true
        });
    }

    function openPaletteModal(palette) {
        currentPalette = palette;
        modalTitle.textContent = palette.name;
        modalVibe.textContent = getAesthetic(palette);
        codeBlock.textContent = '/* Fetching SCSS source... */';
        colorLabGrid.innerHTML = '';

        // Reset Tabs
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active', 'border-indigo-500', 'bg-indigo-500/5', 'text-indigo-400'));
        const scssTab = document.querySelector('[data-tab="scss"]');
        if (scssTab) scssTab.classList.add('active', 'border-indigo-500', 'bg-indigo-500/5', 'text-indigo-400');

        // Hero Gradient with GSAP
        const hexList = palette.colors.map(c => c.hex).join(', ');
        gsap.to(heroGradient, {
            background: `radial-gradient(circle at center, ${hexList})`,
            duration: 1,
            ease: "power2.inOut"
        });

        // Sandbox UI
        const primary = palette.colors[0].hex;
        const secondary = palette.colors.length > 2 ? palette.colors[1].hex : palette.colors[palette.colors.length - 1].hex;
        const tertiary = palette.colors.length > 3 ? palette.colors[2].hex : primary;

        document.documentElement.style.setProperty('--ui-color-1', primary);
        document.documentElement.style.setProperty('--ui-color-2', secondary);
        document.documentElement.style.setProperty('--ui-color-3', tertiary);

        animateSandbox(palette);

        // Color Lab
        const whiteRgb = [1, 1, 1];
        const darkRgb = [15/255, 23/255, 42/255]; // slate-900

        palette.colors.forEach((color, i) => {
            const rgb = hexToRgb(color.hex);
            const contrastWhite = getContrast(rgb, whiteRgb);
            const contrastDark = getContrast(rgb, darkRgb);

            const labCard = document.createElement('div');
            labCard.className = 'bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all group';
            labCard.innerHTML = `
                <div class="w-16 h-16 rounded-xl shadow-inner border border-black/5 flex-shrink-0" style="background-color: ${color.hex}"></div>
                <div class="flex-1 overflow-hidden">
                    <h4 class="font-bold text-sm mb-1 truncate">${color.name}</h4>
                    <div class="flex items-center gap-2 mb-2">
                        <code class="text-[10px] text-gray-400 font-mono">${color.hex.toUpperCase()}</code>
                        <button onclick="navigator.clipboard.writeText('${color.hex}'); showToast('Copied ${color.hex}')" class="text-gray-300 hover:text-indigo-500 transition-colors">
                            <i class="fa-solid fa-copy text-[10px]"></i>
                        </button>
                    </div>
                    <div class="flex gap-1.5 items-center">
                        <div class="flex items-center gap-1">
                             <div class="w-2 h-2 rounded-full bg-white border border-gray-200 shadow-xs"></div>
                             ${getA11yBadge(contrastWhite)}
                        </div>
                        <div class="flex items-center gap-1 ml-1">
                             <div class="w-2 h-2 rounded-full bg-slate-900 shadow-xs"></div>
                             ${getA11yBadge(contrastDark)}
                        </div>
                    </div>
                </div>
            `;
            colorLabGrid.appendChild(labCard);
            gsap.from(labCard, { opacity: 0, y: 10, duration: 0.4, delay: i * 0.05 });
        });

        // Fetch Code
        fetch('../' + palette.path)
            .then(res => res.text())
            .then(text => {
                currentSourceCode = text;
                codeBlock.textContent = text;
            })
            .catch(() => {
                // Fallback if fetch fails
                codeBlock.textContent = `/* SCSS Variables */\n` + 
                    palette.colors.map((c, i) => `$color-${i+1}: ${c.hex};`).join('\n');
            });

        modalOverlay.classList.remove('hidden');
        gsap.to(modalOverlay, { opacity: 1, duration: 0.3 });
        gsap.to(modalContent, { scale: 1, duration: 0.5, ease: "back.out(1.7)" });
        document.body.style.overflow = 'hidden';
    }

    function closePaletteModal() {
        gsap.to(modalContent, { scale: 0.95, duration: 0.3 });
        gsap.to(modalOverlay, { 
            opacity: 0, 
            duration: 0.3, 
            onComplete: () => {
                modalOverlay.classList.add('hidden');
                document.body.style.overflow = '';
                // Reset vision simulator on close
                visionSimulator.value = 'none';
                modalContent.style.filter = '';
                // Kill sandbox animations
                gsap.killTweensOf("#ui-card-mobile");
                gsap.killTweensOf("#ui-btn-main");
            }
        });
    }

    closeModal.addEventListener('click', closePaletteModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closePaletteModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
            closePaletteModal();
        }
    });

    // Tab Logic
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            const tab = e.target.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active', 'border-indigo-500', 'bg-indigo-500/5', 'text-indigo-400');
                b.classList.add('border-transparent', 'text-gray-500');
            });
            e.target.classList.add('active', 'border-indigo-500', 'bg-indigo-500/5', 'text-indigo-400');
            e.target.classList.remove('border-transparent', 'text-gray-500');

            if (tab === 'scss') codeBlock.textContent = currentSourceCode;
            if (tab === 'css') codeBlock.textContent = generateCSSVars(currentPalette);
            if (tab === 'tailwind') codeBlock.textContent = generateTailwind(currentPalette);
        }
    });

    // Download Logic
    function downloadSCSS() {
        if (!currentPalette) return;
        const blob = new Blob([currentSourceCode], { type: 'text/css' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentPalette.name}.scss`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    function generateCSSVars(palette) {
        let css = `:root {\n`;
        palette.colors.forEach(c => {
            const varName = c.name.toLowerCase().replace(/\s+/g, '-');
            css += `  --${varName}: ${c.hex};\n`;
        });
        css += `}`;
        return css;
    }

    function generateTailwind(palette) {
        let tw = `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n`;
        palette.colors.forEach(c => {
            const key = c.name.toLowerCase().replace(/\s+/g, '-');
            tw += `        '${key}': '${c.hex}',\n`;
        });
        tw += `      }\n    }\n  }\n}`;
        return tw;
    }

    document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.copy;
            let text = '';
            
            if (type === 'download' || type === 'full-scss') {
                downloadSCSS();
                showToast('Downloading SCSS file...');
                return;
            }

            text = codeBlock.textContent;
            
            navigator.clipboard.writeText(text).then(() => {
                showToast('Code copied to clipboard!');
            });
        });
    });

    // Global showToast for inline onclicks
    window.showToast = showToast;
});
