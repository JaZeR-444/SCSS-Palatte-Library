document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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
    const toastContainer = document.getElementById('toast-container');

    // State
    let allPalettes = [];
    let currentSourceCode = '';
    let currentPalette = null;
    let currentFilter = 'all';
    let searchQuery = '';

    // --- Core Logic: Search & Filtering ---

    function applyFilters() {
        const filtered = allPalettes.filter(p => {
            const matchesFilter = currentFilter === 'all' || p.count === parseInt(currentFilter);
            const matchesSearch = p.name.toLowerCase().includes(searchQuery) || 
                                (p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery)));
            return matchesFilter && matchesSearch;
        });
        renderPalettes(filtered);
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            applyFilters();
        });
    }

    function handleFilter(e, count) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-indigo-500', 'text-white', 'border-indigo-500');
            btn.classList.add('border-gray-200', 'dark:border-slate-800');
        });
        
        e.target.classList.add('active', 'bg-indigo-500', 'text-white', 'border-indigo-500');
        currentFilter = count;
        applyFilters();
    }

    // --- UI Rendering ---

    function renderPalettes(palettes) {
        paletteGrid.innerHTML = '';
        if (palettes.length === 0) {
            paletteGrid.innerHTML = `
                <div class="col-span-full py-20 text-center opacity-50 flex flex-col items-center gap-4">
                    <i class="fa-solid fa-ghost text-4xl"></i>
                    <p class="font-bold text-xl">No results found</p>
                    <p class="text-sm">Try a different name, tag, or color count.</p>
                </div>`;
            return;
        }

        palettes.forEach(palette => {
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full';
            
            const swatches = palette.colors.map(color => 
                `<div class="swatch-item" style="background-color: ${color.hex}" 
                    title="${color.name}: ${color.hex}" 
                    onclick="event.stopPropagation(); copyToClipboard('${color.hex}', 'HEX ${color.hex} copied!')">
                </div>`
            ).join('');

            const tags = (palette.tags || []).map(t => 
                `<span class="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-tighter">${t}</span>`
            ).join('');

            card.innerHTML = `
                <div class="swatch-group mb-4">${swatches}</div>
                <div class="flex-1 mb-6">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-extrabold text-lg text-gray-800 dark:text-gray-100 group-hover:text-indigo-500 transition-colors">${palette.name}</h3>
                        <span class="px-2 py-0.5 rounded-md bg-gray-50 dark:bg-slate-800 text-gray-400 text-[10px] font-bold uppercase tracking-wider">${palette.count} Colors</span>
                    </div>
                    <div class="flex flex-wrap gap-1 mb-4">${tags}</div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">${palette.description}</p>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-800">
                    <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">View Details</span>
                    <div class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 group-hover:bg-indigo-500 group-hover:text-white transition-all transform group-hover:rotate-45 shadow-sm">
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => openPaletteModal(palette));
            paletteGrid.appendChild(card);
        });
    }

    // --- Modal & Sandbox ---

    function openPaletteModal(palette) {
        currentPalette = palette;
        modalTitle.textContent = palette.name;
        modalVibe.textContent = (palette.tags || []).join(' • ') || 'Thematic Collection';
        codeBlock.textContent = '/* Loading source code... */';
        colorLabGrid.innerHTML = '';

        // Reset Tabs
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active', 'text-indigo-400', 'border-indigo-500', 'bg-indigo-500/5');
            b.classList.add('text-gray-500', 'border-transparent');
        });
        const firstTab = document.querySelector('.tab-btn');
        if (firstTab) firstTab.classList.add('active', 'text-indigo-400', 'border-indigo-500', 'bg-indigo-500/5');

        // Dynamic Hero
        const hexList = palette.colors.map(c => c.hex).join(', ');
        heroGradient.style.background = `radial-gradient(circle at center, ${hexList})`;
        
        // Update Sandbox Custom Properties
        const p = palette.colors[0].hex;
        const s = palette.colors.length > 1 ? palette.colors[1].hex : p;
        const t = palette.colors.length > 2 ? palette.colors[2].hex : s;
        document.documentElement.style.setProperty('--ui-color-1', p);
        document.documentElement.style.setProperty('--ui-color-2', s);
        document.documentElement.style.setProperty('--ui-color-3', t);

        // Populate Color Lab
        const whiteRgb = [1, 1, 1];
        const darkRgb = [15/255, 23/255, 42/255];

        palette.colors.forEach((color, i) => {
            const rgb = hexToRgb(color.hex);
            const contrastWhite = getContrast(rgb, whiteRgb);
            const contrastDark = getContrast(rgb, darkRgb);

            const labCard = document.createElement('div');
            labCard.className = 'bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all group';
            labCard.innerHTML = `
                <div class="w-16 h-16 rounded-xl shadow-inner border border-black/5 flex-shrink-0 cursor-pointer transition-transform active:scale-95" 
                    style="background-color: ${color.hex}"
                    onclick="copyToClipboard('${color.hex}', 'HEX ${color.hex} copied!')"></div>
                <div class="flex-1 overflow-hidden">
                    <h4 class="font-bold text-sm mb-1 truncate">${color.name}</h4>
                    <div class="flex items-center gap-2 mb-2">
                        <code class="text-[10px] text-gray-400 font-mono">${color.hex.toUpperCase()}</code>
                        <button onclick="copyToClipboard('${color.hex}', 'HEX ${color.hex} copied!')" class="text-gray-300 hover:text-indigo-500 transition-colors">
                            <i class="fa-solid fa-copy text-[10px]"></i>
                        </button>
                    </div>
                    <div class="flex gap-1.5 items-center">
                        <div class="flex items-center gap-1">
                             <div class="w-2 h-2 rounded-full bg-white border border-gray-200"></div>
                             ${getA11yBadge(contrastWhite)}
                        </div>
                        <div class="flex items-center gap-1 ml-1">
                             <div class="w-2 h-2 rounded-full bg-slate-900"></div>
                             ${getA11yBadge(contrastDark)}
                        </div>
                    </div>
                </div>
            `;
            colorLabGrid.appendChild(labCard);
            
            if (window.gsap) {
                gsap.from(labCard, { opacity: 0, y: 10, duration: 0.3, delay: 0.2 + (i * 0.05) });
            }
        });

        // Sandbox Animations
        if (window.gsap) {
            gsap.from("#modal-hero h2", { y: 20, opacity: 0, duration: 0.6, ease: "power3.out" });
            gsap.from("#mock-desktop", { y: 30, opacity: 0, duration: 0.8, delay: 0.3, ease: "power3.out" });
            gsap.to("#ui-chart-bar > div", { width: "85%", duration: 1.5, delay: 0.8, ease: "elastic.out(1, 0.3)" });
        }

        // Fetch SCSS
        fetch('../' + palette.path)
            .then(res => res.text())
            .then(text => {
                currentSourceCode = text;
                codeBlock.textContent = text;
            })
            .catch(() => codeBlock.textContent = '/* Error loading source SCSS file. */');

        modalOverlay.classList.remove('hidden');
        setTimeout(() => modalOverlay.classList.add('active'), 10);
        document.body.style.overflow = 'hidden';
    }

    function closePaletteModal() {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            modalOverlay.classList.add('hidden');
            document.body.style.overflow = '';
            visionSimulator.value = 'none';
            modalContent.style.filter = '';
        }, 300);
    }

    closeModal.addEventListener('click', closePaletteModal);
    modalOverlay.addEventListener('click', (e) => e.target === modalOverlay && closePaletteModal());
    document.addEventListener('keydown', (e) => e.key === 'Escape' && closePaletteModal());

    // --- Helper Utilities ---

    function hexToRgb(hex) {
        const cleanHex = hex.replace('#', '').slice(0, 6);
        const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
        const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
        const b = parseInt(cleanHex.slice(4, 6), 16) / 255;
        return [r, g, b];
    }

    function getLuminance([r, g, b]) {
        const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
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
        const toast = document.createElement('div');
        toast.className = 'px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl flex items-center gap-3 transition-all duration-300 pointer-events-auto transform translate-y-10 opacity-0';
        toast.innerHTML = `
            <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-green-400' : 'fa-circle-exclamation text-red-400'}"></i>
            <span class="text-sm font-bold">${message}</span>
        `;
        toastContainer.appendChild(toast);
        
        // Animate In
        setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 10);
        
        // Animate Out
        setTimeout(() => {
            toast.classList.add('translate-y-[-20px]', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    function copyToClipboard(text, message) {
        navigator.clipboard.writeText(text).then(() => showToast(message));
    }

    // --- Data Export Generators ---

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
        let tw = `// Tailwind Config Snippet\ncolors: {\n`;
        palette.colors.forEach(c => {
            const key = c.name.toLowerCase().replace(/\s+/g, '-');
            tw += `  '${key}': '${c.hex}',\n`;
        });
        tw += `}`;
        return tw;
    }

    // --- Event Listeners ---

    // Tab Logic
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            const tab = e.target.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active', 'text-indigo-400', 'border-indigo-500', 'bg-indigo-500/5');
                b.classList.add('text-gray-500', 'border-transparent');
            });
            e.target.classList.add('active', 'text-indigo-400', 'border-indigo-500', 'bg-indigo-500/5');
            
            if (tab === 'scss') codeBlock.textContent = currentSourceCode;
            if (tab === 'css') codeBlock.textContent = generateCSSVars(currentPalette);
            if (tab === 'tailwind') codeBlock.textContent = generateTailwind(currentPalette);
        }
    });

    // Copy/Export Buttons
    document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.copy;
            if (type === 'full-scss') {
                copyToClipboard(currentSourceCode, 'Full SCSS source copied!');
            } else {
                copyToClipboard(codeBlock.textContent, 'Snippet copied!');
            }
        });
    });

    // Vision Simulator
    visionSimulator.addEventListener('change', (e) => {
        const val = e.target.value;
        modalContent.style.filter = val === 'none' ? '' : `url(#${val})`;
    });

    // Theme Toggle
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    // --- Initialization ---

    fetch('palettes.json')
        .then(res => res.json())
        .then(data => {
            allPalettes = data;
            
            // Build count filters
            const counts = [...new Set(data.map(p => p.count))].sort((a, b) => a - b);
            counts.forEach(count => {
                const btn = document.createElement('button');
                btn.className = 'filter-btn px-4 py-1.5 rounded-full text-sm font-medium border border-gray-200 dark:border-slate-800 hover:border-indigo-500 transition-all whitespace-nowrap';
                btn.textContent = `${count} Colors`;
                btn.addEventListener('click', (e) => handleFilter(e, count));
                filterNav.appendChild(btn);
            });

            document.querySelector('[data-filter="all"]').addEventListener('click', (e) => handleFilter(e, 'all'));
            
            renderPalettes(data);
        })
        .catch(err => console.error('Error loading palettes:', err));

    // Global helper for inline onclick
    window.copyToClipboard = copyToClipboard;
});
