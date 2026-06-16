# Changelog

All notable project changes for `451-docs`.

---

## 2026-04-11

### Completed

- Site source was reorganized under `src/`, while Netlify Functions were kept at repo-root `netlify/functions/`.
- Netlify deployment now builds `dist/` from `src/` with `scripts/build.js` and publishes the built output via `netlify.toml`.
- Repository validation and release scripts were added:
  - `npm run check`
  - `npm run check:js`
  - `npm run check:links`
  - `npm run build`
  - `npm run dev`
- Multi-site configuration was expanded in `netlify/functions/_lib/config.js` for:
  - `451-docs`
  - `shoei451-website`
  - `china-history`
- Home feed behavior was improved in `src/js/index-logic.js` with category filters, search, protected-card rendering, and selected-category handling fixes.
- Toolbox pages were added under `src/toolbox/`:
  - `dropbox-to-md.html`
  - `password-hasher.html`
  - `cloze-builder.html`
- `china-history` now includes a bundled avatar image and avatar attribution UI.

### Notes

- `npm run check` passes against the current repository state.
- `npm run build` currently generates `dist/` from `src/`.
- Tracking docs now reference `docs/` paths instead of the removed `md/` path.

---

## 2026-03-26

### Completed

- Protected content flow is fully server-driven via Netlify Functions:
  - `GET /api/protected-posts` returns protected post metadata.
  - `GET /api/protected-post?slug=&password=` validates password on the server and returns post data without exposing frontmatter `password`.
- Shared backend utilities were introduced under `netlify/functions/_lib/`:
  - `github.js` for GitHub Contents API access
  - `frontmatter.js` for frontmatter parsing and post DTO builders
  - `cors.js` for CORS headers and OPTIONS handling
  - `config.js` for specifying REPO and BASE
- Subfolder slugs are supported for both public and protected posts.
- Frontend post utilities were consolidated in `js/post-common.js`:
  - dynamic component loading (KaTeX and highlight.js)
  - TOC generation
  - table scroll wrappers
  - page loader controls
- Home page (`js/index-logic.js`) now merges public and protected metadata into one date-sorted card feed.

### Notes

- The current runtime architecture no longer requires generated post files in this repository.
- Some legacy scaffolding still exists and is tracked in `docs/roadmap.md` and `docs/todo.md`.

---

## 2026-03-25

### Completed

- Architecture moved from build-generated local content to runtime content delivery through Netlify Functions and GitHub Contents API.
- Public post endpoints were introduced:
  - `GET /api/posts`
  - `GET /api/post?slug=`
- Single post page routing via `post.html?slug=` was established.
- `netlify.toml` was updated for `/api/*` redirects and functions directory mapping.

---

## Before 2026-03-25

### Legacy behavior

- Per-post static generation flow (older build-based approach).
- Earlier protected-post logic included client-heavy handling before server-side validation was introduced.
