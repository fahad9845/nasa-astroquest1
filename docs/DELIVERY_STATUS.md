# Delivery status · 15 November 2026

## Implemented and verified locally

- Full five-day mission, eight consequential events, seven bounded resources, deterministic event ordering, feedback gating, crew activities, success/failure, scoring, achievements, pause/resume, restart and abort.
- NASA LOLA raster ingestion and provenance, region comparison, terrain-linked game costs, cached illumination imagery, eight source-backed learning topics.
- Dark “Orbital Observatory” design with shared tokens, interactive lunar landing, eight illuminated habitat rooms, real-state telemetry traces, crew/header status, critical alerts, contextual systems/science/actions, chronological journal with crew snapshots and earned badges, NASA Explorer, results charts, replay and debrief export. Responsive layouts, keyboard-accessible room selection/dialogs and reduced-motion support.
- Real rest/recovery, shared fatigue, tending and one greenhouse harvest through the deterministic engine. Packed provisions remain primary; the crop is explicitly pre-grown and all biological indices are game assumptions. Original saves remain supported.
- Guest saves/history and independent gameplay when the API is unavailable.
- Account registration/login/logout, scrypt password hashing, secure cookie configuration, ownership checks, server-authoritative commands, revision conflicts, persistent SQLite, tab refresh restoration and profile synchronization.
- PostgreSQL schema/migration, Vercel and Render configuration, full documentation, screenshots and presentation script.
- Static guest-demo build with account controls clearly excluded when no account API is deployed.

## Verification results

| Check | Result |
| --- | --- |
| Vitest simulation/API/component/NASA/habitat tests | 90 passed |
| Playwright desktop/mobile flows | 28 passed |
| TypeScript | Passed |
| Vite frontend + Express production bundle | Passed |
| Production smoke | Health/database connectivity, deep routes, guest launch, decision feedback, science and demo profile passed |
| Runtime dependency audit | 0 vulnerabilities |
| Responsive checks | Core routes at 320px; science and habitat at 320/390/768/1024/1440px; desktop/mobile screenshots captured and inspected |

The build emits two non-failing annotation warnings from Zod dependency comments. No compilation or browser runtime failure was observed in the verified flows.

Orbital verification: all 90 unit/API/component tests passed; the final 28-test browser run passed in 2.4 minutes, including full successful/failed missions, account saves, NASA recovery, alerts, real telemetry and reduced motion. Final TypeScript/Vite/API build and production smoke passed. Generated HTML reports are local artifacts under `outputs/playwright/<run>/report/`; old artifacts were removed during repository cleanup. Run `npm run test:e2e` to generate a new report. Subsequent runs receive separate directories to avoid Windows file locks. Runtime audit results above are retained from the earlier QA pass; Orbital added or changed no dependency.

Orbital implementation: [design notes](ORBITAL_DESIGN.md) document the palette, SVG artwork, accessible controls and motion. Original mission engine, schemas, NASA records, scoring and persistence were preserved. Source review and browser verification corrected an ambiguous status selector, synthetic pointer-test handling and an artifact-directory permission conflict. Browser/type checks and screenshot capture can run inside the Windows sandbox with command-local `NODE_OPTIONS="--preserve-symlinks --preserve-symlinks-main"`; Vite's config resolution required normal local execution. No environment override was persisted.

Foundation follow-up: extracted the reusable application shell, authentication hook and error boundary to remove page-to-App circular imports. Added standalone frontend type-check/build commands. Preserved all working routes and controls.

Engine follow-up: made failure logging idempotent, derived engineering-score maxima and specialist requirements from event definitions, added explicit emergency tradeoff coverage and twelve full deterministic replay configurations. The React-independent replay script completed five days with score 94/100 using its documented choices.

QA follow-up: verified all 24 engineering choices and every depletion condition; exercised all mission controls, all science lessons, map markers, guest storage failures, account sign-in errors, save synchronization, exports and recovery routes. Resource explanations now open by click/touch/keyboard activation. Fixed a reproduced 12px landing-page overflow at a 320px viewport by containing the decorative Moon. Completed NASA loading/error/retry and authentic fallback verification, with mobile-safe provenance formatting. See [QA report](QA_REPORT.md) for the coverage matrix and limits.

Habitat redesign follow-up: implemented the supplied Lunar Habitat Experience brief in the existing project. Added reusable scene, room-status, decision and journal components; new room commands are validated by the shared engine and API. A full server habitat mission verifies legacy-state upgrade, recovery, crop tending/harvest and persisted results. Browser coverage plays the new room-based mission end to end and verifies all eight illustrated rooms, keyboard activation, journal records, archived habitat and Explorer-to-briefing selection. Fixed the SVG keyboard handler, a briefing icon import, crowded compact status labels and an overlapping garage label during verification. See [Habitat design](HABITAT_DESIGN.md) for the implementation and scientific assumptions.

## Repository and delivery

A project-local Git repository was initialized because Git previously resolved to an unrelated ancestor repository. No unrelated files were changed, staged or committed. The project files remain uncommitted. Windows sandbox ownership may require a command-scoped `git -c safe.directory=<absolute project path>` for inspection; no global trust exception was added.

Generated source archives and staging copies were removed during GitHub preparation. Git is the source of truth for sharing the project. The optional `node scripts/package-source.mjs` command can recreate an allowlisted source staging directory and manifest under ignored `outputs/`. `.env`, database files, credentials, dependencies, test runtime artifacts, Git internals and Site identity are excluded from that package.

GitHub cleanup also removed the unreferenced legacy `Outpost.tsx` and `layout/AppShell.tsx` components, old browser reports, temporary editing scripts and raw download caches. The active `HabitatScene` and `HabitatShell`, processed NASA data, source label, imagery, tests, migrations and screenshots remain. Local dependencies, environment settings and the account database were preserved. Updated ignore rules cover environment variants, local hosting metadata and downloaded debriefs. The production build and all 90 tests passed after cleanup; the frontend and database health endpoints remained available.

## Remaining / next milestone

1. Private guest-demo publication: a private Site was registered, but automatic approval review rejected source upload through the terminal because the external destination, payload and temporary credential use lacked explicit approval. Nothing was pushed or deployed by the rejected step.
2. Full cloud deployment: configure hosting accounts and a PostgreSQL URL, apply migrations, then verify real hosted persistence, HTTPS cookies, CORS, authorization and a complete mission.
3. Optional future work: audio, 3D, longer missions, classroom evaluation, password recovery/email verification, and fresh offline startup. These are not represented as completed features.

The supplied PostgreSQL migration has not been applied to a hosted database. The tested database is SQLite. A static guest demo must not be described as a deployed account backend.
