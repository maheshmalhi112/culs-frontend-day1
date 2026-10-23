/**
 * The Little Herb Garden - Single Page Application
 * Plain JavaScript + the DOM. No libraries, no frameworks.
 *
 *  - Hash router:   (empty) = catalog, #about, #visit, #<herb-id> = herb page
 *  - Herb data:     fetched from data/<herb-id>.json
 *  - Smart filter, comparison tool, quiz, basket, origin map, Herb Guide chat and accessibility settings
 *  - Footer slider: testimonials loaded from data/testimonials.json
 *  - Accessibility: focus moves to the page heading on navigation, the page
 *                   title and a live region announce the change.
 */

// Master catalog of available herbs (cards on the home page, search, random herb)
const HERB_REGISTRY = [
    { id: 'basil', name: 'Basil', botanicalName: 'Ocimum basilicum', category: 'Culinary', icon: 'sprout', summary: 'An aromatic herb with sweet, warm, clove-like flavor essential in Italian cuisine.' },
    { id: 'mint', name: 'Mint', botanicalName: 'Mentha spicata', category: 'Culinary / Medicinal', icon: 'leaf', summary: 'Refreshing and vigorous herb widely used in teas, cocktails, and desserts.' },
    { id: 'lavender', name: 'Lavender', botanicalName: 'Lavandula angustifolia', category: 'Aromatic / Medicinal', icon: 'flower', summary: 'Calming purple herb celebrated for its soothing scent and stress-relief properties.' },
    { id: 'rosemary', name: 'Rosemary', botanicalName: 'Salvia rosmarinus', category: 'Culinary / Medicinal', icon: 'tree', summary: 'Fragrant evergreen herb with needle-like leaves, rich in antioxidants.' },
    { id: 'thyme', name: 'Thyme', botanicalName: 'Thymus vulgaris', category: 'Culinary', icon: 'sprout', summary: 'Versatile culinary staple with delicate leaves and subtle earthy flavor.' },
    { id: 'sage', name: 'Sage', botanicalName: 'Salvia officinalis', category: 'Culinary / Medicinal', icon: 'leaf', summary: 'Soft, silvery-green leaves with a warm, peppery flavor, loved with roasts and brown butter.' },
    { id: 'chamomile', name: 'Chamomile', botanicalName: 'Matricaria chamomilla', category: 'Medicinal / Tea', icon: 'flower', summary: 'Daisy-like flowers with an apple scent, brewed into a gentle and calming tea.' },
    { id: 'chives', name: 'Chives', botanicalName: 'Allium schoenoprasum', category: 'Culinary', icon: 'sprout', summary: 'Mild onion-flavored blades and edible purple flowers for eggs, potatoes and dips.' }
];

const SITE_TITLE = 'The Little Herb Garden';
const VISIT_TEXT = 'The garden is open every day from sunrise to sunset. Bring a friend, rub a leaf between your fingers, and leave the bees alone.';

// Application state
let currentSearchQuery = '';
let activeFilters = {};          // for example { medicinal: ['Digestion'], flavor: ['Minty'] }
let routeToken = 0;              // ignores late results when the visitor has already moved on
let firstRender = true;          // do not steal focus on the very first page load
const herbCache = {};            // full herb data, loaded from data/<id>.json
let compareSelection = ['', ''];

const STORAGE_KEYS = {
    basket: 'littleHerbGarden.basket',
    theme: 'theme',
    a11y: 'littleHerbGarden.a11y',
    quizBest: 'littleHerbGarden.quizBest'
};

// Groups of the Smart Herb Filter (the values come from the "filters" object of each herb JSON)
const FILTER_GROUPS = [
    { key: 'medicinal', label: 'Medicinal use' },
    { key: 'flavor', label: 'Flavor' },
    { key: 'season', label: 'Harvest season' },
    { key: 'plantType', label: 'Plant type' },
    { key: 'lifecycle', label: 'Life cycle' },
    { key: 'usedFor', label: 'Used for' },
    { key: 'sun', label: 'Sunlight' },
    { key: 'water', label: 'Water needs' }
];
const SEASON_ORDER = ['Spring', 'Summer', 'Autumn', 'Winter'];

document.addEventListener('DOMContentLoaded', () => {
    initPreferences();
    setupMenu();
    setupEventListeners();
    setupSaveButtons();
    setupContactForm();
    setupChat();
    initTestimonials();
    updateBasketCount();
    window.addEventListener('hashchange', handleRouting);
    document.getElementById('year').textContent = new Date().getFullYear();
    handleRouting();
});

/* ---------- Small helpers ---------- */

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
}

// Icon from the inline SVG sprite in index.html
function icon(name, extraClass = '') {
    return `<svg class="icon ${extraClass}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
}

function backLink() {
    return `<div><a href="#" class="btn btn-secondary">${icon('arrow-left')}<span>Back to Herb Catalog</span></a></div>`;
}

function panelTitle(iconName, text) {
    return `<div class="panel-title">${icon(iconName, 'icon-lg')}<h2>${text}</h2></div>`;
}

function announce(message) {
    const live = document.getElementById('announcer');
    if (live) {
        live.textContent = '';
        setTimeout(() => { live.textContent = message; }, 50);
    }
}

/* ---------- Storage (localStorage, with a memory fallback when the browser blocks it) ---------- */

const memoryStore = {};

function storageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
    }
}

function storageSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        memoryStore[key] = value;
    }
}

function storageRemove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
    delete memoryStore[key];
}

/* ---------- Herb data loading ---------- */

function herbName(id) {
    const herb = HERB_REGISTRY.find((h) => h.id === id);
    return herb ? herb.name : id;
}

async function loadHerb(id) {
    if (herbCache[id]) return herbCache[id];
    const response = await fetch(`./data/${id}.json`);
    if (!response.ok) return null;
    const data = await response.json();
    herbCache[id] = data;
    return data;
}

async function loadAllHerbs() {
    await Promise.all(HERB_REGISTRY.map((h) => loadHerb(h.id)));
    return loadedHerbs();
}

function loadedHerbs() {
    return HERB_REGISTRY.map((h) => herbCache[h.id]).filter(Boolean);
}

function allHerbsLoaded() {
    return HERB_REGISTRY.every((h) => herbCache[h.id]);
}

/* ---------- Router ---------- */

const ROUTES = {
    '': { title: 'Home', herbs: true, render: renderCatalogView },
    'compare': { title: 'Compare Herbs', herbs: true, render: renderCompareView },
    'quiz': { title: 'Herb Quiz', render: renderQuizView },
    'map': { title: 'Origin Map', herbs: true, render: renderMapView },
    'basket': { title: 'My Herb Basket', render: renderBasketView },
    'about': { title: 'About Us', render: renderAboutView },
    'visit': { title: 'Visit', render: renderVisitView }
};

async function handleRouting() {
    const rawHash = window.location.hash.replace('#', '').trim().toLowerCase();
    const viewport = document.getElementById('app-viewport');
    const token = ++routeToken;

    updateNav(rawHash);
    closeMenu();

    try {
        const route = Object.prototype.hasOwnProperty.call(ROUTES, rawHash) ? ROUTES[rawHash] : null;

        if (route) {
            if (route.herbs && !allHerbsLoaded()) {
                renderLoadingView(viewport);
                announce('Loading');
                try {
                    await loadAllHerbs();
                } catch (err) {
                    if (rawHash !== '') throw err;   // the home page still works without the extra data
                }
                if (token !== routeToken) return;
            }
            await route.render(viewport, token);
            if (token !== routeToken) return;
            finishRender(route.title);
            return;
        }

        // Otherwise the hash is a herb id
        renderLoadingView(viewport);
        announce('Loading herb details');
        const herbData = /^[a-z0-9-]+$/.test(rawHash) ? await loadHerb(rawHash) : null;
        if (token !== routeToken) return;

        if (herbData) {
            renderHerbDetailView(viewport, herbData);
            finishRender(herbData.name);
        } else {
            renderErrorView(viewport, 'Herb Not Found', `We couldn't find any information on "${escapeHtml(rawHash)}". Check the spelling or browse our collection.`);
            finishRender('Herb not found');
        }
    } catch (err) {
        if (token !== routeToken) return;
        const fromDisk = window.location.protocol === 'file:';
        renderErrorView(
            viewport,
            'Error Loading Data',
            fromDisk
                ? 'Browsers block loading the herb files when index.html is opened by double-clicking it. Start a small web server in the project folder (run "npx serve") and open the address it prints, for example http://localhost:3000.'
                : 'An unexpected error occurred while loading this page. Please check your connection and try again.'
        );
        finishRender('Error');
    }
}

// Marks the current page in the header navigation (aria-current)
function updateNav(hash) {
    const map = {
        'nav-home': '', 'nav-compare': 'compare', 'nav-quiz': 'quiz', 'nav-map': 'map',
        'nav-basket': 'basket', 'nav-about': 'about', 'nav-visit': 'visit'
    };
    Object.keys(map).forEach((id) => {
        const link = document.getElementById(id);
        if (!link) return;
        if (map[id] === hash) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

// After each page is drawn: set the title, announce it, move focus to the heading
function finishRender(pageName) {
    document.title = pageName === 'Home' ? SITE_TITLE : `${pageName} - ${SITE_TITLE}`;
    if (firstRender) {
        firstRender = false;
        return;
    }
    const heading = document.querySelector('#app-viewport h1');
    if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus();
    }
    announce(`${pageName} page loaded`);
}

/* ---------- Views ---------- */

/* ---------- Herb Basket (favorites, saved in localStorage) ---------- */

function getBasket() {
    try {
        const list = JSON.parse(storageGet(STORAGE_KEYS.basket) || '[]');
        return Array.isArray(list) ? list.filter((id) => HERB_REGISTRY.some((h) => h.id === id)) : [];
    } catch (e) {
        return [];
    }
}

function isSaved(id) {
    return getBasket().includes(id);
}

function toggleBasket(id) {
    const list = getBasket();
    const index = list.indexOf(id);
    const nowSaved = index === -1;
    if (nowSaved) {
        list.push(id);
    } else {
        list.splice(index, 1);
    }
    storageSet(STORAGE_KEYS.basket, JSON.stringify(list));
    updateBasketCount();
    return nowSaved;
}

function updateBasketCount() {
    const badge = document.getElementById('basket-count');
    if (badge) badge.textContent = getBasket().length;
}

// Inner markup of a Save / Remove button (the herb name is added for screen readers)
function saveInner(id) {
    const saved = isSaved(id);
    return `${icon('heart', saved ? 'icon-filled' : '')}<span>${saved ? 'Remove' : 'Save'}</span><span class="visually-hidden"> ${escapeHtml(herbName(id))} ${saved ? 'from' : 'to'} basket</span>`;
}

function saveButtonMarkup(id, extraClass = '') {
    return `<button type="button" class="btn btn-secondary save-btn ${extraClass}" data-save="${id}">${saveInner(id)}</button>`;
}

function setupSaveButtons() {
    document.addEventListener('click', (e) => {
        const button = e.target.closest('[data-save]');
        if (!button) return;
        const id = button.dataset.save;
        const nowSaved = toggleBasket(id);
        announce(nowSaved ? `${herbName(id)} saved to your basket` : `${herbName(id)} removed from your basket`);
        document.querySelectorAll(`[data-save="${id}"]`).forEach((b) => { b.innerHTML = saveInner(id); });

        // On the basket page a removed herb disappears from the list
        if (window.location.hash === '#basket') {
            renderBasketView(document.getElementById('app-viewport'));
            const heading = document.querySelector('#app-viewport h1');
            if (heading) {
                heading.setAttribute('tabindex', '-1');
                heading.focus();
            }
        }
    });
}

function renderBasketView(container) {
    const herbs = getBasket().map((id) => HERB_REGISTRY.find((h) => h.id === id)).filter(Boolean);

    container.innerHTML = `
        <section class="view fade-in">
            <div class="hero">
                <h1>My Herb <span class="accent">Basket</span></h1>
                <p class="lead">${herbs.length
                    ? `You have saved ${herbs.length} ${herbs.length === 1 ? 'herb' : 'herbs'}. They are kept in this browser, so they will be here next time you visit.`
                    : 'Save the herbs you like and they will appear here.'}</p>
            </div>
            ${herbs.length === 0 ? `
                <div class="empty">
                    ${icon('heart', 'icon-lg')}
                    <p>Your basket is empty. Use the Save button on any herb to add it.</p>
                    <a href="#" class="btn btn-primary">Browse the herbs</a>
                </div>
            ` : `
                <ul class="card-grid">${herbs.map((herb) => `<li>${herbCardMarkup(herb)}</li>`).join('')}</ul>
                <div class="basket-actions">
                    ${herbs.length >= 2 ? `<button type="button" id="basket-compare" class="btn btn-secondary">${icon('columns')}<span>Compare my first two herbs</span></button>` : ''}
                    <button type="button" id="basket-clear" class="btn btn-secondary">${icon('trash')}<span>Empty the basket</span></button>
                </div>
            `}
        </section>
    `;

    const clearBtn = document.getElementById('basket-clear');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            storageSet(STORAGE_KEYS.basket, '[]');
            updateBasketCount();
            announce('Basket emptied');
            renderBasketView(container);
            const heading = container.querySelector('h1');
            heading.setAttribute('tabindex', '-1');
            heading.focus();
        });
    }
    const compareBtn = document.getElementById('basket-compare');
    if (compareBtn) {
        compareBtn.addEventListener('click', () => {
            compareSelection = [herbs[0].id, herbs[1].id];
            window.location.hash = '#compare';
        });
    }
}

/* ---------- Smart Herb Filter ---------- */

function herbValues(entry, key) {
    const value = entry && entry.filters ? entry.filters[key] : undefined;
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
}

function filterOptions(key) {
    const counts = {};
    loadedHerbs().forEach((entry) => {
        herbValues(entry, key).forEach((value) => { counts[value] = (counts[value] || 0) + 1; });
    });
    const values = Object.keys(counts);
    if (key === 'season') {
        values.sort((a, b) => SEASON_ORDER.indexOf(a) - SEASON_ORDER.indexOf(b));
    } else {
        values.sort((a, b) => a.localeCompare(b));
    }
    return values.map((value) => ({ value, count: counts[value] }));
}

function activeFilterCount() {
    return Object.values(activeFilters).reduce((sum, list) => sum + list.length, 0);
}

function herbMatchesFilters(entry) {
    return FILTER_GROUPS.every((group) => {
        const selected = activeFilters[group.key];
        if (!selected || selected.length === 0) return true;
        const values = herbValues(entry, group.key);
        return selected.some((value) => values.includes(value));   // OR inside a group, AND between groups
    });
}

function filterPanelMarkup() {
    if (!allHerbsLoaded()) {
        return '<p class="notice small">The smart filters need the herb data. Run the site from a web server (for example "npx serve") to use them.</p>';
    }
    const count = activeFilterCount();
    return `
        <details class="filters" id="filters" ${count ? 'open' : ''}>
            <summary>${icon('filter')}<span>Smart filters</span><span class="count" id="filter-count">${count}</span><span class="visually-hidden"> filters on</span></summary>
            <div class="filter-body">
                <p class="small">Tick one or more boxes. Herbs must match at least one choice in each group you use.</p>
                <div class="filter-grid">
                    ${FILTER_GROUPS.map((group) => `
                        <fieldset class="filter-group">
                            <legend>${group.label}</legend>
                            ${filterOptions(group.key).map((option) => `
                                <label class="check"><input type="checkbox" data-group="${group.key}" value="${escapeHtml(option.value)}" ${(activeFilters[group.key] || []).includes(option.value) ? 'checked' : ''}> <span>${escapeHtml(option.value)} (${option.count})</span></label>
                            `).join('')}
                        </fieldset>
                    `).join('')}
                </div>
                <button type="button" id="clear-filters" class="btn btn-secondary">${icon('x')}<span>Clear all filters</span></button>
            </div>
        </details>
    `;
}

/* ---------- Home: catalog ---------- */

function herbCardMarkup(herb) {
    const entry = herbCache[herb.id];
    const f = entry && entry.filters;
    return `
        <article class="card">
            <div class="card-top">
                <div class="card-meta">
                    <span class="icon-badge">${icon(herb.icon, 'icon-lg')}</span>
                    <span class="pill">${escapeHtml(herb.category)}</span>
                </div>
                <div>
                    <h3><a class="card-link" href="#${herb.id}">${escapeHtml(herb.name)}</a></h3>
                    <p class="latin">${escapeHtml(herb.botanicalName)}</p>
                </div>
                <p>${escapeHtml(herb.summary)}</p>
                ${f ? `<p class="card-tags small">${escapeHtml(f.lifecycle)} · ${escapeHtml(f.plantType)}<br>Taste: ${escapeHtml(f.flavor.join(', '))}</p>` : ''}
            </div>
            <div class="card-more">
                <span class="more-link" aria-hidden="true">View Details ${icon('arrow-right')}</span>
                ${saveButtonMarkup(herb.id)}
            </div>
        </article>
    `;
}

function renderCatalogView(container) {
    container.innerHTML = `
        <section class="view fade-in">
            <div class="hero">
                <h1>Welcome to <span class="accent">The Little Herb Garden</span></h1>
                <p class="lead">Discover botanical profiles, growing guides, culinary and medicinal uses, and videos for your favorite herbs.</p>
            </div>

            <div class="search">
                <label for="herb-search">Search herbs by name or category</label>
                <div class="search-row">
                    <div class="search-field">
                        ${icon('search')}
                        <input type="search" id="herb-search" autocomplete="off" value="${escapeHtml(currentSearchQuery)}" placeholder="For example: Basil, Mint, Lavender" aria-controls="herb-results">
                    </div>
                    <button type="button" id="clear-search-btn" class="btn btn-secondary" ${currentSearchQuery ? '' : 'hidden'}>${icon('x')}<span>Clear</span></button>
                </div>
            </div>

            ${filterPanelMarkup()}

            <section aria-labelledby="results-heading">
                <h2 id="results-heading">Herb Collection (<span id="result-count"></span>)</h2>
                <div id="herb-results"></div>
            </section>
        </section>
    `;

    renderResults(false);

    const searchInput = document.getElementById('herb-search');
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        document.getElementById('clear-search-btn').hidden = !currentSearchQuery;
        renderResults(true);
    });
    document.getElementById('clear-search-btn').addEventListener('click', () => {
        currentSearchQuery = '';
        searchInput.value = '';
        document.getElementById('clear-search-btn').hidden = true;
        renderResults(true);
        searchInput.focus();
    });

    const filters = document.getElementById('filters');
    if (filters) {
        filters.addEventListener('change', (e) => {
            const box = e.target;
            if (!box.matches('input[data-group]')) return;
            const list = activeFilters[box.dataset.group] || [];
            activeFilters[box.dataset.group] = box.checked ? list.concat(box.value) : list.filter((v) => v !== box.value);
            document.getElementById('filter-count').textContent = activeFilterCount();
            renderResults(true);
        });
        document.getElementById('clear-filters').addEventListener('click', () => {
            activeFilters = {};
            filters.querySelectorAll('input[data-group]').forEach((box) => { box.checked = false; });
            document.getElementById('filter-count').textContent = 0;
            renderResults(true);
        });
    }
}

// Redraws only the results, so the search box keeps focus while typing
function renderResults(shouldAnnounce) {
    const query = currentSearchQuery.trim().toLowerCase();
    const filteredHerbs = HERB_REGISTRY.filter((herb) => {
        const entry = herbCache[herb.id];
        const text = [
            herb.name, herb.botanicalName, herb.category, herb.summary,
            entry ? Object.values(entry.filters || {}).flat().join(' ') : '',
            entry && entry.taste ? entry.taste : ''
        ].join(' ').toLowerCase();
        if (query && !text.includes(query)) return false;
        return !entry || herbMatchesFilters(entry);
    });

    document.getElementById('result-count').textContent = filteredHerbs.length;
    const target = document.getElementById('herb-results');

    if (filteredHerbs.length === 0) {
        target.innerHTML = `
            <div class="empty">
                ${icon('leaf', 'icon-lg')}
                <p>No herbs found. Try a different search or fewer filters.</p>
                <button type="button" id="reset-search-btn" class="btn btn-soft">Clear search and filters</button>
            </div>
        `;
        document.getElementById('reset-search-btn').addEventListener('click', () => {
            currentSearchQuery = '';
            activeFilters = {};
            renderCatalogView(document.getElementById('app-viewport'));
            document.getElementById('herb-search').focus();
            announce('Search and filters cleared');
        });
    } else {
        target.innerHTML = `<ul class="card-grid">${filteredHerbs.map((herb) => `<li>${herbCardMarkup(herb)}</li>`).join('')}</ul>`;
    }

    if (shouldAnnounce) {
        announce(filteredHerbs.length === 1 ? '1 herb found' : `${filteredHerbs.length} herbs found`);
    }
}

/* ---------- Herb page ---------- */

// Embedded YouTube player (privacy-friendly address, captions on where available)
function videoEmbed(herb, compact = false) {
    if (!herb.video || !/^[A-Za-z0-9_-]{11}$/.test(herb.video.youtubeId || '')) return '';
    return `
        <figure class="video">
            <div class="video-frame">
                <iframe
                    src="https://www.youtube-nocookie.com/embed/${herb.video.youtubeId}?rel=0&amp;cc_load_policy=1"
                    title="Video about ${escapeHtml(herb.name)}: ${escapeHtml(herb.video.title)}"
                    loading="lazy"
                    allow="encrypted-media; picture-in-picture; fullscreen"
                    referrerpolicy="strict-origin-when-cross-origin"></iframe>
            </div>
            <figcaption>${escapeHtml(herb.video.title)}${compact ? '' : ' (video from YouTube, with captions turned on where available)'}</figcaption>
        </figure>
    `;
}

function renderHerbDetailView(container, herb) {
    const name = escapeHtml(herb.name);
    const list = (items) => (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const growing = herb.growingConditions || {};
    const safety = herb.safety || {};
    const video = videoEmbed(herb);

    container.innerHTML = `
        <article class="view view-medium fade-in">
            ${backLink()}

            <div class="herb-header">
                <div class="herb-photo">
                    <img id="herb-photo-img" src="${escapeHtml(herb.image)}" alt="${escapeHtml(herb.imageAlt || `Fresh ${herb.name} plant`)}">
                    <span class="badge">${escapeHtml(herb.category)}</span>
                </div>
                <div class="herb-info">
                    <div>
                        <h1>${name}</h1>
                        <p class="latin">${escapeHtml(herb.botanicalName)}</p>
                    </div>
                    ${herb.family ? `<p class="small"><strong>Family:</strong> ${escapeHtml(herb.family)}</p>` : ''}
                    <p>${escapeHtml(herb.description)}</p>
                    <div class="herb-actions">
                        ${saveButtonMarkup(herb.id)}
                        <button type="button" class="btn btn-secondary" data-compare="${herb.id}">${icon('columns')}<span>Compare</span></button>
                        <button type="button" class="btn btn-secondary" data-ask="${herb.id}">${icon('chat')}<span>Ask the Guide</span></button>
                    </div>
                </div>
            </div>

            <div class="grid-2">
                <section class="panel" aria-labelledby="growing-heading">
                    <div class="panel-title">${icon('sun', 'icon-lg')}<h2 id="growing-heading">Growing Conditions</h2></div>
                    <dl class="facts">
                        <div><dt>Sunlight:</dt><dd>${escapeHtml(growing.sunlight || '')}</dd></div>
                        <div><dt>Watering:</dt><dd>${escapeHtml(growing.watering || '')}</dd></div>
                        <div><dt>Hardiness Zone:</dt><dd>${escapeHtml(growing.hardinessZone || '')}</dd></div>
                        <div><dt>Soil Type:</dt><dd>${escapeHtml(growing.soilType || '')}</dd></div>
                        ${herb.soilPh ? `<div><dt>Soil pH:</dt><dd>${escapeHtml(herb.soilPh)}</dd></div>` : ''}
                        ${herb.temperature ? `<div><dt>Temperature:</dt><dd>${escapeHtml(herb.temperature)}</dd></div>` : ''}
                    </dl>
                </section>

                <section class="panel" aria-labelledby="uses-heading">
                    <div class="panel-title">${icon('utensils', 'icon-lg')}<h2 id="uses-heading">Culinary &amp; Popular Uses</h2></div>
                    <ul class="bullets">${list(herb.uses)}</ul>
                    ${herb.pairings ? `
                        <h3 class="subhead">Perfect Flavor Pairings</h3>
                        <ul class="chips" aria-label="Flavor pairings">
                            ${herb.pairings.map((item) => `<li class="chip">${escapeHtml(item)}</li>`).join('')}
                        </ul>
                    ` : ''}
                </section>
            </div>

            ${herb.taste || herb.origin || herb.dailyLife ? `
                <div class="grid-2">
                    <section class="panel" aria-labelledby="taste-heading">
                        <div class="panel-title">${icon('globe', 'icon-lg')}<h2 id="taste-heading">Taste &amp; Origin</h2></div>
                        ${herb.taste ? `<p><strong>Taste:</strong> ${escapeHtml(herb.taste)}</p>` : ''}
                        ${herb.origin ? `
                            <p><strong>Origin:</strong> ${escapeHtml(herb.origin.region)}. ${escapeHtml(herb.origin.details)}</p>
                            <p><a href="#map">See it on the origin map</a></p>
                        ` : ''}
                        ${herb.filters ? `<p class="small">${escapeHtml(herb.filters.lifecycle)} · ${escapeHtml(herb.filters.plantType)} · Best harvest: ${escapeHtml(herb.filters.season.join(', '))}</p>` : ''}
                    </section>
                    ${herb.dailyLife ? `
                        <section class="panel" aria-labelledby="daily-heading">
                            <div class="panel-title">${icon('home', 'icon-lg')}<h2 id="daily-heading">In Daily Life</h2></div>
                            <ul class="bullets">${list(herb.dailyLife)}</ul>
                        </section>
                    ` : ''}
                </div>
            ` : ''}

            ${herb.harvest || herb.storage ? `
                <section class="panel" aria-labelledby="care-heading">
                    <div class="panel-title">${icon('sprout', 'icon-lg')}<h2 id="care-heading">Harvesting, Storage &amp; Tips</h2></div>
                    <dl class="facts facts-stacked">
                        ${herb.harvest ? `<div><dt>How to harvest</dt><dd>${escapeHtml(herb.harvest)}</dd></div>` : ''}
                        ${herb.storage ? `<div><dt>Storing after harvest</dt><dd>${escapeHtml(herb.storage)}</dd></div>` : ''}
                    </dl>
                    ${herb.tips ? `<h3 class="subhead">Growing tips</h3><ul class="bullets">${list(herb.tips)}</ul>` : ''}
                </section>
            ` : ''}

            ${herb.sideEffects || herb.safety ? `
                <section class="panel" aria-labelledby="safety-heading">
                    <div class="panel-title">${icon('alert', 'icon-lg')}<h2 id="safety-heading">Safety, Allergies &amp; Side Effects</h2></div>
                    ${herb.sideEffects ? `<h3 class="subhead">Possible side effects</h3><ul class="bullets">${list(herb.sideEffects)}</ul>` : ''}
                    <dl class="facts facts-stacked">
                        ${safety.allergy ? `<div><dt>Allergies</dt><dd>${escapeHtml(safety.allergy)}</dd></div>` : ''}
                        ${safety.pregnancy ? `<div><dt>Pregnancy</dt><dd>${escapeHtml(safety.pregnancy)}</dd></div>` : ''}
                        ${safety.pets ? `<div><dt>Pets</dt><dd>${escapeHtml(safety.pets)}</dd></div>` : ''}
                        ${safety.medications ? `<div><dt>Medicines</dt><dd>${escapeHtml(safety.medications)}</dd></div>` : ''}
                    </dl>
                </section>
            ` : ''}

            ${herb.medicinal ? `
                <section class="panel" aria-labelledby="medicinal-heading">
                    <div class="panel-title">${icon('heart', 'icon-lg')}<h2 id="medicinal-heading">Medicinal Uses &amp; Benefits</h2></div>
                    <div class="grid-2">
                        <div>
                            <h3 class="subhead">Traditional Medicinal Uses</h3>
                            <ul class="bullets">${list(herb.medicinal.uses)}</ul>
                        </div>
                        <div>
                            <h3 class="subhead">Health Benefits</h3>
                            <ul class="bullets">${list(herb.medicinal.benefits)}</ul>
                        </div>
                    </div>
                    ${herb.medicinal.caution ? `<p class="note">${icon('info')}<span><strong>Good to know:</strong> ${escapeHtml(herb.medicinal.caution)}</span></p>` : ''}
                    <p class="small">This information is for general interest only and is not medical advice. Please talk to a doctor or pharmacist before using herbs as medicine.</p>
                </section>
            ` : ''}

            ${video ? `
                <section class="panel" aria-labelledby="video-heading">
                    <div class="panel-title">${icon('video', 'icon-lg')}<h2 id="video-heading">Watch &amp; Learn</h2></div>
                    ${video}
                </section>
            ` : ''}
        </article>
    `;

    // If the herb photo cannot load, show the local garden picture instead
    const photo = document.getElementById('herb-photo-img');
    if (photo) {
        photo.addEventListener('error', () => {
            photo.src = 'images/garden.svg';
            photo.alt = `Illustration of a herb garden (the photo of ${herb.name} could not be loaded)`;
        }, { once: true });
    }

    container.querySelector('[data-compare]').addEventListener('click', () => {
        compareSelection = [herb.id, compareSelection[1] === herb.id ? '' : compareSelection[1]];
        window.location.hash = '#compare';
    });
    container.querySelector('[data-ask]').addEventListener('click', () => {
        openChat(`Tell me about ${herb.name}`);
    });
}

/* ---------- Herb Comparison Tool ---------- */

function renderCompareView(container) {
    const herbs = loadedHerbs();
    if (herbs.length < 2) {
        renderErrorView(container, 'Comparison not available', 'The herb data could not be loaded. Run the site from a web server (for example "npx serve") and try again.');
        return;
    }
    const options = (selected) => `<option value="">Choose a herb</option>${herbs.map((h) => `<option value="${h.id}" ${h.id === selected ? 'selected' : ''}>${escapeHtml(h.name)}</option>`).join('')}`;

    container.innerHTML = `
        <section class="view view-medium fade-in">
            <div class="hero">
                <h1>Compare <span class="accent">Herbs</span></h1>
                <p class="lead">Choose two herbs to see their taste, medicinal uses, growing conditions, side effects and videos side by side.</p>
            </div>
            <div class="compare-pickers">
                <div class="field">
                    <label for="cmp-a">First herb</label>
                    <select id="cmp-a">${options(compareSelection[0])}</select>
                </div>
                <div class="field">
                    <label for="cmp-b">Second herb</label>
                    <select id="cmp-b">${options(compareSelection[1])}</select>
                </div>
                <button type="button" id="cmp-swap" class="btn btn-secondary">${icon('shuffle')}<span>Swap</span></button>
            </div>
            <div id="compare-result" aria-live="polite"></div>
        </section>
    `;

    const a = document.getElementById('cmp-a');
    const b = document.getElementById('cmp-b');
    const update = () => {
        compareSelection = [a.value, b.value];
        renderComparison(true);
    };
    a.addEventListener('change', update);
    b.addEventListener('change', update);
    document.getElementById('cmp-swap').addEventListener('click', () => {
        const first = a.value;
        a.value = b.value;
        b.value = first;
        update();
    });
    renderComparison(false);
}

function renderComparison(shouldAnnounce) {
    const out = document.getElementById('compare-result');
    const [idA, idB] = compareSelection;
    if (!idA || !idB) {
        out.innerHTML = '<p class="notice">Choose two herbs to see them side by side.</p>';
        return;
    }
    if (idA === idB) {
        out.innerHTML = '<p class="notice">Please choose two different herbs.</p>';
        return;
    }
    const A = herbCache[idA];
    const B = herbCache[idB];
    const ul = (items) => `<ul class="bullets">${(items || []).map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
    const growing = (h) => {
        const g = h.growingConditions || {};
        return `<ul class="plain-list">
            <li><strong>Sunlight:</strong> ${escapeHtml(g.sunlight || '')}</li>
            <li><strong>Watering:</strong> ${escapeHtml(g.watering || '')}</li>
            <li><strong>Soil:</strong> ${escapeHtml(g.soilType || '')}${h.soilPh ? ` (pH ${escapeHtml(h.soilPh)})` : ''}</li>
            <li><strong>Temperature:</strong> ${escapeHtml(h.temperature || '')}</li>
            <li><strong>Hardiness:</strong> ${escapeHtml(g.hardinessZone || '')}</li>
        </ul>`;
    };
    const rows = [
        ['Taste', (h) => `<p>${escapeHtml(h.taste || '')}</p><p class="small">Flavor: ${escapeHtml(herbValues(h, 'flavor').join(', '))}</p>`],
        ['Plant type', (h) => `<p>${escapeHtml(herbValues(h, 'plantType').join(', '))}, ${escapeHtml(herbValues(h, 'lifecycle').join(', ').toLowerCase())}</p><p class="small">Best harvest: ${escapeHtml(herbValues(h, 'season').join(', '))}</p>`],
        ['Origin', (h) => `<p>${escapeHtml(h.origin ? h.origin.region : '')}</p>`],
        ['Medicinal uses', (h) => ul(h.medicinal && h.medicinal.uses)],
        ['Growing conditions', growing],
        ['Side effects', (h) => ul(h.sideEffects)],
        ['Video', (h) => videoEmbed(h, true)]
    ];
    const cell = (h, render) => `<td role="cell" data-label="${escapeHtml(h.name)}">${render(h)}</td>`;

    out.innerHTML = `
        <div class="table-wrap">
            <table class="compare-table" role="table">
                <caption class="visually-hidden">Comparison of ${escapeHtml(A.name)} and ${escapeHtml(B.name)}</caption>
                <thead role="rowgroup"><tr role="row">
                    <th scope="col" role="columnheader"><span class="visually-hidden">Feature</span></th>
                    <th scope="col" role="columnheader"><a href="#${A.id}">${escapeHtml(A.name)}</a></th>
                    <th scope="col" role="columnheader"><a href="#${B.id}">${escapeHtml(B.name)}</a></th>
                </tr></thead>
                <tbody role="rowgroup">
                    ${rows.map(([label, render]) => `<tr role="row"><th scope="row" role="rowheader">${label}</th>${cell(A, render)}${cell(B, render)}</tr>`).join('')}
                </tbody>
            </table>
        </div>
        <p class="small">General information only, not medical advice.</p>
    `;
    if (shouldAnnounce) announce(`Now comparing ${A.name} and ${B.name}`);
}

function renderAboutView(container) {
    container.innerHTML = `
        <article class="view view-narrow fade-in">
            <div>
                <h1>About <span class="accent">Us</span></h1>
                <p class="lead">The Little Herb Garden is a small garden website made to help you get to know the herbs that have grown alongside people for thousands of years.</p>
            </div>

            <section class="panel" aria-labelledby="history-heading">
                <div class="panel-title">${icon('book', 'icon-lg')}<h2 id="history-heading">A Short History of Herbs</h2></div>
                <p>People have gathered and grown herbs since ancient times. The Egyptians used herbs in cooking, medicine and embalming, and records on clay tablets show that Mesopotamians valued thyme and mint. In ancient Greece and Rome herbs were used for food, perfume and healing, and doctors such as Hippocrates and Dioscorides wrote about the plants they used as medicine. In the Middle Ages monastery gardens kept this knowledge alive, and traders along the spice and herb routes carried plants and recipes between Asia, Africa and Europe. Today many modern medicines still trace their roots to plants first used as herbs.</p>
            </section>

            <section class="panel" aria-labelledby="uses-about-heading">
                <div class="panel-title">${icon('utensils', 'icon-lg')}<h2 id="uses-about-heading">How We Use Herbs</h2></div>
                <ul class="bullets">
                    <li><strong>In the kitchen:</strong> fresh and dried herbs add flavour to soups, sauces, breads, salads and drinks without adding salt or fat.</li>
                    <li><strong>As medicine:</strong> teas, syrups and oils made from herbs have long been used for digestion, coughs, sleep and stress.</li>
                    <li><strong>For scent and wellbeing:</strong> lavender, mint and rosemary are used in aromatherapy, soaps, sachets and perfumes.</li>
                    <li><strong>In the garden:</strong> flowering herbs feed bees and butterflies, and some strongly scented herbs help keep pests away from other plants.</li>
                </ul>
            </section>

            <section class="panel" aria-labelledby="matter-heading">
                <div class="panel-title">${icon('globe', 'icon-lg')}<h2 id="matter-heading">Why Herbs Matter</h2></div>
                <p>Herbs are easy to grow, even on a windowsill, so they bring fresh food and natural remedies within reach of almost everyone. They support pollinators, reduce the need for packaged flavourings, and keep cultural food traditions alive. Growing a few herbs is also a simple way to connect with nature, learn how plants live, and enjoy something you grew yourself.</p>
            </section>

            ${backLink()}
        </article>
    `;
}

function renderVisitView(container) {
    container.innerHTML = `
        <article class="view view-narrow fade-in">
            <h1><span class="accent">Visit</span></h1>
            <div class="panel">
                <div class="panel-title">${icon('pin', 'icon-lg')}<h2>Opening times</h2></div>
                <p>${VISIT_TEXT}</p>
            </div>
            ${backLink()}
        </article>
    `;
}

function renderErrorView(container, title, message) {
    container.innerHTML = `
        <div class="error-box fade-in">
            <span class="error-icon">${icon('alert', 'icon-lg')}</span>
            <div>
                <h1>${title}</h1>
                <p>${message}</p>
            </div>
            <a href="#" class="btn btn-primary">Return to Herb Catalog</a>
        </div>
    `;
}

function renderLoadingView(container) {
    container.innerHTML = `
        <div class="skeleton" aria-hidden="true">
            <div></div>
            <div></div>
            <div></div>
        </div>
    `;
}

/* ---------- Herb Quiz ---------- */

const QUIZ_LENGTH = 8;
let quizData = null;
let quiz = null;      // { items, index, score, answered, missed }

async function loadQuiz() {
    if (quizData) return quizData;
    const response = await fetch('./data/quiz.json');
    if (!response.ok) throw new Error('quiz data not found');
    quizData = await response.json();
    return quizData;
}

function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

async function renderQuizView(container, token) {
    quiz = null;
    await loadQuiz();
    if (token !== routeToken) return;
    renderQuizIntro(container);
}

function renderQuizIntro(container) {
    const best = storageGet(STORAGE_KEYS.quizBest);
    container.innerHTML = `
        <section class="view view-narrow fade-in">
            <div class="hero">
                <h1>Herb <span class="accent">Quiz</span></h1>
                <p class="lead">Test what you know about our eight herbs. You will get ${QUIZ_LENGTH} questions, one at a time, and a score at the end.</p>
            </div>
            ${best !== null ? `<p class="note">${icon('award')}<span>Your best score so far: <strong>${escapeHtml(best)} out of ${QUIZ_LENGTH}</strong></span></p>` : ''}
            <div class="center"><button type="button" id="quiz-start" class="btn btn-primary btn-large">${icon('help')}<span>Start the quiz</span></button></div>
        </section>
    `;
    document.getElementById('quiz-start').addEventListener('click', () => startQuiz(container));
}

function startQuiz(container) {
    const items = shuffle(quizData.questions).slice(0, QUIZ_LENGTH).map((q) => ({
        question: q.question,
        answer: q.answer,
        explanation: q.explanation,
        herb: q.herb,
        options: shuffle([q.answer].concat(q.wrong))
    }));
    quiz = { items, index: 0, score: 0, answered: false, missed: [] };
    renderQuizQuestion(container);
}

function renderQuizQuestion(container) {
    const q = quiz.items[quiz.index];
    const total = quiz.items.length;
    quiz.answered = false;

    container.innerHTML = `
        <section class="view view-narrow fade-in">
            <h1>Herb <span class="accent">Quiz</span></h1>
            <div>
                <p id="quiz-progress"><strong>Question ${quiz.index + 1} of ${total}</strong> · Score so far: ${quiz.score}</p>
                <progress max="${total}" value="${quiz.index + 1}" aria-label="Quiz progress"></progress>
            </div>
            <form id="quiz-form" class="panel" novalidate>
                <fieldset class="quiz-fieldset">
                    <legend><span id="quiz-q" tabindex="-1">${escapeHtml(q.question)}</span></legend>
                    ${q.options.map((option, i) => `
                        <label class="quiz-option"><input type="radio" name="answer" value="${i}"> <span class="quiz-text">${escapeHtml(option)}</span></label>
                    `).join('')}
                </fieldset>
                <div id="quiz-feedback" class="quiz-feedback" role="status" aria-live="polite"></div>
                <div class="dialog-actions"><button type="submit" id="quiz-submit" class="btn btn-primary">Check answer</button></div>
            </form>
        </section>
    `;
    document.getElementById('quiz-q').focus();

    const form = document.getElementById('quiz-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const feedback = document.getElementById('quiz-feedback');
        const submit = document.getElementById('quiz-submit');

        // Second press: go to the next question (or the result)
        if (quiz.answered) {
            quiz.index++;
            if (quiz.index >= total) {
                renderQuizResult(container);
            } else {
                renderQuizQuestion(container);
            }
            return;
        }

        const chosen = form.querySelector('input[name="answer"]:checked');
        if (!chosen) {
            feedback.innerHTML = `<p class="field-error">${icon('alert')} Please choose an answer first.</p>`;
            form.querySelector('input[name="answer"]').focus();
            return;
        }

        const picked = q.options[Number(chosen.value)];
        const correct = picked === q.answer;
        quiz.answered = true;
        if (correct) {
            quiz.score++;
        } else {
            quiz.missed.push(q);
        }

        // Show which option was right; the text tags mean colour is not the only signal
        form.querySelectorAll('.quiz-option').forEach((label) => {
            const input = label.querySelector('input');
            const text = q.options[Number(input.value)];
            input.disabled = true;
            if (text === q.answer) {
                label.classList.add('is-correct');
                label.insertAdjacentHTML('beforeend', '<span class="quiz-tag">Correct answer</span>');
            } else if (input.checked) {
                label.classList.add('is-wrong');
                label.insertAdjacentHTML('beforeend', '<span class="quiz-tag">Your answer</span>');
            }
        });

        feedback.innerHTML = `
            <p>${icon(correct ? 'check' : 'info')} <strong>${correct ? 'Correct!' : 'Not quite.'}</strong>
            ${correct ? '' : `The right answer is ${escapeHtml(q.answer)}. `}${escapeHtml(q.explanation)}
            <a href="#${q.herb}">Read about ${escapeHtml(herbName(q.herb))}</a></p>
        `;
        submit.textContent = quiz.index + 1 >= total ? 'See my score' : 'Next question';
        submit.focus();
    });
}

function renderQuizResult(container) {
    const total = quiz.items.length;
    const score = quiz.score;
    const best = storageGet(STORAGE_KEYS.quizBest);
    const isNewBest = best === null || score > Number(best);
    if (isNewBest) storageSet(STORAGE_KEYS.quizBest, String(score));

    const ratio = score / total;
    const message = ratio === 1 ? 'Perfect! You are a true herb master.'
        : ratio >= 0.75 ? 'Excellent! You know your herbs very well.'
        : ratio >= 0.5 ? 'Good job! A few more visits to the herb pages and you will be an expert.'
        : 'A good start! Explore the herb pages and try again.';

    container.innerHTML = `
        <section class="view view-narrow fade-in">
            <h1>Quiz <span class="accent">Results</span></h1>
            <div class="panel score-panel">
                <p class="score" id="quiz-score">You scored <strong>${score}</strong> out of <strong>${total}</strong></p>
                <progress max="${total}" value="${score}" aria-label="Your score"></progress>
                <p>${message}</p>
                ${isNewBest ? `<p class="note">${icon('award')}<span><strong>New best score!</strong></span></p>` : ''}
            </div>
            ${quiz.missed.length ? `
                <section class="panel" aria-labelledby="missed-heading">
                    <div class="panel-title">${icon('book', 'icon-lg')}<h2 id="missed-heading">Questions to review</h2></div>
                    <ul class="bullets">
                        ${quiz.missed.map((q) => `<li>${escapeHtml(q.question)} <strong>${escapeHtml(q.answer)}.</strong> <a href="#${q.herb}">Read about ${escapeHtml(herbName(q.herb))}</a></li>`).join('')}
                    </ul>
                </section>
            ` : ''}
            <div class="dialog-actions">
                <a href="#" class="btn btn-secondary">Browse the herbs</a>
                <button type="button" id="quiz-again" class="btn btn-primary">${icon('refresh')}<span>Try again</span></button>
            </div>
        </section>
    `;
    document.getElementById('quiz-again').addEventListener('click', () => startQuiz(container));
    const heading = container.querySelector('h1');
    heading.setAttribute('tabindex', '-1');
    heading.focus();
    announce(`You scored ${score} out of ${total}. ${message}`);
}

/* ---------- Herb Origin Map (plain SVG, drawn from data/worldmap.json) ---------- */

let worldMap = null;
const MAP_WIDTH = 1000;
const mapX = (lon) => (lon + 180) * 1000 / 360;
const mapY = (lat) => (90 - lat) * 500 / 180;

async function renderMapView(container, token) {
    if (!worldMap) {
        const response = await fetch('./data/worldmap.json');
        if (!response.ok) throw new Error('map data not found');
        worldMap = await response.json();
    }
    if (token !== routeToken) return;

    const herbs = loadedHerbs().filter((h) => h.origin);
    const topY = mapY(83);
    const bottomY = mapY(-58);
    const baseH = bottomY - topY;

    const land = worldMap.land.map((shape) =>
        `<polygon class="map-land" points="${shape.points.map((p) => `${mapX(p[0]).toFixed(1)},${mapY(p[1]).toFixed(1)}`).join(' ')}"><title>${escapeHtml(shape.name)}</title></polygon>`
    ).join('');
    let grid = '';
    for (let lon = -150; lon <= 150; lon += 30) grid += `<line class="map-grid" x1="${mapX(lon)}" y1="${topY}" x2="${mapX(lon)}" y2="${bottomY}"/>`;
    for (let lat = -30; lat <= 60; lat += 30) grid += `<line class="map-grid ${lat === 0 ? 'map-equator' : ''}" x1="0" y1="${mapY(lat)}" x2="${MAP_WIDTH}" y2="${mapY(lat)}"/>`;
    const markers = herbs.map((h, i) =>
        `<g class="map-marker" data-id="${h.id}"><circle r="12"/><text text-anchor="middle" dy="4.5">${i + 1}</text></g>`
    ).join('');

    container.innerHTML = `
        <section class="view fade-in">
            <div class="hero">
                <h1>Herb <span class="accent">Origin Map</span></h1>
                <p class="lead">Find out where each herb first grew. Select a numbered marker on the map, or a herb in the list.</p>
            </div>

            <div class="map-card">
                <div class="map-controls" role="group" aria-label="Map controls">
                    <button type="button" class="btn btn-secondary" id="map-zoom-in">${icon('plus')}<span>Zoom in</span></button>
                    <button type="button" class="btn btn-secondary" id="map-zoom-out">${icon('minus')}<span>Zoom out</span></button>
                    <button type="button" class="btn btn-secondary" id="map-europe">${icon('map')}<span>Europe &amp; Mediterranean</span></button>
                    <button type="button" class="btn btn-secondary" id="map-world">${icon('globe')}<span>World view</span></button>
                </div>
                <div class="map-frame" id="map-frame">
                    <svg id="origin-map" viewBox="0 ${topY} ${MAP_WIDTH} ${baseH}" role="img" aria-label="World map with numbered markers showing where each herb comes from. The list below the map gives the same information as text.">
                        <rect class="map-sea" x="0" y="${topY}" width="${MAP_WIDTH}" height="${baseH}"/>
                        ${grid}
                        ${land}
                        <g id="map-markers">${markers}</g>
                    </svg>
                </div>
                <p class="small">A simplified map. Drag the map to move it when zoomed in.</p>
            </div>

            <div class="grid-2">
                <section class="panel" aria-labelledby="origin-list-heading">
                    <div class="panel-title">${icon('globe', 'icon-lg')}<h2 id="origin-list-heading">Where each herb comes from</h2></div>
                    <ol class="origin-list">
                        ${herbs.map((h, i) => `
                            <li><button type="button" class="origin-item" data-origin="${h.id}"><span class="num" aria-hidden="true">${i + 1}</span><span><strong>${escapeHtml(h.name)}</strong><br><span class="small">${escapeHtml(h.origin.region)}</span></span></button></li>
                        `).join('')}
                    </ol>
                </section>
                <section class="panel" id="origin-detail" aria-labelledby="origin-detail-heading" aria-live="polite">
                    <div class="panel-title">${icon('pin', 'icon-lg')}<h2 id="origin-detail-heading">Origin details</h2></div>
                    <p>Select a herb to read the story of where it comes from.</p>
                </section>
            </div>
        </section>
    `;

    // --- map behaviour: zoom, drag and selection
    const svg = document.getElementById('origin-map');
    const frame = document.getElementById('map-frame');
    const markerEls = Array.from(svg.querySelectorAll('.map-marker'));
    const zoomInBtn = document.getElementById('map-zoom-in');
    const zoomOutBtn = document.getElementById('map-zoom-out');
    const MIN_ZOOM = 1;
    const MAX_ZOOM = 8;
    let zoom = 1;
    let cx = MAP_WIDTH / 2;
    let cy = (topY + bottomY) / 2;
    let selectedId = null;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    function applyView() {
        const w = MAP_WIDTH / zoom;
        const h = baseH / zoom;
        const x = clamp(cx - w / 2, 0, MAP_WIDTH - w);
        const y = clamp(cy - h / 2, topY, bottomY - h);
        cx = x + w / 2;
        cy = y + h / 2;
        svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
        markerEls.forEach((el) => {
            const herb = herbCache[el.dataset.id];
            const size = (el.dataset.id === selectedId ? 1.35 : 1) / zoom;
            el.setAttribute('transform', `translate(${mapX(herb.origin.lng).toFixed(1)} ${mapY(herb.origin.lat).toFixed(1)}) scale(${size.toFixed(3)})`);
        });
        zoomInBtn.disabled = zoom >= MAX_ZOOM;
        zoomOutBtn.disabled = zoom <= MIN_ZOOM;
        frame.classList.toggle('is-zoomed', zoom > 1);
    }

    function setView(newZoom, newCx, newCy) {
        zoom = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
        cx = newCx;
        cy = newCy;
        applyView();
    }

    function selectHerb(id) {
        const herb = herbCache[id];
        if (!herb) return;
        selectedId = id;
        markerEls.forEach((el) => {
            const on = el.dataset.id === id;
            el.classList.toggle('is-selected', on);
            if (on) el.parentNode.appendChild(el);   // draw the selected marker on top
        });
        container.querySelectorAll('.origin-item').forEach((b) => {
            if (b.dataset.origin === id) {
                b.setAttribute('aria-current', 'true');
            } else {
                b.removeAttribute('aria-current');
            }
        });
        document.getElementById('origin-detail').innerHTML = `
            <div class="panel-title">${icon('pin', 'icon-lg')}<h2 id="origin-detail-heading">${escapeHtml(herb.name)}: origin</h2></div>
            <p><strong>${escapeHtml(herb.origin.region)}</strong></p>
            <p>${escapeHtml(herb.origin.details)}</p>
            <p class="small">Marker position: ${Math.abs(herb.origin.lat)}° ${herb.origin.lat >= 0 ? 'N' : 'S'}, ${Math.abs(herb.origin.lng)}° ${herb.origin.lng >= 0 ? 'E' : 'W'}</p>
            <div class="herb-actions">
                <a class="btn btn-primary" href="#${herb.id}">Open the ${escapeHtml(herb.name)} page</a>
                <button type="button" class="btn btn-secondary" id="origin-ask">${icon('chat')}<span>Ask the Guide</span></button>
            </div>
        `;
        document.getElementById('origin-ask').addEventListener('click', () => openChat(`Where does ${herb.name} come from?`));
        if (zoom > 1) setView(zoom, mapX(herb.origin.lng), mapY(herb.origin.lat));
        else applyView();
        announce(`${herb.name} comes from ${herb.origin.region}`);
    }

    zoomInBtn.addEventListener('click', () => setView(zoom * 2, cx, cy));
    zoomOutBtn.addEventListener('click', () => setView(zoom / 2, cx, cy));
    document.getElementById('map-world').addEventListener('click', () => setView(1, MAP_WIDTH / 2, (topY + bottomY) / 2));
    document.getElementById('map-europe').addEventListener('click', () => setView(4, mapX(15), mapY(46)));
    container.querySelectorAll('.origin-item').forEach((b) => b.addEventListener('click', () => selectHerb(b.dataset.origin)));

    // Drag to pan (mouse, pen and touch) when zoomed in. A tiny movement still counts as a click.
    let drag = null;
    frame.addEventListener('pointerdown', (e) => {
        drag = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
    });
    frame.addEventListener('pointermove', (e) => {
        if (!drag || zoom <= 1) return;
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) < 5) return;
        if (!drag.moved) frame.setPointerCapture(drag.id);
        drag.moved = true;
        const unitsPerPixel = (MAP_WIDTH / zoom) / svg.clientWidth;
        cx -= dx * unitsPerPixel;
        cy -= dy * unitsPerPixel;
        drag.x = e.clientX;
        drag.y = e.clientY;
        applyView();
    });
    const endDrag = () => { setTimeout(() => { drag = null; }, 0); };
    frame.addEventListener('pointerup', endDrag);
    frame.addEventListener('pointercancel', endDrag);
    frame.addEventListener('click', (e) => {
        const marker = e.target.closest('.map-marker');
        if (marker && !(drag && drag.moved)) selectHerb(marker.dataset.id);
    });

    applyView();
}

/* ---------- Herb Guide chat bot ----------
   A rule-based assistant that runs in the browser. It reads the visitor's question, finds which herb(s)
   and which topic(s) are meant, and builds the answer from the herb data (data/<id>.json).
   It does not call any outside AI service, so it also works offline.                              */

const HERB_ALIASES = {
    basil: ['basil', 'sweet basil'],
    mint: ['mint', 'spearmint', 'peppermint'],
    lavender: ['lavender', 'english lavender'],
    rosemary: ['rosemary'],
    thyme: ['thyme', 'garden thyme', 'common thyme'],
    sage: ['sage', 'garden sage', 'common sage'],
    chamomile: ['chamomile', 'camomile', 'german chamomile'],
    chives: ['chives', 'chive']
};

const CHAT_SUGGESTIONS = [
    'Is chamomile safe for pets?',
    'How do I harvest mint?',
    'Where does basil come from?',
    'Which herbs help with sleep?',
    'How should I store rosemary?',
    'How much water does lavender need?'
];

// Topics, in the order they are answered. Each one has the words that trigger it.
const CHAT_INTENTS = [
    { id: 'compare', re: /\b(compare|comparison|versus|vs|difference|differences|different)\b/ },
    { id: 'safety', re: /\b(allerg\w*|safe|safety|side effects?|risks?|risky|danger\w*|toxic|poison\w*|pregnan\w*|breastfe\w*|pets?|cats?|dogs?|child|children|kids?|baby|babies|interact\w*|medications?|medicines?|drugs?|warfarin|blood thinners?|sedatives?|sleeping pills?|antidepressants?|diabet\w*|blood pressure|insulin|surgery|caution|avoid|harm\w*|overdose)\b/ },
    { id: 'medicinal', re: /\b(medic\w*|health\w*|benefits?|remed\w*|heal\w*|cures?|treat\w*|good for|help(s)? (with|me|for)?|reliev\w*|ease|sleep\w*|insomnia|anxi\w*|stress\w*|calm\w*|digest\w*|stomach|bloat\w*|nausea|cough\w*|sore throat|cold|flu|skin|burns?|wounds?|memory|focus|antioxidants?|inflammat\w*|nutrition\w*|vitamins?)\b/ },
    { id: 'origin', re: /\b(origin\w*|native|come from|comes from|came from|where .*(from|grow|originate)|countr(y|ies)|map|history|ancient)\b/ },
    { id: 'harvest', re: /\b(harvest\w*|pick\w*|pluck\w*|cut|cutting|prun\w*|snip\w*)\b/ },
    { id: 'storage', re: /\b(stor(e|ed|ing|age)|keep fresh|preserv\w*|dry|dried|drying|freez(e|ing)|frozen|fridge|refrigerat\w*|shelf life)\b/ },
    { id: 'soil', re: /\b(soil|dirt|compost|ph|potting|fertili[sz]\w*|drainage)\b/ },
    { id: 'water', re: /\b(water\w*|irrigat\w*|moist\w*|drought|thirsty|how often)\b/ },
    { id: 'sun', re: /\b(sun\w*|light|shade|shady|indoors?|windowsill|outdoors?)\b/ },
    { id: 'temperature', re: /\b(temperature\w*|frost\w*|cold (weather|winters?|climate)|hardy|hardiness|zone|degrees|heat|hot weather|winter|climate)\b/ },
    { id: 'taste', re: /\b(tastes?|flavou?rs?|smell\w*|aroma\w*|savou?ry)\b/ },
    { id: 'pairings', re: /\b(pair\w*|goes? with|go well|combine|match)\b/ },
    { id: 'lifecycle', re: /\b(annual|perennial|life ?cycle|come back|regrow|plant type|shrub)\b/ },
    { id: 'season', re: /\b(seasons?|spring|summer|autumn|when (to|can|should|do) (i )?(plant|sow|grow))\b/ },
    { id: 'video', re: /\b(videos?|watch|youtube|tutorial)\b/ },
    { id: 'daily', re: /\b(daily|everyday|every day|cook\w*|recipes?|kitchen|how (do|can|should) i use|ways to use|uses?|tea|eat\w*)\b/ },
    { id: 'tips', re: /\b(tips?|advice|care|look after|pests?|mistakes?)\b/ },
    { id: 'growth', re: /\b(grow\w*|plant\w*|sow\w*|cultivat\w*|gardening|conditions?|requirements?|needs?)\b/ },
    { id: 'overview', re: /\b(tell me about|overview|describe|what is|what's|about)\b/ }
];

// Words that mean "list the herbs that ..." (they point to a value of the Smart Herb Filter)
const TAG_KEYWORDS = [
    { re: /\b(sleep\w*|relax\w*|calm\w*|anxi\w*|stress\w*|insomnia|bedtime)\b/, group: 'medicinal', value: 'Relaxation & sleep' },
    { re: /\b(digest\w*|stomach|bloat\w*|indigestion|nausea|appetite)\b/, group: 'medicinal', value: 'Digestion' },
    { re: /\b(cough\w*|throat|cold|flu|chest|congestion)\b/, group: 'medicinal', value: 'Cough & throat' },
    { re: /\b(skin|burns?|wounds?|bites?|rash)\b/, group: 'medicinal', value: 'Skin care' },
    { re: /\b(memory|focus|alert\w*|studying|concentrat\w*)\b/, group: 'medicinal', value: 'Memory & focus' },
    { re: /\bantioxidants?\b/, group: 'medicinal', value: 'Antioxidant support' },
    { re: /\bsweet\b/, group: 'flavor', value: 'Sweet' },
    { re: /\b(peppery|spicy)\b/, group: 'flavor', value: 'Peppery' },
    { re: /\b(minty|cooling|menthol)\b/, group: 'flavor', value: 'Minty' },
    { re: /\bfloral\b/, group: 'flavor', value: 'Floral' },
    { re: /\bearthy\b/, group: 'flavor', value: 'Earthy' },
    { re: /\b(piney|woody)\b/, group: 'flavor', value: 'Piney' },
    { re: /\b(lemony|citrus\w*)\b/, group: 'flavor', value: 'Lemony' },
    { re: /\b(oniony|onion)\b/, group: 'flavor', value: 'Oniony' },
    { re: /\bapple\b/, group: 'flavor', value: 'Apple-like' },
    { re: /\bspring\b/, group: 'season', value: 'Spring' },
    { re: /\bsummer\b/, group: 'season', value: 'Summer' },
    { re: /\b(autumn|fall)\b/, group: 'season', value: 'Autumn' },
    { re: /\bwinter\b/, group: 'season', value: 'Winter' },
    { re: /\bannuals?\b/, group: 'lifecycle', value: 'Annual' },
    { re: /\bperennials?\b/, group: 'lifecycle', value: 'Perennial' },
    { re: /\b(shade|shady)\b/, group: 'sun', value: 'Partial shade' },
    { re: /\bfull sun\b/, group: 'sun', value: 'Full sun' },
    { re: /\b(drought|low water|little water|dry soil)\b/, group: 'water', value: 'Low' },
    { re: /\b(tea|teas)\b/, group: 'usedFor', value: 'Tea' },
    { re: /\b(culinary|cooking)\b/, group: 'usedFor', value: 'Culinary' },
    { re: /\b(aromatic|scent|fragrance|fragrant)\b/, group: 'usedFor', value: 'Aromatic' }
];

const MEDICINE_WORDS = /\b(medications?|medicines?|drugs?|interact\w*|warfarin|blood thinners?|sedatives?|sleeping pills?|antidepressants?|diabet\w*|blood pressure|insulin|surgery)\b/;

let chatStarted = false;
let chatLastHerb = null;

function normalizeText(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s'&-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function findHerbIds(q) {
    const found = [];
    Object.keys(HERB_ALIASES).forEach((id) => {
        for (const alias of HERB_ALIASES[id]) {
            const index = q.search(new RegExp(`\\b${alias}s?\\b`));
            if (index >= 0) { found.push({ id, index }); break; }
        }
    });
    return found.sort((a, b) => a.index - b.index).map((f) => f.id);
}

function firstSentence(text) {
    const match = String(text).match(/^.*?[.!?](\s|$)/);
    return match ? match[0].trim() : String(text);
}

// The answer for one herb and one topic: { lines: [...], list: [...] }
const CHAT_ANSWERS = {
    safety(h, q) {
        const s = h.safety || {};
        let lines;
        let general = false;
        if (/\ballerg/.test(q)) lines = [s.allergy];
        else if (/\b(pregnan|breastfe)/.test(q)) lines = [s.pregnancy];
        else if (/\b(pets?|cats?|dogs?)\b/.test(q)) lines = [s.pets];
        else if (MEDICINE_WORDS.test(q)) lines = [s.medications];
        else if (/\b(child|children|kids?|baby|babies)\b/.test(q)) lines = ['Ask a doctor before giving herbs as medicine to babies and children. ' + (s.allergy ? firstSentence(s.allergy) : '')];
        else { lines = [s.allergy, s.pregnancy, s.pets, s.medications]; general = true; }
        return { lines: lines.filter(Boolean), list: general ? h.sideEffects : null, listTitle: 'Possible side effects:' };
    },
    medicinal(h) {
        const m = h.medicinal || {};
        return { lines: ['Traditional medicinal uses:'], list: (m.uses || []).concat(['Benefits:'].concat(m.benefits || [])), extra: m.caution };
    },
    origin(h) { return { lines: h.origin ? [`${h.origin.region}. ${h.origin.details}`] : [] }; },
    growth(h) {
        const g = h.growingConditions || {};
        return { lines: ['Growing conditions:'], list: [`Sunlight: ${g.sunlight}`, `Watering: ${g.watering}`, `Soil: ${g.soilType}${h.soilPh ? ` (pH ${h.soilPh})` : ''}`, `Temperature: ${h.temperature}`, `Hardiness: ${g.hardinessZone}`] };
    },
    harvest(h) { return { lines: [h.harvest] }; },
    storage(h) { return { lines: [h.storage] }; },
    soil(h) { const g = h.growingConditions || {}; return { lines: [`${g.soilType}.${h.soilPh ? ` The best soil pH is about ${h.soilPh}.` : ''}`] }; },
    water(h) { const g = h.growingConditions || {}; return { lines: [`${g.watering}. Water needs: ${herbValues(h, 'water').join(', ').toLowerCase()}.`] }; },
    sun(h) { const g = h.growingConditions || {}; return { lines: [`${g.sunlight}. It does best in: ${herbValues(h, 'sun').join(' or ').toLowerCase()}.`] }; },
    temperature(h) { const g = h.growingConditions || {}; return { lines: [h.temperature, `Hardiness: ${g.hardinessZone}.`] }; },
    taste(h) { return { lines: [h.taste, `Flavor notes: ${herbValues(h, 'flavor').join(', ').toLowerCase()}.`] }; },
    pairings(h) { return { lines: [`${h.name} goes well with: ${(h.pairings || []).join(', ').toLowerCase()}.`] }; },
    video(h) { return { lines: h.video ? [`Watch "${h.video.title}" on the ${h.name} page. The video is built into the page.`] : [] }; },
    lifecycle(h) { return { lines: [`${h.name} is a ${herbValues(h, 'plantType').join(', ').toLowerCase()} and a ${herbValues(h, 'lifecycle').join(', ').toLowerCase()}.`] }; },
    season(h) { return { lines: [`Best harvest seasons: ${herbValues(h, 'season').join(', ')}.`, h.temperature] }; },
    daily(h) { return { lines: [`Using ${h.name} in daily life:`], list: h.dailyLife || h.uses }; },
    tips(h) { return { lines: [`Tips for ${h.name}:`], list: h.tips }; },
    compare(h) {
        const g = h.growingConditions || {};
        return { lines: [`Taste: ${h.taste}`, `Type: ${herbValues(h, 'plantType').join(', ').toLowerCase()}, ${herbValues(h, 'lifecycle').join(', ').toLowerCase()}`, `Sunlight: ${g.sunlight}`, `Watering: ${g.watering}`, h.sideEffects ? `Main caution: ${h.sideEffects[0]}` : ''] };
    },
    overview(h) { return { lines: [h.description, `Taste: ${h.taste}`, h.origin ? `Origin: ${h.origin.region}.` : ''] }; }
};

function answerQuestion(rawText) {
    const q = normalizeText(rawText);
    const herbs = loadedHerbs();
    const blocks = [];
    const links = [];
    const reply = (extra) => Object.assign({ blocks, links }, extra);

    if (herbs.length === 0) {
        return { blocks: [{ lines: ['I could not load the herb data. Please run the site from a web server (for example "npx serve") and try again.'] }], links: [] };
    }

    // Small talk
    if (/^(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/.test(q) && q.split(' ').length <= 4) {
        return { blocks: [{ lines: ['Hello! Ask me about any of our eight herbs: safety and allergies, medicinal use, origin, growing, harvesting, storage and daily use.'] }], links: [] };
    }
    if (/\b(thanks|thank you|thx)\b/.test(q)) {
        return { blocks: [{ lines: ['You are welcome! Ask me anything else about the herbs.'] }], links: [] };
    }
    if ((/^(help|help me|menu)$/.test(q) || /\b(what can you do|what do you know|what topics|what can i ask)\b/.test(q)) && findHerbIds(q).length === 0) {
        return { blocks: [{ lines: ['I know the eight herbs in this garden: ' + herbs.map((h) => h.name).join(', ') + '.'], list: ['Allergy, safety and side effects', 'Medicinal uses and benefits', 'Origin (and the origin map)', 'Growing conditions: soil, water, sunlight and temperature', 'Harvesting and storing after harvest', 'Taste, daily life uses and tips'] }], links: [] };
    }

    let ids = findHerbIds(q);

    // "Which herbs ...?" questions that use the filter values
    const wantsList = /\b(which|what|any|list|show|recommend|suggest|best)\b/.test(q) && ids.length === 0;
    if (wantsList) {
        const asksPets = /\b(pets?|cats?|dogs?)\b/.test(q);
        if (asksPets) {
            const safe = herbs.filter((h) => h.safety && h.safety.petSafe).map((h) => h.name);
            const unsafe = herbs.filter((h) => h.safety && !h.safety.petSafe).map((h) => h.name);
            blocks.push({ lines: [`Generally regarded as safe for cats and dogs in small amounts: ${safe.join(', ')}.`, `Can upset or harm pets (keep out of reach): ${unsafe.join(', ')}.`, 'Always check with a vet if a pet has eaten a plant.'] });
            return reply();
        }
        const matches = [];
        TAG_KEYWORDS.forEach((tag) => { if (tag.re.test(q)) matches.push(tag); });
        const shrub = /\bshrubs?\b/.test(q);
        if (matches.length || shrub) {
            let result = herbs;
            const labels = [];
            matches.forEach((tag) => {
                result = result.filter((h) => herbValues(h, tag.group).includes(tag.value));
                labels.push(tag.value.toLowerCase());
            });
            if (shrub) {
                result = result.filter((h) => herbValues(h, 'plantType').some((t) => /shrub/i.test(t)));
                labels.push('shrub');
            }
            if (result.length) {
                blocks.push({ lines: [`Herbs that match "${labels.join(' + ')}": ${result.map((h) => h.name).join(', ')}.`, 'You can also use the Smart filters on the home page.'] });
                result.forEach((h) => links.push({ label: `Open ${h.name}`, href: `#${h.id}` }));
            } else {
                blocks.push({ lines: [`None of our herbs match "${labels.join(' + ')}" at the same time. Try fewer words.`] });
            }
            return reply();
        }
    }

    // Topics asked about
    let intents = CHAT_INTENTS.filter((intent) => intent.re.test(q)).map((i) => i.id);
    const strongDaily = /\b(daily|everyday|every day|cook\w*|recipes?|kitchen)\b/.test(q);
    if (intents.includes('safety')) intents = intents.filter((i) => i !== 'medicinal' && (i !== 'daily' || strongDaily));
    if (intents.includes('medicinal') && !strongDaily) intents = intents.filter((i) => i !== 'daily');
    const specific = ['storage', 'harvest', 'soil', 'water', 'sun', 'temperature', 'season', 'lifecycle', 'tips', 'origin', 'taste', 'pairings', 'video'];
    if (intents.some((i) => specific.includes(i))) intents = intents.filter((i) => i !== 'growth');
    if (intents.includes('storage')) intents = intents.filter((i) => i !== 'temperature');
    if (intents.includes('overview')) intents = intents.length > 1 && !intents.every((i) => i === 'overview' || i === 'growth') ? intents.filter((i) => i !== 'overview') : ['overview'];
    intents = intents.slice(0, 3);

    // Which herb? (use the one talked about last, if none is named)
    let assumed = false;
    if (ids.length === 0 && chatLastHerb && (intents.length > 0 || /\b(it|its|this herb|that herb)\b/.test(q))) {
        ids = [chatLastHerb];
        assumed = true;
    }
    if (ids.length === 0) {
        if (intents.includes('safety')) {
            blocks.push({ heading: 'Allergy and safety at a glance', lines: [], list: herbs.map((h) => `${h.name}: ${firstSentence(h.safety.allergy)}`) });
            blocks.push({ lines: ['Name a herb to hear all its safety details, for example "Is basil safe in pregnancy?"'] });
            blocks.push({ lines: ['This is general information, not medical advice. Please check with a doctor or pharmacist.'] });
            return reply();
        }
        blocks.push({ lines: intents.length
            ? ['Which herb do you mean? I know ' + herbs.map((h) => h.name).join(', ') + '.']
            : ['I am not sure about that one. I can answer questions about the eight herbs in this garden: ' + herbs.map((h) => h.name).join(', ') + '. Try "How do I harvest mint?" or "Is chamomile safe for pets?"'] });
        return reply();
    }

    ids = ids.slice(0, 3);
    chatLastHerb = ids[ids.length - 1];
    if (assumed) blocks.push({ lines: [`(I am assuming you mean ${herbName(ids[0])}.)`] });
    if (intents.includes('compare')) intents = ids.length > 1 ? ['compare'] : ['overview'];
    if (ids.length > 1 && intents.length === 0) intents = ['compare'];
    if (intents.length === 0) intents = ['overview'];

    ids.forEach((id) => {
        const h = herbCache[id];
        if (!h) return;
        intents.forEach((intent) => {
            const out = CHAT_ANSWERS[intent](h, q);
            const lines = (out.lines || []).filter(Boolean);
            if (lines.length === 0 && !(out.list && out.list.length)) return;
            const heading = ids.length > 1 || intents.length > 1 ? `${h.name}${ids.length > 1 || intents.length > 1 ? ' - ' + intentLabel(intent) : ''}` : null;
            blocks.push({ heading, lines, list: out.list, listTitle: out.listTitle });
            if (out.extra) blocks.push({ lines: [out.extra] });
        });
        links.push({ label: `Open the ${h.name} page`, href: `#${h.id}` });
        if (intents.includes('origin')) links.push({ label: 'Open the origin map', href: '#map' });
    });
    if (ids.length === 2) links.push({ label: `Compare ${herbName(ids[0])} and ${herbName(ids[1])}`, href: '#compare', compare: [ids[0], ids[1]] });
    if (intents.includes('safety') || intents.includes('medicinal')) {
        blocks.push({ lines: ['This is general information from the garden data, not medical advice. Please check with a doctor or pharmacist.'] });
    }
    return reply();
}

function intentLabel(intent) {
    const labels = { safety: 'safety', medicinal: 'medicinal use', origin: 'origin', growth: 'growing conditions', harvest: 'harvesting', storage: 'storage', soil: 'soil', water: 'watering', sun: 'sunlight', temperature: 'temperature', taste: 'taste', compare: 'comparison', pairings: 'pairings', lifecycle: 'plant type', season: 'seasons', video: 'video', daily: 'daily life', tips: 'tips', overview: 'overview' };
    return labels[intent] || intent;
}

/* ---- chat window ---- */

function addChatMessage(role, content) {
    const log = document.getElementById('chat-log');
    const message = document.createElement('div');
    message.className = `msg msg-${role}`;

    const who = document.createElement('span');
    who.className = 'visually-hidden';
    who.textContent = role === 'user' ? 'You said: ' : 'Herb Guide says: ';
    message.appendChild(who);

    (content.blocks || []).forEach((block) => {
        if (block.heading) {
            const heading = document.createElement('p');
            heading.className = 'msg-heading';
            heading.textContent = block.heading;
            message.appendChild(heading);
        }
        (block.lines || []).forEach((line) => {
            const p = document.createElement('p');
            p.textContent = line;
            message.appendChild(p);
        });
        if (block.list && block.list.length) {
            if (block.listTitle) {
                const t = document.createElement('p');
                t.textContent = block.listTitle;
                message.appendChild(t);
            }
            const ul = document.createElement('ul');
            block.list.forEach((item) => {
                const li = document.createElement('li');
                li.textContent = item;
                ul.appendChild(li);
            });
            message.appendChild(ul);
        }
    });

    if (content.links && content.links.length) {
        const row = document.createElement('p');
        row.className = 'msg-links';
        content.links.forEach((link) => {
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.label;
            if (link.compare) a.dataset.compare = link.compare.join(',');
            row.appendChild(a);
        });
        message.appendChild(row);
    }

    log.appendChild(message);
    log.scrollTop = log.scrollHeight;
}

async function askGuide(text) {
    const question = text.trim();
    if (!question) return;
    addChatMessage('user', { blocks: [{ lines: [question] }] });
    try {
        await loadAllHerbs();
    } catch (err) { /* answerQuestion explains when no data is available */ }
    addChatMessage('bot', answerQuestion(question));
}

async function openChat(question) {
    const dialog = document.getElementById('chat-dialog');
    if (!dialog.open) dialog.showModal();
    if (!chatStarted) {
        chatStarted = true;
        addChatMessage('bot', { blocks: [{ lines: ['Hello! I am the Herb Guide. Ask me about allergies and safety, medicinal use, origin, growing conditions, harvesting, storage and daily use of our eight herbs.'] }] });
    }
    if (question) {
        await askGuide(question);
    }
    document.getElementById('chat-input').focus();
}

function setupChat() {
    const dialog = document.getElementById('chat-dialog');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const suggestions = document.getElementById('chat-suggestions');
    if (!dialog || !form) return;

    suggestions.innerHTML = CHAT_SUGGESTIONS.map((text) => `<button type="button" class="chip-btn">${escapeHtml(text)}</button>`).join('');
    suggestions.addEventListener('click', (e) => {
        const button = e.target.closest('.chip-btn');
        if (button) askGuide(button.textContent).then(() => input.focus());
    });

    document.getElementById('chat-btn').addEventListener('click', () => openChat());
    document.getElementById('chat-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value;
        input.value = '';
        askGuide(text).then(() => input.focus());
    });

    // A link in an answer closes the window and goes to the page
    document.getElementById('chat-log').addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        if (link.dataset.compare) compareSelection = link.dataset.compare.split(',');
        dialog.close();
    });
}

/* ---------- Mobile menu ---------- */

function closeMenu() {
    const menu = document.getElementById('site-menu');
    const button = document.getElementById('menu-toggle');
    if (!menu || !button) return;
    menu.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
}

function setupMenu() {
    const menu = document.getElementById('site-menu');
    const button = document.getElementById('menu-toggle');
    if (!menu || !button) return;

    button.addEventListener('click', () => {
        const open = menu.classList.toggle('is-open');
        button.setAttribute('aria-expanded', String(open));
    });
    // Choosing something in the menu closes it
    menu.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) closeMenu();
    });
    // Esc closes the menu and returns focus to the Menu button
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) {
            closeMenu();
            button.focus();
        }
    });
}

/* ---------- Events ---------- */

function setupEventListeners() {
    const randomBtn = document.getElementById('random-herb-btn');
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            const currentHash = window.location.hash.replace('#', '').toLowerCase();
            const available = HERB_REGISTRY.filter((h) => h.id !== currentHash);
            const randomChoice = available[Math.floor(Math.random() * available.length)];
            window.location.hash = `#${randomChoice.id}`;
        });
    }

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => setPref('dark', !prefs.dark));
    }

    // Accessibility settings popup
    const dialog = document.getElementById('a11y-dialog');
    if (dialog) {
        document.getElementById('a11y-btn').addEventListener('click', () => {
            applyPrefs();
            dialog.showModal();
        });
        document.getElementById('a11y-close').addEventListener('click', () => dialog.close());
        document.getElementById('a11y-done').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
        dialog.addEventListener('close', () => document.getElementById('a11y-btn').focus());

        document.getElementById('opt-dark').addEventListener('change', (e) => setPref('dark', e.target.checked));
        document.getElementById('opt-contrast').addEventListener('change', (e) => setPref('contrast', e.target.checked));
        document.getElementById('opt-motion').addEventListener('change', (e) => setPref('motion', e.target.checked));
        dialog.querySelectorAll('input[name="text-size"]').forEach((radio) => {
            radio.addEventListener('change', () => { if (radio.checked) setPref('text', radio.value); });
        });
        document.getElementById('a11y-reset').addEventListener('click', () => {
            resetPrefs();
            announce('Accessibility settings reset to the defaults');
        });
    }
}

/* ---------- Accessibility settings: dark mode, high contrast, text size, reduced motion ---------- */

let prefs = { dark: false, contrast: false, motion: false, text: 'normal' };

function systemPrefersDark() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

function initPreferences() {
    let saved = {};
    try { saved = JSON.parse(storageGet(STORAGE_KEYS.a11y) || '{}') || {}; } catch (e) { saved = {}; }
    const storedTheme = storageGet(STORAGE_KEYS.theme);
    prefs = {
        dark: storedTheme === null ? systemPrefersDark() : storedTheme === 'dark',
        contrast: saved.contrast === true,
        motion: saved.motion === true,
        text: ['normal', 'large', 'xlarge'].includes(saved.text) ? saved.text : 'normal'
    };
    applyPrefs();
}

function applyPrefs() {
    const root = document.documentElement;
    root.classList.toggle('dark', prefs.dark);
    root.classList.toggle('hc', prefs.contrast);
    root.classList.toggle('reduce-motion', prefs.motion);
    root.classList.toggle('text-large', prefs.text === 'large');
    root.classList.toggle('text-xlarge', prefs.text === 'xlarge');

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.setAttribute('aria-pressed', String(prefs.dark));
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.checked = value; };
    set('opt-dark', prefs.dark);
    set('opt-contrast', prefs.contrast);
    set('opt-motion', prefs.motion);
    document.querySelectorAll('input[name="text-size"]').forEach((radio) => { radio.checked = radio.value === prefs.text; });
}

function setPref(name, value) {
    prefs[name] = value;
    applyPrefs();
    if (name === 'dark') {
        storageSet(STORAGE_KEYS.theme, value ? 'dark' : 'light');
    } else {
        storageSet(STORAGE_KEYS.a11y, JSON.stringify({ contrast: prefs.contrast, motion: prefs.motion, text: prefs.text }));
    }
}

function resetPrefs() {
    storageRemove(STORAGE_KEYS.theme);
    storageRemove(STORAGE_KEYS.a11y);
    prefs = { dark: systemPrefersDark(), contrast: false, motion: false, text: 'normal' };
    applyPrefs();
}

/* ---------- Contact Us popup + Thank you popup ---------- */

const THANKS_SECONDS = 5;

function setupContactForm() {
    const openBtn = document.getElementById('contact-btn');
    const dialog = document.getElementById('contact-dialog');
    const thanks = document.getElementById('thanks-dialog');
    const form = document.getElementById('contact-form');
    if (!openBtn || !dialog || !thanks || !form) return;

    let thanksTimer = null;

    const fields = {
        name: {
            input: document.getElementById('contact-name'),
            error: document.getElementById('contact-name-error'),
            check: (v) => (v.trim() ? '' : 'Please enter your name.')
        },
        email: {
            input: document.getElementById('contact-email'),
            error: document.getElementById('contact-email-error'),
            check: (v, input) => {
                if (!v.trim()) return 'Please enter your email address.';
                return input.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
                    ? 'Please enter a valid email address, for example name@example.com.'
                    : '';
            }
        },
        message: {
            input: document.getElementById('contact-message'),
            error: document.getElementById('contact-message-error'),
            check: (v) => {
                if (!v.trim()) return 'Please write a message.';
                return v.trim().length < 10 ? 'Please write at least 10 characters.' : '';
            }
        }
    };

    function showError(field, message) {
        field.error.hidden = !message;
        field.error.textContent = message ? `Error: ${message}` : '';
        if (message) {
            field.input.setAttribute('aria-invalid', 'true');
        } else {
            field.input.removeAttribute('aria-invalid');
        }
    }

    function clearErrors() {
        Object.values(fields).forEach((f) => showError(f, ''));
    }

    function closeThanks() {
        clearTimeout(thanksTimer);
        if (thanks.open) thanks.close();
    }

    // Open the contact form
    openBtn.addEventListener('click', () => {
        clearErrors();
        dialog.showModal();
        fields.name.input.focus();
    });

    // Close the contact form
    const closeContact = () => { clearErrors(); dialog.close(); };
    document.getElementById('contact-close').addEventListener('click', closeContact);
    document.getElementById('contact-cancel').addEventListener('click', closeContact);

    // A click on the dark background closes a popup (clicks inside the box do not)
    [dialog, thanks].forEach((d) => {
        d.addEventListener('click', (e) => { if (e.target === d) { d === thanks ? closeThanks() : closeContact(); } });
    });

    // Clear a field's error as soon as the visitor fixes it
    Object.values(fields).forEach((f) => {
        f.input.addEventListener('input', () => { if (!f.error.hidden) showError(f, f.check(f.input.value, f.input)); });
    });

    // Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        let firstInvalid = null;
        let count = 0;
        Object.values(fields).forEach((f) => {
            const message = f.check(f.input.value, f.input);
            showError(f, message);
            if (message) {
                count++;
                if (!firstInvalid) firstInvalid = f.input;
            }
        });

        if (firstInvalid) {
            announce(count === 1 ? 'The form has 1 error. Please fix it and send again.' : `The form has ${count} errors. Please fix them and send again.`);
            firstInvalid.focus();
            return;
        }

        // Nothing is sent anywhere (this site has no server code): show the thank-you popup
        form.reset();
        clearErrors();
        dialog.close();
        thanks.showModal();
        announce('Thank you for contacting us. Your message has been submitted.');
        clearTimeout(thanksTimer);
        thanksTimer = setTimeout(closeThanks, THANKS_SECONDS * 1000);
    });

    document.getElementById('thanks-close').addEventListener('click', closeThanks);

    // Whenever the thank-you popup closes (timer, button, Esc or background), stop the timer and return focus
    thanks.addEventListener('close', () => {
        clearTimeout(thanksTimer);
        openBtn.focus();
    });
}

/* ---------- Footer testimonial slider (circular "orbit") ---------- */

const SLIDE_SECONDS = 8;

async function initTestimonials() {
    const slider = document.getElementById('testimonial-slider');
    if (!slider) return;

    let items = [];
    try {
        const response = await fetch('./data/testimonials.json');
        if (!response.ok) throw new Error('not found');
        const data = await response.json();
        items = Array.isArray(data.testimonials) ? data.testimonials : [];
    } catch (err) {
        items = [];
    }
    if (items.length === 0) {
        slider.innerHTML = '<p class="small">The testimonials could not be loaded right now.</p>';
        return;
    }

    const herbName = (id) => {
        const herb = HERB_REGISTRY.find((h) => h.id === id);
        return herb ? herb.name : id;
    };
    const initials = (name) => name.replace(/^Dr\.?\s+/i, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

    slider.innerHTML = `
        <div class="orbit" style="--count: ${items.length}">
            <div class="slider-viewport" id="slider-viewport" aria-live="off">
                ${items.map((item, i) => `
                    <div class="slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${items.length}: ${escapeHtml(herbName(item.herb))}">
                        <span class="avatar" aria-hidden="true">${escapeHtml(initials(item.name))}</span>
                        <blockquote><p>${escapeHtml(item.quote)}</p></blockquote>
                        <figcaption class="person">
                            <span class="person-name">${escapeHtml(item.name)}</span>
                            <span class="person-role">${escapeHtml(item.role)}</span>
                        </figcaption>
                    </div>
                `).join('')}
            </div>
            <div class="slider-dots">
                ${items.map((item, i) => `
                    <button type="button" class="dot" style="--i: ${i}" data-index="${i}" aria-label="Show testimonial ${i + 1} of ${items.length}: ${escapeHtml(herbName(item.herb))}"></button>
                `).join('')}
            </div>
        </div>
        <div class="slider-controls">
            <button type="button" class="btn btn-secondary round-btn" id="slider-prev" aria-label="Previous testimonial" title="Previous">${icon('chevron-left')}</button>
            <button type="button" class="btn btn-secondary round-btn" id="slider-toggle"></button>
            <button type="button" class="btn btn-secondary round-btn" id="slider-next" aria-label="Next testimonial" title="Next">${icon('chevron-right')}</button>
        </div>
        <a class="slide-herb" id="slider-herb" href="#"></a>
    `;

    const viewport = document.getElementById('slider-viewport');
    const slides = Array.from(slider.querySelectorAll('.slide'));
    const dots = Array.from(slider.querySelectorAll('.dot'));
    const toggleBtn = document.getElementById('slider-toggle');
    const herbLink = document.getElementById('slider-herb');
    const reduceMotion = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || document.documentElement.classList.contains('reduce-motion');

    let current = 0;
    let playing = !reduceMotion;   // automatic rotation is off for people who ask for reduced motion
    let hovering = false;          // temporarily paused while the mouse or keyboard focus is on the slider
    let timer = null;

    function show(index) {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
        dots.forEach((dot, i) => {
            // Roving tabindex: Tab stops on the current dot only, the arrow keys reach the others
            dot.tabIndex = i === current ? 0 : -1;
            if (i === current) {
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.removeAttribute('aria-current');
            }
        });
        const herbId = items[current].herb;
        herbLink.href = `#${herbId}`;
        herbLink.textContent = `Read about ${herbName(herbId)}`;
    }

    // The Pause/Play button is built once; only its icon and label are changed, and only when they differ,
    // so a click that is in progress is never interrupted.
    toggleBtn.innerHTML = icon('pause');
    const toggleUse = toggleBtn.querySelector('use');

    function updateToggle() {
        const iconRef = playing ? '#i-pause' : '#i-play';
        if (toggleUse.getAttribute('href') !== iconRef) toggleUse.setAttribute('href', iconRef);
        const label = playing ? 'Pause automatic testimonial rotation' : 'Start automatic testimonial rotation';
        toggleBtn.setAttribute('aria-label', label);
        toggleBtn.title = playing ? 'Pause' : 'Play';
        // Screen readers hear a new slide when it changes by hand or when rotation is paused, but not while it rotates by itself
        viewport.setAttribute('aria-live', playing && !hovering ? 'off' : 'polite');
    }

    function restartTimer() {
        clearInterval(timer);
        timer = null;
        if (playing && !hovering) {
            timer = setInterval(() => show(current + 1), SLIDE_SECONDS * 1000);
        }
    }

    function go(index, moveFocusToDot) {
        show(index);
        if (moveFocusToDot) dots[current].focus();
        restartTimer();
    }

    document.getElementById('slider-prev').addEventListener('click', () => go(current - 1));
    document.getElementById('slider-next').addEventListener('click', () => go(current + 1));
    dots.forEach((dot) => dot.addEventListener('click', () => go(Number(dot.dataset.index))));
    toggleBtn.addEventListener('click', () => {
        playing = !playing;
        updateToggle();
        restartTimer();
    });

    // Pause while the visitor is reading (mouse over or keyboard focus inside)
    const setHover = (value) => { hovering = value; updateToggle(); restartTimer(); };
    slider.addEventListener('mouseenter', () => setHover(true));
    slider.addEventListener('mouseleave', () => setHover(false));
    slider.addEventListener('focusin', () => setHover(true));
    slider.addEventListener('focusout', (e) => { if (!slider.contains(e.relatedTarget)) setHover(false); });

    // Arrow keys (and Home / End) move between slides when focus is inside the slider
    slider.addEventListener('keydown', (e) => {
        const onDot = e.target.classList && e.target.classList.contains('dot');
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(current - 1, onDot); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(current + 1, onDot); }
        if (onDot && e.key === 'Home') { e.preventDefault(); go(0, true); }
        if (onDot && e.key === 'End') { e.preventDefault(); go(slides.length - 1, true); }
    });

    // Swipe (touch, pen) or drag (mouse) left or right on the disc
    let swipeStartX = null;
    viewport.addEventListener('pointerdown', (e) => { swipeStartX = e.clientX; });
    viewport.addEventListener('pointerup', (e) => {
        if (swipeStartX === null) return;
        const dx = e.clientX - swipeStartX;
        swipeStartX = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? current + 1 : current - 1);
    });
    viewport.addEventListener('pointercancel', () => { swipeStartX = null; });

    show(0);
    updateToggle();
    restartTimer();
}
