/**
 * The Little Herb Garden - Single Page Application
 * Plain JavaScript + the DOM. No libraries, no frameworks.
 *
 *  - Hash router:   (empty) = catalog, #about, #visit, #<herb-id> = herb page
 *  - Herb data:     fetched from data/<herb-id>.json
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
let routeToken = 0;       // ignores late fetch results when the visitor has already moved on
let firstRender = true;   // do not steal focus on the very first page load

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    setupContactForm();
    initTestimonials();
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

/* ---------- Router ---------- */

async function handleRouting() {
    const rawHash = window.location.hash.replace('#', '').trim().toLowerCase();
    const viewport = document.getElementById('app-viewport');
    const token = ++routeToken;

    updateNav(rawHash);

    if (!rawHash) {
        renderCatalogView(viewport);
        finishRender('Home');
        return;
    }
    if (rawHash === 'about') {
        renderAboutView(viewport);
        finishRender('About Us');
        return;
    }
    if (rawHash === 'visit') {
        renderVisitView(viewport);
        finishRender('Visit');
        return;
    }

    renderLoadingView(viewport);
    announce('Loading herb details');

    try {
        let herbData = null;
        // Only ids from the catalog are valid herb files
        if (/^[a-z0-9-]+$/.test(rawHash)) {
            const response = await fetch(`./data/${rawHash}.json`);
            if (response.ok) {
                herbData = await response.json();
            }
        }
        if (token !== routeToken) return;   // the visitor already went elsewhere

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
                : 'An unexpected error occurred while loading this herb profile. Please check your connection and try again.'
        );
        finishRender('Error');
    }
}

// Marks the current page in the header navigation (aria-current)
function updateNav(hash) {
    const map = { 'nav-home': '', 'nav-about': 'about', 'nav-visit': 'visit' };
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
}

// Redraws only the results, so the search box keeps focus while typing
function renderResults(shouldAnnounce) {
    const query = currentSearchQuery.trim().toLowerCase();
    const filteredHerbs = HERB_REGISTRY.filter((herb) =>
        herb.name.toLowerCase().includes(query) ||
        herb.botanicalName.toLowerCase().includes(query) ||
        herb.category.toLowerCase().includes(query) ||
        herb.summary.toLowerCase().includes(query)
    );

    document.getElementById('result-count').textContent = filteredHerbs.length;
    const target = document.getElementById('herb-results');

    if (filteredHerbs.length === 0) {
        target.innerHTML = `
            <div class="empty">
                ${icon('leaf', 'icon-lg')}
                <p>No herbs found matching "${escapeHtml(currentSearchQuery)}".</p>
                <button type="button" id="reset-search-btn" class="btn btn-soft">Clear Search Filter</button>
            </div>
        `;
        document.getElementById('reset-search-btn').addEventListener('click', () => {
            currentSearchQuery = '';
            const input = document.getElementById('herb-search');
            input.value = '';
            document.getElementById('clear-search-btn').hidden = true;
            renderResults(true);
            input.focus();
        });
    } else {
        target.innerHTML = `
            <ul class="card-grid">
                ${filteredHerbs.map((herb) => `
                    <li>
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
                            </div>
                            <div class="card-more" aria-hidden="true"><span>View Details</span>${icon('arrow-right')}</div>
                        </article>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    if (shouldAnnounce) {
        announce(filteredHerbs.length === 1 ? '1 herb found' : `${filteredHerbs.length} herbs found`);
    }
}

function renderHerbDetailView(container, herb) {
    const name = escapeHtml(herb.name);
    const list = (items) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const growing = herb.growingConditions || {};
    const validVideo = herb.video && /^[A-Za-z0-9_-]{11}$/.test(herb.video.youtubeId || '');

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
                    </dl>
                </section>

                <section class="panel" aria-labelledby="uses-heading">
                    <div class="panel-title">${icon('utensils', 'icon-lg')}<h2 id="uses-heading">Culinary &amp; Popular Uses</h2></div>
                    <ul class="bullets">${list(herb.uses || [])}</ul>
                    ${herb.pairings ? `
                        <h3 class="subhead">Perfect Flavor Pairings</h3>
                        <ul class="chips" aria-label="Flavor pairings">
                            ${herb.pairings.map((item) => `<li class="chip">${escapeHtml(item)}</li>`).join('')}
                        </ul>
                    ` : ''}
                </section>
            </div>

            ${herb.medicinal ? `
                <section class="panel" aria-labelledby="medicinal-heading">
                    <div class="panel-title">${icon('heart', 'icon-lg')}<h2 id="medicinal-heading">Medicinal Uses &amp; Benefits</h2></div>
                    <div class="grid-2">
                        <div>
                            <h3 class="subhead">Traditional Medicinal Uses</h3>
                            <ul class="bullets">${list(herb.medicinal.uses || [])}</ul>
                        </div>
                        <div>
                            <h3 class="subhead">Health Benefits</h3>
                            <ul class="bullets">${list(herb.medicinal.benefits || [])}</ul>
                        </div>
                    </div>
                    ${herb.medicinal.caution ? `<p class="note">${icon('info')}<span><strong>Good to know:</strong> ${escapeHtml(herb.medicinal.caution)}</span></p>` : ''}
                    <p class="small">This information is for general interest only and is not medical advice. Please talk to a doctor or pharmacist before using herbs as medicine.</p>
                </section>
            ` : ''}

            ${validVideo ? `
                <section class="panel" aria-labelledby="video-heading">
                    <div class="panel-title">${icon('video', 'icon-lg')}<h2 id="video-heading">Watch &amp; Learn</h2></div>
                    <figure class="video">
                        <div class="video-frame">
                            <iframe
                                src="https://www.youtube-nocookie.com/embed/${herb.video.youtubeId}?rel=0&amp;cc_load_policy=1"
                                title="Video about ${name}: ${escapeHtml(herb.video.title)}"
                                loading="lazy"
                                allow="encrypted-media; picture-in-picture; fullscreen"
                                referrerpolicy="strict-origin-when-cross-origin"></iframe>
                        </div>
                        <figcaption>${escapeHtml(herb.video.title)} (video from YouTube, with captions turned on where available)</figcaption>
                    </figure>
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
        themeBtn.addEventListener('click', toggleTheme);
    }
}

/* ---------- Dark mode (remembered in localStorage when available) ---------- */

function readStoredTheme() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
}

function applyTheme(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('aria-pressed', String(isDark));
}

function initTheme() {
    const stored = readStoredTheme();
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(stored === 'dark' || (stored === null && prefersDark));
}

function toggleTheme() {
    const makeDark = !document.documentElement.classList.contains('dark');
    applyTheme(makeDark);
    try { localStorage.setItem('theme', makeDark ? 'dark' : 'light'); } catch (e) { /* storage blocked */ }
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
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    // Swipe left or right on touch screens
    let touchStartX = null;
    viewport.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    viewport.addEventListener('touchend', (e) => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? current + 1 : current - 1);
    }, { passive: true });

    show(0);
    updateToggle();
    restartTimer();
}
