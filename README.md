# shoei451-website

Personal learning tools site by Shoei451.  
Production: [shoei451.netlify.app](https://shoei451.netlify.app)

---

## Overview

`shoei451-website` is a static HTML/CSS/JS repository for study tools, category landing pages, and site-wide utility pages.

- Frontend: Vanilla HTML/CSS/JS
- Source root: `src/`
- Build: `pnpm run build` copies `src/` to `dist/` and minifies JS/CSS
- Hosting: Netlify
- Shared category routing: `src/sub-index.html?slug=...` + `src/js/sub-index-init.js`
- Shared runtimes: `src/quiz/` for quizzes, `src/timeline/` for timelines
- PWA support: `src/service-worker.js`, `src/manifest.json`, `netlify.toml`
- Data-backed pages: `src/js/supabase_config.js`
- Repo checks: `scripts/check-js.mjs`, `scripts/check-links.mjs`

---

## Current Status (2026-04-03)

### Working now

- Active site source lives under `src/`, with Netlify publishing the built `dist/`
- Shared quiz runtime is under `src/quiz/` with configs in `src/quiz/config/`
- Shared timeline runtime is under `src/timeline/` with configs in `src/timeline/config/`
- Category landing pages are driven by `src/sub-index.html?slug=...` + `src/js/sub-index-init.js`
- Shared navigation/footer injection and service worker registration live in `src/js/nav.js`
- PWA assets and install metadata are now wired through `src/service-worker.js`, `src/manifest.json`, `appstore-images/`, and `netlify.toml`
- The external links area is now `src/links/`, backed by `src/links/config/*.json` and the local converter `scripts/raindrop-to-json.js`
- Active category/content roots are `src/history/`, `src/geography/`, `src/seikei/`, `src/miscellaneous/`, `src/projects/`, `src/playground/`, plus site pages such as `src/about/`, `src/privacy-policy.html`, `src/sitemap.html`, and `src/404.html`

### Known legacy / issues

- `src/history/index.html` remains the legacy world-history timeline alongside `src/timeline/?slug=world-history`
- `src/history/list.json` still describes the newer world-history timeline as "旧データ移行中"
- `src/timeline/admin/wh-admin-legacy.html` is still kept as a legacy admin page
- `archives/` stores retired scripts/assets that are no longer part of the active runtime
- `pnpm run check` currently fails on six local link issues:
  - `src/history/china/integration/map.html` -> `images/3dynasties_favicon.png`
  - `src/history/index.html` -> `/css/theme-toggle.css`
  - `src/quiz/components/demo.html` -> `/css/theme-toggle.css`
  - `src/quiz/index.html` -> `/quiz/components/quiz-bundle.css`

---

## Repository Layout

- `src/about/` - profile page, structured bio data, and styles
- `src/history/`, `src/geography/`, `src/seikei/`, `src/miscellaneous/` - category content and `list.json` data
- `src/quiz/` - reusable quiz runtime and configs
- `src/timeline/` - shared timeline runtime and admin pages
- `src/links/` - curated external learning links
- `src/playground/` - standalone experiments and mini-apps
- `src/projects/` - external project listing data
- `src/js/`, `src/css/` - shared site assets
- `netlify/` - Edge Functions and Netlify config surface
- `scripts/` - local repository checks and conversion scripts
- `archives/` - archived scripts/assets kept for reference

Primary source entry pages:

- `src/index.html`
- `src/sub-index.html`
- `src/404.html`
- `src/privacy-policy.html`
- `src/sitemap.html`

---

## Tooling

Install dependencies:

```bash
pnpm install
```

Quality checks:

```bash
pnpm run check
```

Other useful commands:

```bash
pnpm run build
pnpm run tree
```

---

## Supabase Tables Used In This Repo

Defined in `src/js/supabase_config.js`:

- `WH_QUIZ`
- `WH_DATES`
- `WH_REGIONS`
- `CHINESE`
- `SEIKEI`
- `ACCESS_LOG`
- `ENGLISH_IDIOMS`

The checked-in client exports both module bindings and `window.SUPABASE_TABLES` / `window._db` for non-module scripts.

---

## Contact

okamotoshoei451@gmail.com
