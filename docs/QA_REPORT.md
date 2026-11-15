# AstroQuest QA report

Scope: existing React application, shared simulation engine, Express API, Prisma schemas/migrations, NASA ingestion/cache/delivery, routes, storage, deployment configuration and documentation. The complete challenge statement was reviewed against the existing implementation. Existing game rules and mission choices were preserved.

15 November 2026 redesign: the architectural [habitat](HABITAT_DESIGN.md) now uses the dark [Orbital observatory](ORBITAL_DESIGN.md). Original tests were adapted to the new navigation without removing their gameplay assertions. New coverage tests eight room selectors, fatigue/recovery, the pre-grown crop, harvest, journal, Explorer and original save compatibility. Production smoke verifies the new landing, habitat initialization and decision feedback.

## Fixes and completed integration work

- Resource explanation buttons now open accessible dialogs containing the actual current value and scientific limitations. Hover tooltips remain available. All seven descriptions are covered by browser tests.
- The mobile Moon illustration is clipped within its decorative panel. A reproduced 320-pixel landing-page overflow (332-pixel document width) motivated this fix.
- NASA provenance, status, retry and image-error UI received responsive styling; the source digest wraps within its panel. Site buttons expose their selected state to assistive technology.
- NASA server delivery is checked against the reviewed archival bundle, with a four-second timeout and an authentic bundled fallback. The UI exposes loading/failure/retry status; image failure also has recovery controls. No simulated records replace NASA values.
- Browser artifacts now use a fresh `outputs/playwright/<timestamp>-<process>/` directory for each run, after Windows retained handles to previous results. The save-notification test now identifies its specific status message because the header also exposes mission status. Pointer-reset verification uses real mouse movement to exercise React’s pointer-leave handler.

## Coverage

| Area | Verification |
| --- | --- |
| Start and setup | Landing → briefing → mission; site, difficulty and seed; account and guest modes |
| Progression | Complete five-day missions, eight events, daily consumption, debrief gating, objectives, scores and achievements |
| Decisions | All 24 choices checked for bounded effects, recorded actual deltas and immutable input; safe and unsafe browser playthroughs |
| Depletion | Oxygen, water, food, power, crew health and equipment failure; single failure log; terminal guards; final-day failure precedence |
| Restart | Successful and failed mission restart; paused abort; cancel/confirm reset; initial configuration and resources restored |
| Persistence | Guest save/reload, corrupt saves, storage-write errors, real SQLite API persistence, account refresh/login/logout and authoritative commands |
| Controls | Eight room selectors, seven resource explanations, six activities, pause/resume, log, save, settings, abort, restart, all lessons, map markers, export, journal and navigation |
| NASA | Known LOLA values, grid dimensions, coordinate indexing, source metadata, relief-derived costs, server response matching, HTTP/network/JSON/tampering fallback, browser retry, image recovery |
| Orbital controls | Interactive landing rooms, saved-room links, actual telemetry history, active/paused status, log updates, critical-alert focus, journal health/badges, reduced motion and pointer reset |
| Responsive UI | Desktop and Pixel 7 emulation; science layouts at 320/390/768/1024/1440 pixels; core routes at 320 pixels; desktop/mobile screenshots |
| Production | TypeScript and build checks; local production health/database, SPA deep routes, mission initialization, decision feedback, science and profile |

Test data is isolated: API tests use temporary databases, browser account fixtures delete only their randomly named users, and NASA failure injection intercepts browser requests without changing the shipped dataset. Browser exports are parsed and compared to the actual saved mission.

## Reproduce

```sh
npm test
npm run build
npm run build:web
npm run test:e2e
node scripts/smoke-production.mjs
node scripts/capture-preview.mjs
npm audit --omit=dev
```

See [Testing](TESTING.md) for environment setup and browser report locations, and [Delivery status](DELIVERY_STATUS.md) for final pass counts. Development uses `http://127.0.0.1:5173` with the API at port 3001. Production smoke tests temporarily use port 3002 and close their server afterward.

## Limits and next milestone

The verified database is local SQLite. Hosted PostgreSQL, deployment/HTTPS cookies, Firefox, Safari, physical mobile devices and a full screen-reader audit remain unverified. Tests establish behavior of this educational model, not operational lunar mission accuracy. Two non-failing dependency annotation warnings remain in the Vite build.

The next milestone is a configured hosted PostgreSQL deployment followed by hosted authentication/persistence and cross-browser QA. Optional audio, 3D, longer missions and fresh offline startup remain outside this release.
