# AstroQuest — Orbital Observatory

Implemented in the existing application, 15 November 2026. ORBITAL changes the presentation and improves access to existing mission information. The shared simulation, daily rates, event ordering, scores, NASA data, routes, account API and saved-state schema are unchanged in this pass.

## Visual system

`apps/web/src/orbital-tokens.css` defines reusable backgrounds (#070B12, #0B111B, #101827), text (#F5F8FF, #9BAAC2), blue (#68B5FF), cyan (#80E5E7), violet (#9A8AFF), semantic status colors and borders. `habitat.css` retains the responsive habitat layouts using these tokens; `orbital.css` defines observatory presentation and component states. Local Inter, Space Grotesk and JetBrains Mono fonts remain in use. No dependency was added.

The landing retains the requested headline and working mission/science links. Its interactive SVG shows layered terrain, sparse stars, an Earth illustration, craters, shadows, illuminated windows and eight room labels. Selecting a room reveals its science and links to briefing or the matching saved-mission room. Mobile users also receive eight full-size room selectors. This is original architectural artwork, explicitly labeled as illustration, not a NASA image or a site reconstruction.

The dark navigation identifies the active route with a thin blue line. Mission status comes from the saved mission, including pause, failure and completion. The account and briefing controls remain available.

## Mission information

- The overview shows all seven existing indices, shared crew health, day/progress and save mode. `TelemetryTrace` renders actual daily engine snapshots plus the current reading, on a fixed 0–100 scale. It exposes the underlying values to assistive technology and never fabricates intermediate readings.
- Critical events and reserves below 25 receive a conspicuous, text-labeled alert. Its review control scrolls and focuses the existing decision panel. No new rule, emergency or resource cost is introduced.
- Event panels retain every choice, cost, immediate outcome and source reference. Crew-impact text uses actual shared health and the event's defined health effects. Decision/outcome transitions are short fades.
- The live feed shows the latest three existing log entries. The full journal groups actual records by day, with decisions, reviewed scientific explanations, end-of-day crew health/equipment/reserves, and terminal achievements from the engine's `evaluate` function.
- Results preserve success/failure, score dimensions, resource charts, objectives, lessons, badge conditions and JSON export. Replay resets through the existing engine command; Return to habitat opens the terminal state for inspection.

NASA Explorer, science lessons and provenance use the same archival LOLA data and SVS imagery. Observed terrain and derived relief remain distinct from authored mission assumptions. See [NASA sources](NASA_DATA_SOURCES.md) and [habitat mechanics](HABITAT_DESIGN.md).

## Motion, input and performance

Page changes, resource readings and event outcomes use existing Framer Motion. The illustration uses lightweight SVG, no image request, WebGL, extra library or animation loop. Only background terrain/celestial layers move by a few pixels with a mouse; interactive buildings remain stable. Touch input does not trigger parallax. System reduced-motion disables decorative animation, terrain motion and CSS transitions. Opacity transitions are brief and do not block controls.

Room selection supports pointer, Enter and Space; selected state is exposed through `aria-pressed`. The existing mobile room controls, labeled resource meters, resource dialogs, skip link and Radix focus handling remain. Critical state is conveyed by text as well as color. Safe-area spacing protects the mobile action/navigation bars.

## Verification

The regression suite covers full successful and failed missions, all decisions, restart, saved progress, guest/API failure handling and NASA fallback. Orbital browser coverage adds interactive landing-to-room navigation, actual telemetry readings after a decision, active/paused header status, live records, critical-alert focus, journal crew snapshots/badges, reduced motion, pointer reset and layouts from 320 to 1440 pixels. Production smoke checks the built frontend/API and deep routes.

Final pass counts and verification limits are recorded in [Delivery status](DELIVERY_STATUS.md). Desktop/mobile screenshots are in `docs/screenshots/`. Browser coverage uses installed Edge and device emulation; physical mobile devices, Safari, Firefox and a screen-reader audit remain separate validation work. This local redesign does not imply a hosted deployment.
