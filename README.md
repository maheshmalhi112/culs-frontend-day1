# The Little Herb Garden
Modified by:
Mahesh Kumar.

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

Everything below describes the current version of the website.

**Contents:** [Technology](#technology) · [Project structure](#project-structure) · [What is in each file](#what-is-in-each-file) · [Features and how to use them](#features-and-how-to-use-them) · [How routing works](#how-routing-works) · [JSON formats](#json-format-dataidjson) · [How to add a new herb](#how-to-add-a-new-herb) · [Accessibility](#accessibility) · [Documentation rule and change history](#documentation-rule-and-change-history) · [Deploy on GitHub Pages](#deploy-on-github-pages)

## Technology

The site is built with **only HTML, CSS, JavaScript and the DOM**. There is no framework, no library, no build step, no icon font and no CDN script or stylesheet.

- Icons are inline SVG, defined once in a sprite at the top of `index.html`.
- Fonts are the visitor's own system fonts.
- Content that comes from outside is limited to the herb photos (Unsplash) and the embedded videos (YouTube, through `youtube-nocookie.com`).

## Project structure

```
index.html              the page shell (header, main, popups, footer)
style.css               all styling (light and dark colours, layout, slider, popups)
app.js                  all behaviour (router, views, search, popups, slider)
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
| `index.html` | The page shell: skip link, icon sprite, header with navigation, `<main>`, the Contact Us and Thank you popups, the footer with the testimonial slider, and a live region for screen reader announcements. |
| `style.css` | All styling: colour variables (light and dark), layout, popups, the circular testimonial slider, focus styles, reduced-motion and high-contrast rules. |
| `app.js` | The router, the views, search, random herb, dark mode, the Contact Us popups, the testimonial slider and accessibility behaviour. |
| `data/*.json` | One file per herb: `basil`, `mint`, `lavender`, `rosemary`, `thyme`, `sage`, `chamomile`, `chives`. |
| `data/testimonials.json` | The eight testimonials shown in the footer slider (one per herb). |
| `images/logo.svg` | The site logo. It is also the favicon (the small icon in the browser tab). |
| `images/garden.svg` | A garden picture that is shown only when a herb photo cannot be loaded. |
| `images/sage.svg`, `chamomile.svg`, `chives.svg` | Illustrations used as the pictures of the three newest herbs. |

## Features and how to use them

### Header

The header uses the green `#2f6b3a` and has six controls:

- **Home** (or the logo): back to the herb catalog.
- **About Us**: the history, uses and importance of herbs.
- **Contact Us**: opens a contact form in a popup (see below).
- **Visit**: opening information. The page says: "The garden is open every day from sunrise to sunset. Bring a friend, rub a leaf between your fingers, and leave the bees alone."
- **Random Herb**: opens a random herb page (never the one you are already on).
- **Dark mode**: switches between light and dark. Your choice is remembered in the browser. The first time, the site follows your system setting.

The page you are on is marked in the navigation (a white button, and `aria-current="page"` for screen readers).

### Home: the herb catalog

Shows the centred welcome title, a centred search box and a card for each of the eight herbs: Basil, Mint, Lavender, Rosemary, Thyme, Sage, Chamomile and Chives.

- **Search** filters live by name, botanical name, category and description. A message tells screen reader users how many herbs were found. **Clear** (or "Clear Search Filter") shows all herbs again.
- **Cards**: select a card (the whole card is clickable) to open the herb page.

### Herb page

Each herb page shows:

- the photo, name, botanical name, family, category and description
- **Growing Conditions**: sunlight, watering, hardiness zone and soil
- **Culinary & Popular Uses** and **Perfect Flavor Pairings**
- **Medicinal Uses & Benefits**, with a "Good to know" safety note. This is general information, not medical advice.
- **Watch & Learn**: an embedded YouTube video (iframe) about growing and using the herb. Captions are turned on where the video has them.

### Testimonial slider (footer)

The footer of every page has a small, round slider called **Voices from Medicine & Nutrition**. It shows eight testimonials, one for each herb (Basil, Mint, Lavender, Rosemary, Thyme, Sage, Chamomile, Chives). Each one comes from a doctor or medicine specialist (for example a gastroenterologist, a sleep medicine specialist or a clinical pharmacist) and says in about 25 words how they use the herb in daily life and what it does for you, with a safety tip where it matters.

**The testimonials are fictional examples written for this demo website. The people are not real and nothing in them is medical advice.** A note next to the slider says the same.

What you see:

- A round **disc** with the person's initials, the testimonial, their name and their medical speciality.
- Eight **dots** on a ring around the disc, one per testimonial, going clockwise from the top in the same order as the herbs on the home page. The filled, larger dot is the current one. On narrow screens (under 480 px) the dots move to a row under the disc.
- Three round buttons under the disc: **Previous**, **Pause / Play** and **Next**.
- A **Read about ...** link that opens the page of the herb in the current testimonial.
- On wide screens the slider sits on the right of the footer and the heading and note on the left. On small screens everything is stacked.

How to use it:

- **Previous** and **Next** move between testimonials and wrap around from the last to the first. A dot jumps straight to its testimonial.
- **Pause / Play** stops and starts the automatic change. The slider changes by itself every 8 seconds. It also pauses while the mouse is over it or keyboard focus is inside it, and it starts paused for visitors whose system asks for reduced motion.
- **Keyboard**: Tab reaches the current dot (a single stop for all the dots), then the three buttons, then the herb link. Left/Right (or Up/Down) arrow keys change the testimonial, and Home/End jump to the first/last one while a dot has focus. Enter and Space press buttons.
- **Touch screens**: swipe left or right on the disc.

How to change the testimonials: edit `data/testimonials.json` (format below). Add, remove or reword items and the slider and its dots update by themselves. About 25 words per quote fits the circle comfortably; much longer quotes can overflow it.

### Contact Us popup

1. Select **Contact Us** in the header. A popup form opens and keyboard focus moves to the first field.
2. Fill in your name, your email address and a message (at least 10 characters). If something is missing or wrong, a message under that field says what to fix and focus moves to the first problem.
3. Select **Send message**. The form closes and a **Thank you** popup appears. It closes by itself after 5 seconds, or sooner with the **Close** button, the Esc key or a click on the dark background.
4. Focus then returns to the **Contact Us** button.

Use **Cancel**, the close button, Esc or a click on the dark background to close the form without sending.

Note: this site has no server code, so the message is not sent or stored anywhere. To receive messages, connect the form's `submit` handler in `app.js` (`setupContactForm`) to a form service or your own backend.

If a herb does not exist (for example `#unknown`), a friendly error page offers a way back to the catalog.

## How routing works

The site is a Single Page Application. The part of the address after `#` decides what is shown, and `app.js` listens for the `hashchange` event:

| Address | Page |
| --- | --- |
| `index.html` (no hash) | Home / catalog |
| `#about` | About Us |
| `#visit` | Visit |
| `#basil`, `#mint`, ... | The herb page. `app.js` fetches `data/<id>.json` and draws it. |

On every page change the script updates the page title, moves keyboard focus to the main heading, and announces the new page to screen readers.

## JSON format (`data/<id>.json`)

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
  "growingConditions": {
    "sunlight": "string",
    "watering": "string",
    "hardinessZone": "string",
    "soilType": "string"
  },
  "uses": ["string"],
  "pairings": ["string"],
  "medicinal": {
    "uses": ["string"],
    "benefits": ["string"],
    "caution": "string (optional)"
  },
  "video": {
    "title": "Video title",
    "youtubeId": "11-character YouTube video id"
  }
}
```

`family`, `imageAlt`, `pairings` and `medicinal.caution` are optional. The YouTube id is the part after `v=` in a video address: for `https://www.youtube.com/watch?v=HMpGlnaAXcw` it is `HMpGlnaAXcw`.

## Testimonials JSON format (`data/testimonials.json`)

```json
{
  "testimonials": [
    {
      "herb": "basil",
      "name": "Dr. Meera Iyer",
      "role": "Clinical Nutritionist",
      "quote": "What the specialist says about using the herb in daily life."
    }
  ]
}
```

`herb` must be the id of a herb in `HERB_REGISTRY` (it sets the "Read about ..." link and the slide's name for screen readers). The round avatar shows the person's initials, so no picture file is needed. Keep each `quote` short (about 25 words) so it fits inside the circle. Keep the testimonials fictional, or replace them with real quotes you have permission to use.

## How to add a new herb

1. Create `data/<id>.json` (for example `data/sage.json`) in the format above. The file name must be the same as the `id`, in lowercase.
2. Add the herb to `HERB_REGISTRY` at the top of `app.js` so it appears on the home page, in search and in Random Herb:
   ```js
   { id: 'sage', name: 'Sage', botanicalName: 'Salvia officinalis', category: 'Culinary', icon: 'leaf', summary: 'One sentence for the card.' }
   ```
   `icon` can be `sprout`, `leaf`, `flower` or `tree` (see the sprite in `index.html`).
3. Optional: put a photo in `images/` and set `"image": "images/sage.jpg"`. The photos of Sage, Chamomile and Chives are illustrations (`images/*.svg`); you can replace them with real photos the same way.
4. Add a testimonial for it in `data/testimonials.json` if you want it in the footer slider.
5. Open `http://localhost:3000/#sage` to check it.

## Accessibility

The site is designed to work for everyone:

- **Keyboard**: every control can be reached and used with Tab, Shift+Tab, Enter and Space. A "Skip to main content" link is the first stop. Focus is always visible (a thick outline that works on light, dark and green backgrounds), and focus is never trapped.
- **Screen readers**: proper landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page with a logical heading order, labelled search box and buttons, decorative icons hidden, descriptive image text, a titled iframe for each video, `aria-current` for the current page, `aria-pressed` for dark mode, and a live region that announces page changes and search results.
- **Zoom and text size**: sizes use `rem`, the layout reflows without sideways scrolling down to a 320 px wide screen (400 % zoom), and the page can be zoomed freely. The header is only sticky on large screens so it never covers the content when zoomed.
- **Colour perception**: text and controls meet the WCAG AA contrast ratio (4.5:1 or better) in both light and dark mode. Colour is never the only signal: the current page, errors and buttons also use text, shape and icons. Windows High Contrast (forced colours) is supported.
- **Small screens**: one column on phones, a responsive card grid, and the header buttons wrap instead of hiding.
- **Temporary injury or one-handed use**: buttons and links are at least 44 px tall, whole cards are clickable, nothing needs a double click, drag, hover or fine movement, and there are no time limits.
- **Testimonial slider**: built as an accessible carousel. It is a labelled region (`role="group"` with `aria-roledescription="carousel"`); each slide is announced as, for example, "3 of 8: Lavender"; only the visible slide can be read; the automatic change can be paused (WCAG 2.2.1) and stops while you hover over or focus the slider; screen readers are told about a new slide only when you change it yourself; the dots use a single tab stop with arrow-key navigation; every control is a real button of at least 40 px (the round buttons are 44 px); the active dot is shown by fill and size, not by colour alone; and it works with keyboard, touch swipes, reduced motion, dark mode and Windows High Contrast. The layout was measured so that all the text stays inside the circle on screens from 320 px wide up.
- **Popups**: the Contact Us and Thank you popups use the native `<dialog>` element. Focus stays inside the open popup, Esc closes it, focus returns to the Contact Us button, fields have visible labels, and errors are written as text, announced to screen readers, and marked with `aria-invalid`.
- **Motion**: animations are turned off for visitors who ask their system for reduced motion.
- **No JavaScript**: a message explains that the site needs JavaScript.

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

## Deploy on GitHub Pages

1. Push the project to a GitHub repository with `index.html` at the root.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
4. After a minute the site is live at `https://<your-name>.github.io/<repository>/`.

All paths are relative, so the site works inside the repository sub-path.
