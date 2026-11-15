# AstroQuest — Habitat systems

Implemented 15 November 2026, following the supplied Lunar Habitat Experience brief. The existing React/Vite application, shared deterministic engine, NASA caches, account API, scoring and persistence remain the foundation.

## Experience

The original architectural habitat has been updated to the dark [Orbital design system](ORBITAL_DESIGN.md), with blue/cyan telemetry, a layered lunar scene and restrained illumination. Local Inter, Space Grotesk and JetBrains Mono fonts remain in use. The room architecture and mechanics described here remain the foundation. The landing introduces the mission with “A NEW HOME. A NEW FRONTIER.” and a panoramic habitat illustration. Artwork is original interface illustration, not NASA imagery.

The main navigation contains Lunar Habitat, Lunar Explorer, Science Center and Mission Journal. Briefing and the commander account remain available through compact header controls. On mobile, primary navigation moves to a labeled bottom bar.

Eight rooms can be selected through the illustration or a keyboard-accessible button group. Each displays its purpose, actual resource values, operational status, engineering insight, reference link and applicable actions:

| Room | Functional behavior |
| --- | --- |
| Crew Quarters | Shared crew health/protection, accumulated fatigue, rest and recovery |
| Life Support | Oxygen, water and system integrity; equipment maintenance |
| Greenhouse | Food/water reserves, crop maturity/condition, tending and one harvest |
| Power Station | Stored power, equipment condition, calculated next-cycle generation/demand, conservation and maintenance |
| Rover Garage | Equipment maintenance and NASA-relief-dependent survey preparation |
| Laboratory | Reviewed lesson count, completed surveys, discovery journal and terrain explorer |
| Equipment Storage | Equipment condition and reserve-preserving maintenance |
| Airlock | Radiation protection, oxygen and surface-survey preparation |

The mission overview remains compact. Detailed systems live in the selected room. The persistent next-step bar opens the current event/debrief or advances the day. Events retain every original choice and consequence. The journal groups actual log entries, decisions, resource changes, reviewed science and daily snapshots chronologically. Results retain score, achievements, charts, export and restart, with links to the journal, science and a read-only view of the final habitat.

The Explorer uses the reviewed LOLA grid. A selected region can seed a new briefing; exploring never relocates an existing mission.

## Components and architecture

```
apps/web/src/components/habitat/
  HabitatScene.tsx       # Lightweight SVG; pointer, keyboard and room selection
  RoomStatusPanel.tsx    # Current state, available actions, contextual learning
  DecisionPanel.tsx      # Existing event decisions and science debriefs
  MissionJournal.tsx     # Chronological actual mission records
  rooms.ts              # Room metadata and navigation
apps/web/src/components/layout/HabitatShell.tsx
apps/web/src/pages/{Landing,Mission,Journal,Explorer,Results}.tsx
apps/web/src/habitat.css # Responsive habitat layouts using shared tokens
apps/web/src/orbital-tokens.css # Shared palette and semantic colors
apps/web/src/orbital.css # Observatory presentation and interactions
packages/simulation-engine/{index,types,schema}.ts
```

All state changes pass through the shared engine. Account missions submit the same commands to the authoritative API. New activities use the existing one-activity-per-day rule and cannot run while paused, after mission end, before decisions/debriefs, or without sufficient reserves.

## New teaching mechanics

These are deliberately simplified **game indices**, not physiological measurements, crop forecasts or NASA operating parameters. Constants are in `habitatConfig`.

- Fatigue starts at 0, increases by 8 per daily cycle plus 3 per shortage, and by 8 for a survey. Rest costs 2 food and 2 power, reduces fatigue by up to 25 and restores up to 8 health points. All indices remain bounded at 0–100.
- The greenhouse starts with a fictional **pre-grown crop** at 70% maturity and 80% condition. It was planted before crew arrival; the application does not imply a full crop grows in five days.
- Tending costs 4 water and 3 power, adds up to 15 maturity and 12 condition points. Supported daily cycles add up to 5 maturity and cost 5 condition points; water/power below 20 or equipment below 25 prevents that growth and costs 15 condition instead.
- Harvest is available at 100% maturity with positive condition, once per mission. It adds up to `12 × condition / 100` food points, bounded by reserve capacity. The journal records the actual added amount. Packed provisions remain the main food supply.
- Existing resource-consumption formulas, eight emergencies, outcomes, scoring and achievements are unchanged. A player who uses only the original activities gets the same original resource balances.

## Saved missions

`MissionState.habitat` is an additive optional field in the existing version-1 save schema. Original saves remain valid. `habitatFor` supplies deterministic defaults based on completed days when the field is absent; the next command persists it. It never rewrites previous resources, decisions, scores or logs. This upgrade is tested for device saves and server state. Database tables need no migration because mission snapshots already store validated JSON.

## Scientific source

The greenhouse insight draws from [NASA: Growing Plants in Space](https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/). NASA describes controlled plant growth and supplemental food on the ISS. Its context is distinguished from this fictional lunar greenhouse. No new NASA numerical dataset is claimed. Existing [LOLA/SVS provenance](NASA_DATA_SOURCES.md) remains in force.

## Verification

Habitat tests cover action gating, real reserve costs, recovery, crop development, harvest, failed actions, deterministic replay, reset and original saves. API coverage plays an entire server-authoritative habitat mission, including legacy state upgrade and persisted harvest. Browser coverage exercises all eight illustrated rooms, keyboard selection, mobile layouts, tend/rest/harvest, full mission completion, journal, archived habitat and Explorer-to-briefing selection. Existing success/failure, NASA recovery, account and guest-storage regressions remain in the suite.

Publication, hosted PostgreSQL, physical devices, Safari and Firefox remain separate verification work. No deployment is implied by this redesign.
