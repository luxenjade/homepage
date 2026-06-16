# Migration Notes (Historical)

Last updated: 2026-04-11

This document records the migration from build-generated post files to runtime content delivery.
It is a reference log, not an active implementation guide.

## Migration outcome

The migration objective is complete:

- Content source is a private repo: `Shoei451/md-contents`.
- `451-docs` serves content at runtime via Netlify Functions and GitHub Contents API.
- Public posts:
  - list: `/api/posts`
  - single post: `/api/post?slug=`
- Protected posts:
  - list: `/api/protected-posts`
  - single post with server-side password check: `/api/protected-post?slug=&password=`
- Post routes are slug-based:
  - `post.html?slug=...`
  - `protected-post.html?slug=...`

## What changed from the old model

| Old model                                                                     | Current model                                                 |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Local markdown copied into this repo and transformed during build             | Markdown stays in private repo and is fetched at request time |
| Build artifacts (`posts-data` or per-post generated files) used for rendering | Netlify Functions return metadata/post payloads directly      |
| Mixed client-heavy protected flow                                             | Password verification handled on server function              |

## Follow-up changes after the migration

The runtime migration is no longer in a cleanup state. Subsequent work aligned the repository with the runtime model:

- App source now lives under `src/`.
- Netlify Functions live at repo-root `netlify/functions/`.
- `scripts/build.js` copies `src/` to `dist/` and minifies JS/CSS for deployment.
- `scripts/check-js.mjs` and `scripts/check-links.mjs` validate repository integrity before release.
- `netlify.toml` publishes `dist/` and routes `/api/*` to Netlify Functions.

Track ongoing product work in `docs/roadmap.md`.

## Current recommended dev path

1. Run `npm run check` to validate JavaScript syntax and local links.
2. Run `npm run build` to produce the deployable `dist/` output.
3. Run `npm run dev` for a static preview of `src/`.
4. Keep content changes in `md-contents`.
5. Keep `451-docs` focused on UI, Netlify Functions, and build/check tooling.
