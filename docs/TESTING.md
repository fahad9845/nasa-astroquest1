# Testing and verification

## Automated checks

```sh
npm run db:setup
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit
```

`npm test` uses Vitest and runs:

- 12 simulation tests: resource calculations, recycling/generation, bounds across 60 varied decision paths, all eight event triggers, feedback gating, meaningful choices, success, failure, restart/pause/resume, score/achievement conditions, reproducibility, and final-day failure precedence.
- 12 Supertest API tests against a fresh **real SQLite database**, created from the checked-in migration: password hashing/cookies, registration validation, origin rejection, authentication, ownership isolation, forged-state rejection, invalid decisions, stale revisions, fresh-connection persistence, full mission results, restart cleanup, login/logout, cached science routes, and a complete server habitat mission including original-save upgrade and persisted harvest.
- 2 React Testing Library/save validation tests: eight illustrated rooms support pointer/keyboard selection and accessible selected state; genuine negative decision deltas survive save parsing while invalid resources fail validation.
- 16 additional emergency/replay tests: distinct water-recovery tradeoffs, radiation-shelter consequences, oxygen-generation dependency and failure, a single failure-log entry, and twelve complete mission configurations across three sites, two difficulties and two seeds. Each configuration is replayed and compared exactly.
- 9 NASA tests: reviewed product metadata/known samples, grid coordinates, authentic server delivery, network/HTTP/JSON/tampering fallback, and measured relief affecting initial equipment integrity.
- 31 lifecycle tests: all 24 engineering decisions, actual bounded deltas, immutable input, debrief gating, depletion of oxygen/water/food/power/health/equipment, terminal-state guards, restart, and abort while paused.
- 8 habitat tests: action gating, recovery costs/effects, tending, daily crop condition/growth, one harvest, resource limits, save compatibility, reset and deterministic full-mission replay. Total: **90 tests**.

Playwright tests run on both desktop (1440 × 1000) and mobile (Pixel 7 emulation):

- Full mission from landing and briefing through all decisions, debriefs, survey, save/reload, completion, score/achievement rendering, and restart; collects runtime errors.
- Terrain site selection with a known LOLA elevation, lesson navigation, no horizontal overflow, settings, and commander abort.
- Guest gameplay with every API request blocked.
- Account registration, authoritative decision, tab refresh restoration, profile save listing, manual synchronization, refresh, logout, invalid-password error and successful sign-in. The test removes only its randomly named test account afterward.
- NASA loading, HTTP failure, verified bundled fallback, server retry, readable source metadata, and image failure/retry.
- Keyboard site selection, difficulty and seed controls, terrain-derived equipment/survey costs, all eight lessons and science-page widths 320/390/768/1024/1440 pixels.
- All eight room controls, explanations for all seven resources, maintenance/conservation, mission log, save confirmation/dismissal, cancelled and confirmed restart, guest-save loading and navigation.
- Unsafe decisions through a real day-four crew failure, exported JSON checked against the actual mission, and restored initial resources after restart.
- Corrupt guest save rejection and unavailable browser storage: an actionable warning with continued in-memory gameplay.
- All three map markers, 320-pixel route layouts, empty results, return-to-mission navigation and unknown-route recovery.
- A full room-based mission: tend, rest, survey and harvest; save/reload crop state; real journal records; finished habitat inspection; Explorer location passed into a new briefing.
- Every illustrated room, keyboard activation, matching subsystem data/science links and habitat layouts from 320 to 1440 pixels. 
- Orbital room previews and saved-room links, real telemetry changes, header active/paused status, live records, critical-alert focus, journal crew health/earned achievements, reduced motion, mouse parallax reset, theme colors and widths 320–1440. Total: **28 browser tests**, fourteen flows on each browser configuration.

## Browser setup

The checked-in configuration uses installed Microsoft Edge (`channel: 'msedge'`) to avoid a second browser download on the development machine. For Linux/CI or a machine without Edge:

1. Run `npx playwright install --with-deps chromium`.
2. Remove both `channel: 'msedge'` fields from `playwright.config.ts` (or set a locally available channel).
3. Run `npm run test:e2e`.

Tests start the local frontend/API automatically, or reuse a running development server. Start from a migrated local SQLite database and its generated client. Use a dedicated local testing environment; browser fixtures target the local database path.

Browser artifacts use a fresh ignored `outputs/playwright/<timestamp>-<process>/results` directory for each run; its sibling `report` contains the HTML report. Unique run directories prevent Windows/OneDrive locks on previous artifacts from breaking subsequent runs. Failed tests retain screenshots and traces. Run `npx playwright show-report outputs/playwright/<run>/report` to review a selected run. Tests make real local API/database calls except where failures are explicitly injected with route interception; injected responses never modify production NASA records.

## Visual review

`node scripts/capture-preview.mjs` captures desktop/mobile landing, mission, expanded NASA science, a critical alert, completed results and journal screenshots from a running development server into `docs/screenshots/`. It plays the five-day guest mission to capture real outcome states and uses headless installed Edge. Page navigation resets scroll; dialogs use Radix focus management; system reduced-motion preferences disable decorative motion. Resource descriptions open by click, touch or keyboard activation, in addition to hover tooltips.

## Verification boundaries

Automated tests validate this educational model, not scientific fidelity for operational mission planning. They do not certify radiation dose, physical oxygen generation, or landing safety. Browser automation covers installed Chromium/Edge, not Safari, Firefox, physical mobile devices, or a screen-reader audit.

Local SQLite migrations and persistence are exercised. PostgreSQL schema/migrations are supplied, but hosted PostgreSQL behavior needs a configured database. External NASA links can change independently; gameplay uses shipped caches. Production deployment checks are documented separately.

Dependency versions are locked in `package-lock.json`. The final dependency audit is recorded in the delivery summary; never assume an old audit remains current indefinitely.
