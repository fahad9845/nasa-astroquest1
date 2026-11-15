# AstroQuest presentation

## Thirty-second pitch

“Four astronauts, five days, and every decision has a consequence. AstroQuest lets students command a lunar outpost, experience the connections between water, oxygen, electricity, and crew safety, then understand the science behind the outcome. We use real NASA LOLA terrain for regional exploration, while clearly labeling our fictional mission assumptions.”

## Five-minute demonstration

1. **0:00–0:40 — The mission.** Open the landing page and begin a guest mission. Explain that no account is needed. Select Aurora Ridge and compare its measured elevation and regional relief with Horizon Station.
2. **0:40–1:40 — A home with connected rooms.** Initialize the mission and select the greenhouse and crew quarters in the illustration. Point out actual crop and fatigue indices and explain the pre-grown crop assumption. Open the journal event, use the onboard checklist and review its cost and science. Replace the air-loop filter and acknowledge its explanation.
3. **1:40–2:20 — An interconnected system.** Select Rover Garage and assign a terrain survey, then advance the day. Point out daily oxygen, water, food, and power changes. Explain that oxygen production draws on water and power and that equipment condition affects recycling and generation. The other rooms offer rest, tending, maintenance and conservation under the same daily activity limit.
4. **2:20–3:10 — Real data, honest limits.** Open the science center. Compare real LOLA heights and explain the coarse grid. Show the NASA illumination image and its attribution. State explicitly that the game's five-day sunlight schedule is fictional.
5. **3:10–4:10 — Protect the crew.** Return to the mission, repair water recovery, clean panels, advance, and shelter during the simulated particle storm. Discuss the consequence of continuing surface work.
6. **4:10–5:00 — The mission story.** Complete remaining events with the first option, review each explanation, and finish Day 5. Show the score dimensions, resource history, achievements and exported debrief. Open the chronological mission journal, inspect the preserved final habitat, then restart to demonstrate reproducibility.

For a shorter pitch, prepare a separate run near the final day. Do not present precomputed telemetry or a static success screen as live gameplay.

## Explain the architecture

One deterministic TypeScript engine runs locally for guests and on the server for accounts. Account clients submit decisions and revisions; they cannot upload a score. PostgreSQL is the production database, with a tested SQLite development alternative. NASA data is ingested once, validated, cached, and cited.

## What is scientifically real?

- LRO/LOLA elevation values, reference sphere, coordinate frame, and derived regional relief.
- NASA life-support and lunar environment principles.
- NASA's published illumination visualization.

Resource indices, event timing, the five-day mission, cost formulas, and outpost names are educational abstractions. A successful game run does not validate an actual lunar mission.

## Suggested slides

1. Problem: space systems are often taught separately, but mission decisions connect them.
2. Experience: a student becomes the mission commander.
3. Playable loop: briefing → decision → consequences → science → debrief.
4. NASA contribution: measured terrain and source-backed lessons, with explicit limits.
5. Engineering: shared engine, server authority, persistence, tests.
6. Demonstration, learning outcomes, and next steps.

## Evidence to show

- `docs/screenshots/landing-desktop.png` and `mission-desktop.png`.
- Mobile screenshots and browser test report.
- `docs/NASA_DATA_SOURCES.md`, retained PDS label, and dataset SHA-256.
- Simulation tests that demonstrate both success and failure; API tests that reject forged state and cross-user access.

## Next steps, after this release

Evaluate the learning experience with students and teachers, add accessible quizzes, use higher-resolution terrain for a tightly bounded region, and add physically grounded illumination inputs only after validating their metadata. Consider longer missions, additional templates, and optional 3D once the core experience has been evaluated.
