# luxenjade-website

Personal learning tools site by luxenjade.  
Production: [luxenjade.netlify.app](https://luxenjade.netlify.app)

---

## Overview

`luxenjade-website` is a static HTML/CSS/JS repository for study tools, category landing pages, and site-wide utility pages, with Netlify Edge Functions backing the docs / admin runtime.

- Frontend: Vanilla HTML/CSS/JS (no framework)
- Source root: `src/`
- Build: `pnpm run build` runs data validation, then a multi-step pipeline (`scripts/build-steps/*.js`) that copies `src/` to `dist/`, generates category and learning-box pages, and minifies assets.
- Hosting: Netlify (static `dist/` + Edge Functions under `netlify/edge-functions/`)
- Package manager: pnpm (`packageManager` pinned in `package.json`)
- **SEO Optimized**: Category landing pages and the top-page category sections are pre-rendered at build time from `inner_links/*.json`.
- Shared runtimes: `src/quiz/` for quizzes, `src/timeline/` for timelines, `src/learning-box/` for flashcards/notes
- PWA support: `src/service-worker.js`, `src/manifest.json`, `netlify.toml`
- Data-backed pages: `src/js/supabase_config.js` + Netlify Edge Functions (see `netlify/edge-functions/`)
- **Quality Assurance**: Integrated ESLint (linting), Vitest (testing), and Zod (schema validation).

---

## Current Status (2026-06-28)

### Working now

- **Pre-rendered Top Page**: Content links are directly inserted into `index.html` at build time for better search engine discovery.
- **Data Validation**: All JSON configs in `inner_links/` and `external_links/` are strictly validated using Zod schemas before building (`scripts/validate-data.mjs` + `scripts/schemas.js`).
- **Refactored Configuration**: Build-time constants (site URL, category slugs, etc.) are centralized in `scripts/config.js` for better maintainability.
- **Step-based Build Pipeline**: `scripts/build.js` orchestrates discrete steps under `scripts/build-steps/` (`10-clean-copy`, `20-sub-projects`, `25-nav-config`, `30-generate-pages`, `40-minify-assets`, `55-generate-cache-manifest`, `50-minify-html`, `60-sw-version`), with shared helpers in `scripts/lib/`.
- **Auto-generated SW Precache Manifest**: `55-generate-cache-manifest.js` walks `dist/` after minify, collects all cacheable HTML/CSS/JS/images/fonts into `dist/cache-manifest.js`, and inlines the URL list into `dist/service-worker.js`. New assets are picked up automatically — no manual SW editing required.
- **Learning Box Pipeline**: A separate generator under `scripts/learning-box/` (`build.mjs` + `generate-pages.mjs`) produces flashcards / notes / subject-color pages from `learning-box-source/` into `dist/learning-box/`, reusing the same `scripts/lib/build-common.js` utilities as the main site.
- **Netlify Edge Functions**: `docs` listing / detail, protected docs, the docs admin, and the access-log service worker are implemented as Deno-based Edge Functions under `netlify/edge-functions/` and share `netlify/lib/supabase.ts`.
- **Modern Tooling**:
  - **ESLint**: Enforces code quality and catches potential bugs.
  - **Vitest**: Unit testing for utility functions and build logic.
  - **Zod**: Type-safe validation for external and internal data files.
- Active site source lives under `src/`, with Netlify publishing the built `dist/`.
- Category landing pages are generated into `dist/{slug}/index.html`. The built site does not fetch category `list.json` files client-side.
- PWA assets and install metadata are wired through `src/service-worker.js`, `src/manifest.json`, and `netlify.toml`.
- Category redirects (`_redirects`) are emitted into `dist/` by the build pipeline based on `scripts/config.js`.

### Known legacy / issues

- `src/timeline/admin/wh-admin-legacy.html` is still kept as a legacy admin page.
- `archives/` stores retired scripts/assets that are no longer part of the active runtime.

---

## Repository Layout

### Source / static assets

- `src/index.html` — top page (links are pre-rendered at build time).
- `src/404.html`, `src/privacy-policy.html`, `src/sitemap.html`, `src/sitemap.xml` — site-wide utility pages.
- `src/manifest.json`, `src/service-worker.js` — PWA assets.
- `src/js/` — shared site scripts (`supabase_config.js`, `nav.js`, `theme-toggle.js`, `wh-utils.js`, `icons.js`).
- `src/css/` — shared site styles.
- `src/quiz/` — reusable quiz runtime and configs.
- `src/timeline/` — shared timeline runtime (`index.html`, `script.js`, `style.css`).
- `src/learning-box/` — runtime assets for the learning-box section (CSS / `index.html` / JS).
- `src/about/`, `src/geography/`, `src/history/`, `src/seikei/`, `src/miscellaneous/`, `src/links/`, `src/images/`, `src/yaju/` — category content and tools.
- `src/docs/` — public docs viewer (`index.html`, `post.html`, `css/`, `js/`) backed by `/api/posts` and `/api/post`.
- `src/docs_admin/` — docs admin (`index.html`, `edit.html`, `js/`) backed by `/api/admin/posts` and `/api/admin/post`.
- `src/wh_admin/` — world-history admin (`index.html`, `script.js`, `style.css`).
- `src/game/`, `src/quiz/` — interactive tools.

### Build pipeline & data

- `inner_links/` — source JSON for internal category links; used only at build time.
- `external_links/` — source JSON for curated external learning links.
- `learning-box-source/` — author-side source for the learning-box section (`subject-colors.json`, `flashcards/*.js`, `notes/*`). Consumed by `scripts/learning-box/`.
- `template/` — HTML templates (`sub-index.html`, `links.html`, `quiz.html`, `learning-box/`) used by the build scripts.
- `scripts/config.js` — centralized build-time constants.
- `scripts/schemas.js` — Zod schemas for `inner_links/` and `external_links/`.
- `scripts/validate-data.mjs` — runs schema validation.
- `scripts/build.js` — build orchestrator.
- `scripts/build-steps/` — `10-clean-copy`, `20-sub-projects`, `25-nav-config`, `30-generate-pages`, `40-minify-assets`, `50-minify-html`.
- `scripts/lib/` — shared build helpers (`build-common.js`).
- `scripts/learning-box/` — learning-box build (`build.mjs`, `generate-pages.mjs`, `lib/`).
- `scripts/check-js.mjs`, `scripts/check-links.mjs`, `scripts/tree.mjs` — repo health checks.

### Netlify runtime

- `netlify.toml` — build / publish config, Edge Function routes, security headers, redirects.
- `netlify/edge-functions/` — Deno Edge Functions:
  - `posts.ts` / `post.ts` — public docs list / detail (`/api/posts`, `/api/post`).
  - `protected-posts.ts` / `protected-post.ts` — password-protected docs.
  - `admin-posts.ts` / `admin-post.ts` — docs admin CRUD.
  - `sw.js` — access-log service worker (`/api/sw`).
- `netlify/lib/supabase.ts` — shared PostgREST wrapper, CORS, auth, and CRUD helpers for the Edge Functions.

### Other

- `archives/` — archived scripts/assets kept for reference.
- `archives/lbox-samples/` — archived learning-box sample apps.
- `archives/pdf/`, `archives/docs-components.html`, `archives/timeline/` — historical artifacts.
- `edge-function-migration-plan.md` — completed migration notes from `netlify/functions/` to Edge Functions.

---

## Environment Variables

Build-time configuration is sourced from `.env` (gitignored) and validated by `scripts/config.js`.

| Variable                   | Required                       | Purpose                                                                                                                                                                                                                                                                                                                             |
| -------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Variable                   | Required                       | Purpose                                                                                                                                                                                                                                                                                                                             |
| ---                        | ---                            | ---                                                                                                                                                                                                                                                                                                                                 |
| `SUPABASE_URL`             | optional                       | Project URL. Defaults to the production URL in `scripts/config.js` if unset. Override to point at a different Supabase project.                                                                                                                                                                                                     |
| `SUPABASE_PUBLISHABLE_KEY` | optional                       | Browser publishable key (`sb_publishable_*`). Defaults to the production key in `scripts/config.js`. Override for staging/local-only projects.                                                                                                                                                                                      |
| `SUPABASE_PB_KEY`          | optional                       | Legacy alias for `SUPABASE_PUBLISHABLE_KEY`. Still accepted.                                                                                                                                                                                                                                                                        |
| `SUPABASE_SECRET_KEY`      | ⚠️ Set in Netlify, OK at build | Service-role key. Used inside `netlify/lib/supabase.ts` via `Netlify.env.get()` for Edge Functions. Netlify exposes this env var during builds too, which is fine — `scripts/config.js` does NOT import it. Build step `65-verify-no-secret-leak.js` scans `dist/` and aborts the build if the key is inlined into any client file. |

Setup locations (in priority order):

1. **Netlify**: Site settings → Environment variables
2. **CI**: project secret variables
3. **Local dev shell**:

   ```bash
   export SUPABASE_URL=https://your-project.supabase.co
   export SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
   pnpm run build
   ```

`.env` files are intentionally **not used** in this project.

---

## Tooling

Install dependencies:

```bash
pnpm install
```

Quality checks (Lint + JS check + Link check):

```bash
pnpm run lint
pnpm run check     # check:js + check:links
```

Run tests:

```bash
pnpm test
```

Data validation only:

```bash
pnpm run validate:data
```

Print the repository tree:

```bash
pnpm run tree
```

Build the site:

```bash
pnpm run build
```

Serve the built site locally:

```bash
pnpm run dev       # serves dist/ via the `serve` package
```

---

## Netlify Edge Functions

Configured in `netlify.toml` and implemented under `netlify/edge-functions/`:

| Path                   | Function             | Purpose                             |
| ---------------------- | -------------------- | ----------------------------------- |
| `/api/posts`           | `posts.ts`           | Public docs listing                 |
| `/api/post`            | `post.ts`            | Single public doc                   |
| `/api/protected-posts` | `protected-posts.ts` | Protected docs listing              |
| `/api/protected-post`  | `protected-post.ts`  | Protected doc with password check   |
| `/api/admin/posts`     | `admin-posts.ts`     | Admin docs listing (CRUD source)    |
| `/api/admin/post`      | `admin-post.ts`      | Admin docs create / update / delete |
| `/api/sw`              | `sw.js`              | Access-log service worker           |

Shared logic lives in `netlify/lib/supabase.ts`. See `edge-function-migration-plan.md` for the migration status.

---

## Supabase Tables Used In This Repo

Defined in `src/js/supabase_config.js`:

- `WH_QUIZ` — `world_history_quiz`
- `WH_DATES` — `wh_dates`
- `WH_REGIONS` — `wh_regions`
- `CHINESE` — `chinese_history`
- `SEIKEI` — `seikei_events`
- `ACCESS_LOG` — `access_logs`
- `ENGLISH_IDIOMS` — `english_idioms`

The client exports module bindings and `window.SUPABASE_TABLES` / `window._db` for legacy scripts.

---

## Contact

okamotoshoei4512@gmail.com
