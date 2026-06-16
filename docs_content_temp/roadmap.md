# Roadmap

Last updated: 2026-04-11

This file is the execution source of truth.

## Status legend

- `Done`: implemented in code and currently active.
- `In progress`: partially complete or blocked by cleanup.
- `Planned`: not started.

## Milestones

| Milestone                                   | Status  | Scope                                                                    | Completion criteria                                                                                   |
| ------------------------------------------- | ------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| M1 - Runtime public content API             | Done    | `/api/posts`, `/api/post`, public viewer integration                     | Public posts load from the private content repo at request time                                       |
| M2 - Runtime protected content API          | Done    | `/api/protected-posts`, `/api/protected-post`, protected viewer flow     | Protected metadata and protected post content load through functions with server-side password checks |
| M3 - Shared parsing/loading utilities       | Done    | `_lib` helpers + `src/js/post-common.js`                                 | Common parsing, CORS, TOC, dynamic component loading, and loader behavior are centralized             |
| M4 - Source tree refresh and build pipeline | Done    | `src/` source tree, `dist/` output, build/check scripts, Netlify publish | `npm run check` passes, `npm run build` generates `dist/`, and Netlify publishes the built output     |
| M5 - Multi-site theming and site switching  | Done    | `?site=` routing, per-site UI/accent config, site-aware API usage        | Site config is selected via `config.js`; home/post links preserve site id; alternate sites render     |
| M6 - Home feed search and category filters  | Done    | Search box, category filter buttons, active category state               | Posts can be filtered client-side by text and category without reload                                 |
| M7 - Toolbox utilities page                 | Done    | Toolbox index and browser utilities under `src/toolbox/`                 | Toolbox landing and utility pages exist and pass local link checks                                    |
| M8 - Release metadata alignment             | Done    | Versioning and docs consistency                                          | `package.json`, README, roadmap, and changelog describe the current architecture consistently         |
| M9 - RSS feed support                       | Planned | Add feed generation/endpoint                                             | RSS endpoint and validation in place                                                                  |
| M10 - JS/CSS consolidation pass             | Planned | Reduce remaining duplication and inline styles                           | Duplicated logic/styles are removed without behavior regressions                                      |

## Remaining backlog

1. M9 - RSS feed support.
2. M10 - JS/CSS consolidation pass.
