# Repository Tree

```
.
├── README.md
├── netlify
│   └── edge-functions
│       └── sw.js
├── netlify.toml
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── scripts
│   ├── build.js
│   ├── check-js.mjs
│   ├── check-links.mjs
│   └── tree.mjs
└── src
    ├── 404.html
    ├── about
    │   ├── bio.md
    │   ├── index.html
    │   ├── shoei451.json
    │   └── style.css
    ├── css
    │   ├── base.css
    │   ├── index-cards.css
    │   └── utils.css
    ├── geography
    │   ├── africa-independence-atlas
    │   │   ├── africa-map-diff.md
    │   │   ├── components.html
    │   │   ├── css
    │   │   │   ├── quiz.css
    │   │   │   └── style.css
    │   │   ├── index.html
    │   │   ├── js
    │   │   │   ├── data.js
    │   │   │   ├── logic.js
    │   │   │   └── quiz.js
    │   │   └── quiz.html
    │   ├── china
    │   │   ├── china-state-location-quiz.html
    │   │   ├── data.js
    │   │   ├── index.html
    │   │   ├── learn.html
    │   │   ├── quiz.html
    │   │   └── style.css
    │   ├── list.json
    │   └── us-state-location-quiz.html
    ├── history
    │   ├── china
    │   │   ├── culture-quiz.css
    │   │   ├── culture-quiz.js
    │   │   ├── index.html
    │   │   ├── integration
    │   │   │   ├── README.md
    │   │   │   ├── css
    │   │   │   │   ├── common.css
    │   │   │   │   ├── culture-quiz.css
    │   │   │   │   ├── dynasty.css
    │   │   │   │   ├── index.css
    │   │   │   │   ├── map.css
    │   │   │   │   └── timeline.css
    │   │   │   ├── culture-quiz.html
    │   │   │   ├── dynasty.html
    │   │   │   ├── index.html
    │   │   │   ├── js
    │   │   │   │   ├── card-render.js
    │   │   │   │   ├── common
    │   │   │   │   │   ├── dynasties.js
    │   │   │   │   │   ├── events.js
    │   │   │   │   │   ├── icons.js
    │   │   │   │   │   ├── nav.js
    │   │   │   │   │   ├── quizdata.js
    │   │   │   │   │   └── search.js
    │   │   │   │   ├── culture-quiz.js
    │   │   │   │   ├── dynasty.js
    │   │   │   │   ├── map.js
    │   │   │   │   └── timeline.js
    │   │   │   ├── map.html
    │   │   │   └── timeline.html
    │   │   ├── modules
    │   │   │   ├── chinaData.js
    │   │   │   ├── chinaDynastyGraph.js
    │   │   │   └── chinaPeriods.js
    │   │   └── quizdata.js
    │   ├── index.html
    │   └── list.json
    ├── images
    │   ├── chinese-history.svg
    │   ├── countdown.png
    │   ├── desktop_screenshot.png
    │   ├── favicon.ico
    │   ├── favicon.png
    │   ├── hex-quiz.svg
    │   ├── icon192.png
    │   ├── icon512.png
    │   ├── mobile_screenshot.png
    │   ├── national-diet.jpg
    │   ├── ougi.svg
    │   ├── skelton-globe.png
    │   └── wh-quiz.png
    ├── index.html
    ├── js
    │   ├── icons.js
    │   ├── lists-loader.js
    │   ├── nav.js
    │   ├── sub-index-init.js
    │   ├── supabase_config.js
    │   ├── theme-toggle.js
    │   └── wh-utils.js
    ├── links
    │   ├── config
    │   │   ├── biology.json
    │   │   ├── classics.json
    │   │   ├── en-school.json
    │   │   ├── geography.json
    │   │   ├── informatics.json
    │   │   ├── math.json
    │   │   ├── rekisou.json
    │   │   ├── science-basics.json
    │   │   ├── seikei.json
    │   │   └── world-history.json
    │   ├── index.html
    │   └── viewer.html
    ├── manifest.json
    ├── miscellaneous
    │   ├── care-symbols
    │   │   ├── data.js
    │   │   ├── icons
    │   │   │   ├── bleach-ok.svg
    │   │   │   ├── bleach-oxygen-only.svg
    │   │   │   ├── bleach-prohibited.svg
    │   │   │   ├── drip-flat-dry.svg
    │   │   │   ├── drip-hang-dry.svg
    │   │   │   ├── dry-clean-ok.svg
    │   │   │   ├── dry-clean-prohibited.svg
    │   │   │   ├── dry-clean-weak.svg
    │   │   │   ├── flat-dry.svg
    │   │   │   ├── hand-wash-30.svg
    │   │   │   ├── hand-wash-40.svg
    │   │   │   ├── hang-dry.svg
    │   │   │   ├── iron-120-no-steam.svg
    │   │   │   ├── iron-120.svg
    │   │   │   ├── iron-160.svg
    │   │   │   ├── iron-210.svg
    │   │   │   ├── iron-prohibited.svg
    │   │   │   ├── petroleum-only-weak.svg
    │   │   │   ├── petroleum-only.svg
    │   │   │   ├── shade-drip-flat-dry.svg
    │   │   │   ├── shade-drip-hang-dry.svg
    │   │   │   ├── shade-flat-dry.svg
    │   │   │   ├── shade-hang-dry.svg
    │   │   │   ├── tumble-dry-60.svg
    │   │   │   ├── tumble-dry-80.svg
    │   │   │   ├── tumble-dry-prohibited.svg
    │   │   │   ├── wash-30-normal.svg
    │   │   │   ├── wash-30-very-weak.svg
    │   │   │   ├── wash-30-weak.svg
    │   │   │   ├── wash-40-normal.svg
    │   │   │   ├── wash-40-very-weak.svg
    │   │   │   ├── wash-40-weak.svg
    │   │   │   ├── wash-50-normal.svg
    │   │   │   ├── wash-50-weak.svg
    │   │   │   ├── wash-60-normal.svg
    │   │   │   ├── wash-60-weak.svg
    │   │   │   ├── wash-70-normal.svg
    │   │   │   ├── wash-95-normal.svg
    │   │   │   ├── wash-prohibited.svg
    │   │   │   ├── wet-clean-ok.svg
    │   │   │   ├── wet-clean-prohibited.svg
    │   │   │   ├── wet-clean-very-weak.svg
    │   │   │   └── wet-clean-weak.svg
    │   │   ├── index.html
    │   │   ├── logic.js
    │   │   └── style.css
    │   ├── geology-quiz
    │   │   ├── data.js
    │   │   ├── index.html
    │   │   ├── quiz.html
    │   │   └── timeline.html
    │   ├── list.json
    │   └── sudoku-programming-guide
    │       ├── index.html
    │       └── style.css
    ├── playground
    │   ├── dodge-game
    │   │   ├── README.md
    │   │   ├── index.html
    │   │   ├── js
    │   │   │   ├── logic.js
    │   │   │   └── modules
    │   │   │       ├── audio.js
    │   │   │       ├── canvas.js
    │   │   │       ├── constants.js
    │   │   │       └── input.js
    │   │   ├── progress.md
    │   │   └── style.css
    │   └── yaju
    │       ├── attribution.html
    │       ├── attribution.md
    │       ├── audio
    │       │   ├── YAJU&U_8bit_cut.mp3
    │       │   ├── click.mp3
    │       │   ├── hikakin.mp3
    │       │   ├── success.mp3
    │       │   └── warning.mp3
    │       ├── css
    │       │   ├── fail.css
    │       │   ├── index.css
    │       │   └── success.css
    │       ├── fail.html
    │       ├── images
    │       │   ├── cozy.jpg
    │       │   ├── hikakin.png
    │       │   └── yaju-favicon.svg
    │       ├── index.html
    │       ├── logic.js
    │       ├── passwords.js
    │       └── success.html
    ├── privacy-policy.html
    ├── projects
    │   └── list.json
    ├── quiz
    │   ├── components
    │   │   ├── answer
    │   │   │   ├── answer.css
    │   │   │   ├── choice-buttons.js
    │   │   │   ├── table-input.css
    │   │   │   ├── table-input.js
    │   │   │   └── text-input.js
    │   │   ├── demo.html
    │   │   ├── feedback
    │   │   │   ├── feedback.css
    │   │   │   └── feedback.js
    │   │   ├── modal
    │   │   │   ├── modal.css
    │   │   │   └── modal.js
    │   │   ├── progress
    │   │   │   ├── progress.css
    │   │   │   └── progress.js
    │   │   ├── question
    │   │   │   ├── question-area.css
    │   │   │   └── question-area.js
    │   │   ├── quiz-shell.css
    │   │   ├── result
    │   │   │   ├── result.css
    │   │   │   └── result.js
    │   │   └── start
    │   │       ├── start-screen.css
    │   │       └── start-screen.js
    │   ├── config
    │   │   ├── capitals.js
    │   │   ├── china-era.js
    │   │   ├── hex.js
    │   │   ├── idiom.js
    │   │   ├── jodoushi-data.js
    │   │   ├── jodoushi-table.js
    │   │   ├── jodoushi-typing.js
    │   │   ├── seikei.js
    │   │   ├── wh-event-to-year.js
    │   │   └── wh-year-to-event.js
    │   ├── index.html
    │   ├── logic.js
    │   └── tutorial
    │       └── idiom.md
    ├── seikei
    │   ├── japan-constitution-quiz.html
    │   ├── list.json
    │   └── print.html
    ├── service-worker.js
    ├── sitemap.html
    ├── sub-index.html
    ├── timeline
    │   ├── config
    │   │   ├── china-history.js
    │   │   ├── common.js
    │   │   ├── seikei.js
    │   │   ├── wh_admin.js
    │   │   └── world-history.js
    │   ├── index.html
    │   ├── script.js
    │   └── style.css
    └── wh_admin
        ├── index.html
        ├── script.js
        └── style.css

52 directories, 233 files
```
