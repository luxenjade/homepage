# shoei451-website

Personal learning tools site by Shoei451.  
Production: [shoei451.netlify.app](https://shoei451.netlify.app)

---

## Overview

`shoei451-website` is a static HTML/CSS/JS repository for study tools, category landing pages, and site-wide utility pages.

- Frontend: Vanilla HTML/CSS/JS
- Source root: `src/`
- Build: `pnpm run build` copies `src/` to `dist/`, generates category pages from `inner_links/`, and minifies JS/CSS/HTML
- Hosting: Netlify
- Category pages and the top-page category sections are generated at build time from `inner_links/*.json` and `sub-index.html`
- Shared runtimes: `src/quiz/` for quizzes, `src/timeline/` for timelines
- PWA support: `src/service-worker.js`, `src/manifest.json`, `netlify.toml`
- Data-backed pages: `src/js/supabase_config.js`
- Repo checks: `scripts/check-js.mjs`, `scripts/check-links.mjs`

---

## Current Status (2026-05-25)

### Working now

- Active site source lives under `src/`, with Netlify publishing the built `dist/`
- Shared quiz runtime is under `src/quiz/` with configs in `src/quiz/config/`
- Shared timeline runtime is under `src/timeline/` with configs in `src/timeline/config/`
- Category landing pages are generated into `dist/{slug}/index.html` from `inner_links/*.json`; the top page also gets its category headers from the same data. The built site does not fetch category `list.json` files.
- Shared navigation/footer injection and service worker registration live in `src/js/nav.js`
- PWA assets and install metadata are now wired through `src/service-worker.js`, `src/manifest.json`, `appstore-images/`, and `netlify.toml`
- The external links area is `src/links/`, backed at build time by `external_links/*.json` and `external_links/collections.json`
- Active category/content roots are `src/history/`, `src/geography/`, `src/seikei/`, `src/miscellaneous/`, `src/projects/`, plus site pages such as `src/about/`, `src/privacy-policy.html`, `src/sitemap.html`, and `src/404.html`
- Internal category link data lives in `inner_links/`. Build output embeds this data into HTML/JS instead of publishing JSON endpoints.

### Known legacy / issues

- `src/timeline/admin/wh-admin-legacy.html` is still kept as a legacy admin page
- `archives/` stores retired scripts/assets that are no longer part of the active runtime

---

## Repository Layout

- `src/about/` - profile page, structured bio data, and styles
- `inner_links/` - source JSON for internal category links; used only at build time
- `src/history/`, `src/geography/`, `src/seikei/`, `src/miscellaneous/` - category content pages and tools
- `src/quiz/` - reusable quiz runtime and configs
- `src/timeline/` - shared timeline runtime and admin pages
- `src/links/` - curated external learning links
- `src/playground/` - standalone experiments and mini-apps
- `src/projects/` - generated category route target for external project links
- `src/js/`, `src/css/` - shared site assets
- `netlify/` - Edge Functions and Netlify config surface
- `scripts/` - local repository checks and conversion scripts
- `archives/` - archived scripts/assets kept for reference

Primary source entry pages:

- `src/index.html`
- `sub-index.html` - category page template used by the build
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
