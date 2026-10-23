# The Little Herb Garden
Modified by:
1. Mahesh Kumar and Cloud AI :-D Supported by Copilot.


A small website for day 1 of Frontend Development.

It is fixed by @pepe Josef Pospisil

## What you need

- a GitHub account
- Git
- an editor
- a browser (Firefox recommended)
- Node.js (the LTS version), which brings `npx`

## Get your copy

1. Fork this repository to your GitHub account.
2. Clone your fork, not this repository:

   ```
   git clone https://github.com/<your-name>/culs-frontend-day1.git
   cd culs-frontend-day1
   ```

## Run it

Start a small web server in the project folder:

```
npx serve
```

The first time, npx asks whether to install serve. Answer y.

Then open the address it prints, usually http://localhost:3000.
Stop the server with Ctrl+C.

Do not open index.html by double-clicking it. A file:// page is not the Web.

## Your mission

Something is wrong. Several things, in fact.

1. Inspect before you change anything: the page, the Console, the Network panel, the Inspector.
2. Pick one problem and find out why it happens.
3. Fix it, reload, verify.
4. Commit that one fix, with a message that says what you fixed.
5. Repeat.

You are done when:

- the Console shows no unexplained errors
- the Network panel shows no missing files
- every link on the page goes where it says
- git status is clean, and git push has sent your commits to GitHub

## The project

index.html    the page  
style.css     how it looks  
app.js        what it does  
data/         the herbs, as JSON  
images/       the logo and a picture  

---

# Website documentation

Everything below describes the current version of the website (version 8).

**Contents:** [Technology](#technology) · [Project structure](#project-structure) · [What is in each file](#what-is-in-each-file) · [Features and how to use them](#features-and-how-to-use-them) · [How routing works](#how-routing-works) · [JSON formats](#json-formats) · [How to add a new herb](#how-to-add-a-new-herb) · [Accessibility](#accessibility) · [Mobile and small screens](#mobile-and-small-screens) · [Data saved in the browser](#data-saved-in-the-browser) · [Limits of this version](#limits-of-this-version) · [Documentation rule and change history](#documentation-rule-and-change-history) · [Deploy on GitHub Pages](#deploy-on-github-pages)

## Technology

The site is built with **only HTML, CSS, JavaScript and the DOM**. There is no framework, no library, no build step, no icon font, no map library, no AI service and no CDN script or stylesheet.

- Icons are inline SVG, defined once in a sprite at the top of `index.html`.
- The world map is plain SVG that JavaScript draws from the outlines in `data/worldmap.json`.
- The Herb Guide chat bot is plain JavaScript that reads the herb JSON files. It runs in the browser and needs no internet.
- Saved herbs and settings use `localStorage`, which is a built-in browser feature.
- Fonts are the visitor's own system fonts.
- Content that comes from outside is limited to the herb photos (Unsplash) and the embedded videos (YouTube, through `youtube-nocookie.com`).

## Project structure

```
index.html              the page shell (header, main, popups, footer)
style.css               all styling (light, dark and high-contrast colours, layout, all features)
app.js                  all behaviour (router, pages, filter, compare, quiz, basket, map, chat, settings, slider)
data/
  basil.json            one file per herb ...
  mint.json
  lavender.json
  rosemary.json
  thyme.json
  sage.json
  chamomile.json
  chives.json
  testimonials.json     the testimonials in the footer slider
  quiz.json             the question bank of the Herb Quiz
  worldmap.json         simplified continent outlines for the origin map
images/
  logo.svg              site logo and favicon
  garden.svg            backup picture when a herb photo cannot load
  sage.svg              pictures (illustrations) of the three newest herbs
  chamomile.svg
  chives.svg
README.md               this documentation
```

## What is in each file

| File | Purpose |
| --- | --- |
| `index.html` | The page shell: skip link, icon sprite, header with the mobile menu and navigation, the floating chat button, `<main>`, the Accessibility, Herb Guide, Contact Us and Thank you popups, the footer with the testimonial slider, and a live region for screen reader announcements. |
| `style.css` | All styling: colour variables (light, dark and high contrast), responsive layout, text-size classes, and the styles of every feature, plus focus, reduced-motion and forced-colours rules. |
| `app.js` | The router and all pages and features. It is divided into labelled sections: state and storage, router, basket, filter, catalog, herb page, compare, quiz, origin map, Herb Guide, mobile menu, accessibility settings, Contact Us popup and testimonial slider. |
| `data/<herb>.json` | One file per herb (8 files). See the herb format below. |
| `data/testimonials.json` | The eight testimonials shown in the footer slider (one per herb). |
| `data/quiz.json` | 16 quiz questions. Each quiz uses 8 of them, chosen at random. |
| `data/worldmap.json` | The outlines (longitude and latitude) of the continents and large islands. |
| `images/logo.svg` | The site logo. It is also the favicon (the small icon in the browser tab). |
| `images/garden.svg` | A garden picture shown only when a herb photo cannot be loaded. |
| `images/sage.svg`, `chamomile.svg`, `chives.svg` | Illustrations used as the pictures of the three newest herbs. |

## Features and how to use them

### Header and navigation

The header uses the green `#2f6b3a`. It has:

- **Home** (or the logo): the herb catalog.
- **Compare**: the Herb Comparison Tool.
- **Quiz**: the Herb Quiz.
- **Origin Map**: the world map of herb origins.
- **Basket**: your saved herbs. A small number shows how many you saved.
- **About Us**: the history, uses and importance of herbs.
- **Contact Us**: opens a contact form in a popup (see below).
- **Visit**: opening information. The page says: "The garden is open every day from sunrise to sunset. Bring a friend, rub a leaf between your fingers, and leave the bees alone."
- **Random Herb**: opens a random herb page (never the one you are already on).
- **Accessibility**: opens the accessibility settings (see below).
- **Dark mode**: switches between light and dark.

The page you are on is marked in the navigation (a white button, and `aria-current="page"` for screen readers). On screens narrower than 960 px the buttons are hidden behind a **Menu** button (see [Mobile and small screens](#mobile-and-small-screens)).

### Home: the herb catalog, search and Smart Herb Filter

Shows the centred welcome title, a centred search box, the Smart filters and a card for each of the eight herbs: Basil, Mint, Lavender, Rosemary, Thyme, Sage, Chamomile and Chives. Each card shows the category, the Latin name, a summary, the life cycle and plant type, the taste, a **Save** button and a link to the herb page.

- **Search** filters live by name, botanical name, category, description, taste and filter words (for example "apple" finds Chamomile). A message tells screen reader users how many herbs were found. **Clear** shows all herbs again.
- **Smart filters**: open the "Smart filters" panel and tick boxes in any of eight groups: **Medicinal use** (for example Digestion, Relaxation & sleep, Cough & throat, Skin care, Memory & focus, Antioxidant support), **Flavor** (Sweet, Peppery, Minty, Floral, Earthy, Piney, Lemony, Oniony, Apple-like), **Harvest season**, **Plant type** (Leafy herb, Woody shrub, Flowering shrub, Flowering herb, Low-growing shrub, Bulb / grass-like herb), **Life cycle** (Annual, Perennial), **Used for** (Culinary, Tea, Aromatic), **Sunlight** and **Water needs**. A herb must match at least one tick in every group you use, and the search box works together with the filters. The number of herbs for each choice is shown next to it, and the number of active filters is shown on the panel heading. **Clear all filters** unticks everything.
- If nothing matches, a message offers **Clear search and filters**.

### Herb Basket (favorites)

Use **Save** on a herb card or herb page to put the herb in your basket. The button then says **Remove**. The **Basket** page shows your saved herbs as cards, lets you remove them, **Empty the basket**, or **Compare my first two herbs** (when you have at least two). The herbs are saved in the browser (`localStorage`), so they are still there next time. Screen readers are told when a herb is saved or removed.

### Herb page

Each herb page shows:

- the photo, name, botanical name, family, category and description, and the buttons **Save**, **Compare** and **Ask the Guide**
- **Growing Conditions**: sunlight, watering, hardiness zone, soil type, soil pH and temperature
- **Culinary & Popular Uses** and **Perfect Flavor Pairings**
- **Taste & Origin** (with a link to the origin map) and **In Daily Life**
- **Harvesting, Storage & Tips**: how to harvest, how to store the herb after harvesting, and growing tips
- **Safety, Allergies & Side Effects**: side effects, allergies, pregnancy, pets and medicines
- **Medicinal Uses & Benefits**, with a "Good to know" note. This is general information, not medical advice.
- **Watch & Learn**: an embedded YouTube video (iframe) about the herb. Captions are turned on where the video has them.

If a herb does not exist (for example `#unknown`), a friendly error page offers a way back to the catalog.

### Herb Comparison Tool

Open **Compare**, choose a **First herb** and a **Second herb**, and the page shows a table with: **Taste**, **Plant type** (with life cycle and best harvest season), **Origin**, **Medicinal uses**, **Growing conditions** (sunlight, watering, soil, temperature, hardiness), **Side effects** and **Video** (both videos side by side, each in its own player). **Swap** exchanges the two herbs. Choosing the same herb twice shows a hint. The **Compare** button on a herb page starts a comparison with that herb already chosen. On phones the table turns into stacked blocks, one per feature, with the herb name above each answer.

### Herb Quiz

Open **Quiz** and press **Start the quiz**. You get 8 random questions, one at a time, each with four answers.

1. Choose an answer and press **Check answer**.
2. The page tells you if you were right, shows the correct answer with the tag "Correct answer" (and "Your answer" if you were wrong), and gives a short explanation with a link to the herb.
3. Press **Next question** (or **See my score** on the last one).
4. At the end you see your **score out of 8**, a message, whether it is a **new best score**, and a list of the questions you missed. **Try again** starts a new quiz with new random questions.

Your best score is saved in the browser. The quiz works fully with the keyboard.

### Herb Origin Map

Open **Origin Map** to see a world map with a numbered marker for each herb's origin. A list under the map gives the same information as text: select a herb in the list (or a marker on the map) to read where it comes from, its marker position, and buttons to open the herb page or ask the Herb Guide.

- **Zoom in** and **Zoom out** change the zoom (up to 8 times), **Europe & Mediterranean** zooms to the region where six of the herbs come from, and **World view** goes back. When zoomed in you can **drag** the map (mouse, pen or finger) to move it.
- The map is simplified: the outlines are drawn from a small list of points.
- Screen readers get the map as one described image and use the list below it.

### Herb Guide (chat bot)

Press the green **Ask the Herb Guide** button (bottom right of every page) to open a chat window. Type a question, or press one of the suggested questions. You can also open it with **Ask the Guide** on a herb page or on the map.

The Herb Guide answers from the herb data of this site. It can answer about:

- **allergy and safety**: allergies, side effects, pregnancy, pets, interactions with medicines, children
- **medicinal usage** and health benefits
- **origin** (and it links to the origin map)
- **growing conditions**: soil type and pH, watering, sunlight, temperature and hardiness
- **harvesting** and **storage after harvesting**
- **daily life usage**, taste, flavor pairings, plant type, best seasons, videos and tips
- **comparisons** ("Compare basil and mint")
- **which herbs ...** questions ("Which herbs help with sleep?", "Which herbs are safe for pets?", "Which herbs grow in shade?")

Examples: "Is chamomile safe for pets?", "How do I harvest mint?", "Where does basil come from?", "How should I store rosemary?", "How much water does lavender need?". If you do not name a herb, it uses the herb you asked about last. Answers include links to the herb pages, and a reminder that the information is not medical advice. A link in an answer closes the chat and opens the page.

**How it works:** it is not a large language model. It is a rule-based assistant written in JavaScript: it finds the herb names and topic words in your question, then builds the answer from the matching fields of `data/<herb>.json`. Because of this it only knows what is in the herb data, it cannot answer about other herbs, and it does not need an internet connection. To make it smarter, add information to the JSON files (see the format below).

### Accessibility settings

The **Accessibility** button opens a popup with:

- **Dark mode**
- **High contrast** (black background, white text and yellow highlights)
- **Reduce motion and animations**
- **Text size**: Normal, Large (125%) or Extra large (150%)
- **Reset to defaults**

Changes apply straight away and are saved in the browser. See [Accessibility](#accessibility) for everything the site does for accessibility.

### Testimonial slider (footer)

The footer of every page has a small, round slider called **Voices from Medicine & Nutrition**. It shows eight testimonials, one for each herb. Each one comes from a doctor or medicine specialist (for example a gastroenterologist, a sleep medicine specialist or a clinical pharmacist) and says in about 25 words how they use the herb in daily life and what it does for you, with a safety tip where it matters.

**The testimonials are fictional examples written for this demo website. The people are not real and nothing in them is medical advice.** A note next to the slider says the same.

What you see:

- A round **disc** with the person's initials, the testimonial, their name and their medical speciality.
- Eight **dots** on a ring around the disc, one per testimonial, going clockwise from the top. The filled, larger dot is the current one. On narrow screens (under 480 px) the dots move to a row under the disc.
- Three round buttons under the disc: **Previous**, **Pause / Play** and **Next**.
- A **Read about ...** link that opens the page of the herb in the current testimonial.

How to use it:

- **Previous** and **Next** move between testimonials and wrap around. A dot jumps straight to its testimonial.
- **Pause / Play** stops and starts the automatic change. It changes by itself every 8 seconds, pauses while the mouse is over it or keyboard focus is inside it, and starts paused for visitors whose system (or the Accessibility settings) asks for reduced motion.
- **Keyboard**: Tab reaches the current dot (one stop for all the dots), then the three buttons, then the herb link. Left/Right (or Up/Down) arrow keys change the testimonial, and Home/End jump to the first/last one while a dot has focus.
- **Touch screens and mouse**: swipe or drag left or right on the disc.

To change the testimonials, edit `data/testimonials.json`. About 25 words per quote fits the circle comfortably.

### Contact Us popup

1. Select **Contact Us** in the header. A popup form opens and keyboard focus moves to the first field.
2. Fill in your name, your email address and a message (at least 10 characters). If something is missing or wrong, a message under that field says what to fix and focus moves to the first problem.
3. Select **Send message**. The form closes and a **Thank you** popup appears. It closes by itself after 5 seconds, or sooner with the **Close** button, the Esc key or a click on the dark background.
4. Focus then returns to the **Contact Us** button.

Use **Cancel**, the close button, Esc or a click on the dark background to close the form without sending.

Note: this site has no server code, so the message is not sent or stored anywhere. To receive messages, connect the form's `submit` handler in `app.js` (`setupContactForm`) to a form service or your own backend.

## How routing works

The site is a Single Page Application. The part of the address after `#` decides what is shown, and `app.js` listens for the `hashchange` event:

| Address | Page |
| --- | --- |
| `index.html` (no hash) | Home: catalog, search and Smart filters |
| `#compare` | Herb Comparison Tool |
| `#quiz` | Herb Quiz |
| `#map` | Herb Origin Map |
| `#basket` | My Herb Basket |
| `#about` | About Us |
| `#visit` | Visit |
| `#basil`, `#mint`, ... | The herb page. `app.js` fetches `data/<id>.json` and draws it. |

The herb data is loaded once and kept in memory, so moving between pages is fast. On every page change the script updates the page title, moves keyboard focus to the main heading, marks the current page in the navigation, closes the mobile menu and announces the new page to screen readers.

## JSON formats

### Herb files (`data/<id>.json`)

```json
{
  "id": "basil",
  "name": "Basil",
  "botanicalName": "Ocimum basilicum",
  "family": "Lamiaceae (Mint family)",
  "category": "Culinary",
  "image": "https://... or images/basil.jpg",
  "imageAlt": "Short description of the picture (optional)",
  "description": "Text description.",
  "taste": "One sentence about the taste.",
  "growingConditions": { "sunlight": "", "watering": "", "hardinessZone": "", "soilType": "" },
  "soilPh": "6.0-7.5",
  "temperature": "Sentence about the temperatures the herb needs and tolerates.",
  "uses": ["string"],
  "pairings": ["string"],
  "dailyLife": ["string"],
  "harvest": "How to harvest.",
  "storage": "How to store after harvesting.",
  "tips": ["string"],
  "sideEffects": ["string"],
  "safety": { "allergy": "", "pregnancy": "", "pets": "", "petSafe": true, "medications": "" },
  "medicinal": { "uses": ["string"], "benefits": ["string"], "caution": "string (optional)" },
  "origin": { "region": "Tropical Asia (India)", "lat": 22, "lng": 79, "details": "Short story of the origin." },
  "filters": {
    "medicinal": ["Digestion"],
    "flavor": ["Sweet", "Peppery"],
    "season": ["Summer"],
    "lifecycle": "Annual",
    "plantType": "Leafy herb",
    "usedFor": ["Culinary"],
    "sun": ["Full sun"],
    "water": "Moderate"
  },
  "video": { "title": "Video title", "youtubeId": "11-character YouTube video id" }
}
```

Where each field is used:

- `filters`: the Smart Herb Filter (the filter choices are built from the values found in all herb files), the card tags, the comparison table and the Herb Guide.
- `taste`, `sideEffects`, `growingConditions`, `temperature`, `medicinal.uses`, `origin` and `video`: the comparison table.
- `origin.lat` and `origin.lng`: the marker position on the origin map. `origin.details` is the text of the map and the Herb Guide.
- `safety`, `sideEffects`, `harvest`, `storage`, `soilPh`, `temperature`, `dailyLife` and `tips`: the herb page and the answers of the Herb Guide (`petSafe` is true when the herb is generally regarded as safe for cats and dogs).
- `family`, `imageAlt`, `pairings` and `medicinal.caution` are optional. The YouTube id is the part after `v=` in a video address: for `https://www.youtube.com/watch?v=HMpGlnaAXcw` it is `HMpGlnaAXcw`.

### Testimonials (`data/testimonials.json`)

```json
{ "testimonials": [ { "herb": "basil", "name": "Dr. Meera Iyer", "role": "Clinical Nutritionist", "quote": "About 25 words." } ] }
```

`herb` must be the id of a herb in `HERB_REGISTRY`. The round avatar shows the person's initials. Keep the testimonials fictional, or replace them with real quotes you have permission to use.

### Quiz (`data/quiz.json`)

```json
{ "questions": [ { "question": "Which herb is ...?", "answer": "Basil", "wrong": ["Mint", "Sage", "Chives"], "explanation": "Why it is right.", "herb": "basil" } ] }
```

Each question needs one right answer and three wrong answers. `herb` is the id used for the "Read about ..." link. Add as many questions as you like: each quiz picks 8 at random, and the answers are shuffled.

### Map (`data/worldmap.json`)

```json
{ "land": [ { "name": "Africa", "points": [[-17, 21], [-16, 28]] } ] }
```

Each shape is a list of `[longitude, latitude]` points. The markers come from `origin.lat` and `origin.lng` in the herb files.

## How to add a new herb

1. Create `data/<id>.json` (for example `data/oregano.json`) in the format above. The file name must be the same as the `id`, in lowercase. Fill in all fields, because each one feeds a feature (the filter, the comparison, the map and the Herb Guide).
2. Add the herb to `HERB_REGISTRY` at the top of `app.js` so it appears on the home page, in search, in Random Herb, on the map and in the comparison:
   ```js
   { id: 'oregano', name: 'Oregano', botanicalName: 'Origanum vulgare', category: 'Culinary', icon: 'leaf', summary: 'One sentence for the card.' }
   ```
   `icon` can be `sprout`, `leaf`, `flower` or `tree` (see the sprite in `index.html`).
3. Add the names people use for it in `HERB_ALIASES` in `app.js`, so the Herb Guide recognises it: `oregano: ['oregano']`.
4. Add a `petSafe` value in the `safety` object, and add quiz questions in `data/quiz.json` and a testimonial in `data/testimonials.json` if you want them.
5. Optional: put a photo in `images/` and set `"image": "images/oregano.jpg"`.
6. Open `http://localhost:3000/#oregano` to check it.

## Accessibility

The site is designed to work for everyone:

- **Keyboard**: every control can be reached and used with Tab, Shift+Tab, Enter, Space and the arrow keys. A "Skip to main content" link is the first stop. Focus is always visible (a thick outline that works on light, dark, green and high-contrast backgrounds) and never trapped. Esc closes the mobile menu and every popup, and focus returns to the button that opened it.
- **Screen readers**: proper landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page with a logical heading order, labelled search box, filters, form fields and buttons, decorative icons hidden, descriptive image text, a titled iframe for each video, a described map with a text list, `aria-current` for the current page, `aria-expanded` for the menu, a live region that announces page changes, search and filter results, saved herbs and quiz scores, and chat answers that are read out as they arrive. The comparison table has real header cells, and keeps its table meaning on phones.
- **Accessibility settings**: **High contrast** mode (black, white and yellow), **Larger text** (125% or 150%), **Dark mode** and **Reduce motion**, saved on the device. Larger text works because every size in the site is in `rem` units.
- **Zoom**: the layout reflows without sideways scrolling from 1280 px down to 320 px wide (400% zoom). The header is sticky only on large screens, so it never covers the content when zoomed.
- **Colour perception**: text and controls meet the WCAG AA contrast ratio (4.5:1 or better) in light and dark mode, and the high-contrast mode goes further. Colour is never the only signal: the current page, saved herbs, correct and wrong quiz answers (text tags "Correct answer" and "Your answer", plus border style), selected map markers (bigger, thicker ring, number) and errors also use text, shape and icons. Windows High Contrast (forced colours) is supported.
- **Small screens**: one column on phones, a mobile menu, a responsive card grid, stacked comparison blocks and a map that scales with the screen.
- **Temporary injury or one-handed use**: buttons and links are at least 44 px tall (40 px for the slider dots), whole cards are clickable, nothing needs a double click, hover or fine movement, there are no time limits (the Thank you popup can be closed at once and its text stays in the live region), and map zoom and pan are available as buttons.
- **Motion**: animations and the automatic slider are off for visitors who ask their system for reduced motion or who turn on **Reduce motion**.
- **Popups**: the Accessibility, Herb Guide, Contact Us and Thank you popups use the native `<dialog>` element. Focus stays inside the open popup, Esc closes it, fields have visible labels, and errors are written as text, announced to screen readers and marked with `aria-invalid`.
- **Testimonial slider**: a labelled carousel region, each slide announced as "3 of 8: Lavender", only the visible slide readable, an automatic change that can be paused (WCAG 2.2.1), and a single tab stop for the dots with arrow-key navigation.
- **No JavaScript**: a message explains that the site needs JavaScript.

## Mobile and small screens

- A **Menu** button replaces the navigation on screens narrower than 960 px. It opens a list of all the buttons (in two columns on wider phones), has `aria-expanded`, closes when you choose something or press Esc, and is hidden from keyboards and screen readers while closed.
- The herb cards use a responsive grid: four columns on large screens, fewer on smaller ones, and one on phones. The filters, comparison table, quiz, map, chat window and popups all fit a 320 px screen.
- **Swipeable**: the testimonial slider can be swiped or dragged. The map can be dragged when zoomed in. The suggested questions in the chat form a row that can be swiped sideways on phones.
- The chat button becomes a round icon button on phones, so it covers less of the page.
- Tap targets are at least 44 px high, and the page uses relative units so it scales with the visitor's text size.

## Data saved in the browser

The site stores a little data with `localStorage` (and keeps it in memory when the browser blocks storage):

| Key | What it holds |
| --- | --- |
| `littleHerbGarden.basket` | The herbs saved in the basket. |
| `theme` | `dark` or `light`. |
| `littleHerbGarden.a11y` | High contrast, reduce motion and text size. |
| `littleHerbGarden.quizBest` | Your best quiz score. |

**Reset to defaults** in the Accessibility settings removes the theme and accessibility settings. Nothing is sent to any server.

## Limits of this version

- The **Herb Guide** is a rule-based assistant, not a large language model. It only answers about the eight herbs and the topics listed above.
- The **origin map** is a simplified drawing. Markers are placed at one point per herb, and the markers of the Mediterranean herbs overlap until you zoom in.
- The **medicinal and safety information** is general and traditional information, not medical advice.
- The **testimonials** are fictional.
- The **Contact Us** form does not send the message anywhere.
- The photos of Basil, Mint, Lavender, Rosemary and Thyme and the videos come from the internet. The pictures of Sage, Chamomile and Chives are illustrations stored in `images/`.
- The site must be opened through a web server (for example `npx serve`), not by double-clicking `index.html`, because browsers block loading the JSON files from `file://`.

## Documentation rule and change history

This README is the documentation of the website and must be updated in the same change as the code, so that it always matches the current version. When you change the site, update the matching sections above and add a line here.

| Change | What was done |
| --- | --- |
| Start | Single-file SPA split into `index.html`, `style.css`, `app.js`, `data/` and `images/`. |
| Header and extra pages | Header colour `#2f6b3a`; Home, About Us and Visit buttons; "View Source Code" removed. |
| Herb pages | Medicinal uses and benefits on every herb page; embedded YouTube video (iframe) on every herb page. |
| Plain web technologies | Tailwind and Font Awesome removed; icons are inline SVG; only HTML, CSS, JavaScript and the DOM remain. |
| Accessibility | Keyboard, screen reader, zoom, colour contrast, small screen and one-handed use. |
| Favicon | The logo is the favicon. |
| Home page | Centred title and search; the side picture was removed from the home page. |
| More herbs | Sage, Chamomile and Chives added with their own pages. |
| Contact Us | Contact Us button, form popup with validation, and a Thank you popup that closes after 5 seconds. |
| Testimonials (1) | Footer testimonial slider with one testimonial from a doctor or medicine specialist for each of the 8 herbs; `data/testimonials.json` added. |
| Testimonials (2) | Slider redesigned to be smaller, round and prettier: a circular disc with the dots on a ring around it, round control buttons, one "Read about ..." link, a two-column footer on wide screens, shorter quotes that fit the circle, and a roving tab stop for the dots. |
| Version 8 | **Herb Comparison Tool**, **Smart Herb Filter** (8 groups), **Herb Quiz**, **Herb Basket** (localStorage), **Herb Origin Map** (plain SVG, zoom and drag), **Herb Guide chat bot** (rule-based, answers from the herb data), **Accessibility settings** (high contrast, larger text, reduce motion, dark mode), mobile menu and full mobile optimization, swipe and drag support. Herb files got new fields (taste, side effects, safety, temperature, soil pH, harvest, storage, daily life, tips, origin, filters). `data/quiz.json` and `data/worldmap.json` added. |

## Deploy on GitHub Pages

1. Push the project to a GitHub repository with `index.html` at the root.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
4. After a minute the site is live at `https://<your-name>.github.io/<repository>/`.

All paths are relative, so the site works inside the repository sub-path. File names are case-sensitive on GitHub Pages, so keep them exactly as in this README (for example `images/logo.svg`, not `images/Logo.svg`).
