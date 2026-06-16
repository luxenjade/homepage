# luxenjade-website

Personal learning tools site by luxenjade.  
Production: [luxenjade.netlify.app](https://luxenjade.netlify.app)

---

aaaaaa

## Overview

`luxenjade-website` is a static HTML/CSS/JS repository for study tools, category landing pages, and site-wide utility pages.

- Frontend: Vanilla HTML/CSS/JS
- Source root: `src/`
- Build: `pnpm run build` performs data validation, copies `src/` to `dist/`, generates category pages, and minifies assets.
- Hosting: Netlify
- **SEO Optimized**: Category landing pages and the top-page category sections are pre-rendered at build time from `inner_links/*.json`.
- Shared runtimes: `src/quiz/` for quizzes, `src/timeline/` for timelines
- PWA support: `src/service-worker.js`, `src/manifest.json`, `netlify.toml`
- Data-backed pages: `src/js/supabase_config.js`
- **Quality Assurance**: Integrated ESLint (linting), Vitest (testing), and Zod (schema validation).

---

## Current Status (2026-06-03)

### Working now

- **Pre-rendered Top Page**: Content links are directly inserted into `index.html` at build time for better search engine discovery.
- **Data Validation**: All JSON configs in `inner_links/` and `external_links/` are strictly validated using Zod schemas before building.
- **Refactored Configuration**: Build-time constants (site URL, category slugs, etc.) are centralized in `scripts/config.js` for better maintainability.
- **Modern Tooling**:
  - **ESLint**: Enforces code quality and catches potential bugs.
  - **Vitest**: Unit testing for utility functions and build logic.
  - **Zod**: Type-safe validation for external and internal data files.
- Active site source lives under `src/`, with Netlify publishing the built `dist/`
- Category landing pages are generated into `dist/{slug}/index.html`. The built site does not fetch category `list.json` files client-side.
- PWA assets and install metadata are wired through `src/service-worker.js`, `src/manifest.json`, and `netlify.toml`.

### Known legacy / issues

- `src/timeline/admin/wh-admin-legacy.html` is still kept as a legacy admin page
- `archives/` stores retired scripts/assets that are no longer part of the active runtime

---

## Repository Layout

- `inner_links/` - Source JSON for internal category links; used only at build time.
- `external_links/` - Source JSON for curated external learning links.
- `template/` - HTML templates (`sub-index.html`, `links.html`) used by the build script.
- `scripts/` - Build pipeline, utilities, schemas, and repository checks.
- `src/history/`, `src/geography/`, `src/seikei/`, `src/miscellaneous/` - Category content pages and tools.
- `src/quiz/` - Reusable quiz runtime and configs.
- `src/timeline/` - Shared timeline runtime and admin pages.
- `src/js/`, `src/css/` - Shared site assets.
- `archives/` - Archived scripts/assets kept for reference.

Primary source entry pages:

- `src/index.html`
- `src/404.html`
- `src/privacy-policy.html`
- `src/sitemap.html`

---

## Tooling

Install dependencies:

```bash
pnpm install
```

Quality checks (Linting & Link checks):

```bash
pnpm run check
```

Run tests:

```bash
pnpm test
```

Data validation only:

```bash
pnpm run validate:data
```

Build the site:

```bash
pnpm run build
```

---

## Supabase Tables Used In This Repo

Defined in `src/js/supabase_config.js`:

- `WH_QUIZ`, `WH_DATES`, `WH_REGIONS`, `CHINESE`, `SEIKEI`, `ACCESS_LOG`, `ENGLISH_IDIOMS`

The client exports module bindings and `window.SUPABASE_TABLES` / `window._db` for legacy scripts.

---

## Contact

okamotoshoei4512@gmail.com
