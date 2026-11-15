# Game mechanics

## Mission flow

Briefing → four-person habitat initialization → Day 1 events → decision → science debrief → optional crew assignment → daily calculation → next day. The mission ends after five **Earth-day cycles**, or earlier on failure/commander abort. It is turn based; leaving the tab open never consumes resources.

The shared engine is `packages/simulation-engine/index.ts`; event content is in `events.ts`. `simulationConfig` contains daily rates and crew size. A mission is reproducible from options and a command sequence. Seed parity changes within-day event ordering; there is no uncontrolled randomness. This first release deliberately uses a fixed educational event schedule rather than claiming random weather prediction.

## Resources

Every resource is a normalized 0–100 game value. Values are clamped and rounded to one decimal place after changes. Equipment, health, and shielding are readiness indices; other percentages represent abstract reserve capacity. No conversion to litres, kilograms, kilowatt-hours, dose, or medical risk is implied.

Initial reserves are 100, shielding is 90, and equipment is 100 minus a terrain setup cost. The terrain cost is `clamp(round(regionalReliefM / 1000), 1, 8)`. Its input is real LOLA-derived relief; the conversion to game points is fictional.

Daily calculations, using the pre-cycle equipment condition `c = equipment / 100`:

| Component | Calculation in normalized game points |
| --- | --- |
| Oxygen demand | `4 crew × 4 × difficultyMultiplier` |
| Oxygen production | `min(11 × c × poweredFactor, water × 2)` |
| Water use | `4 × 3 × difficultyMultiplier × (1 − 0.75 × c × poweredFactor)` plus `2 × actualOxygenProduction / 11` |
| Food use | `4 × 2.4 × difficultyMultiplier` |
| Solar generation | `23 × siteSunlightFactor[day] × c` |
| Power demand | `16 × difficultyMultiplier` |
| Equipment wear | `2 × difficultyMultiplier` |
| Low-reserve health penalty | 7 points for each oxygen/water/food/power reserve below 20 after the cycle |

`poweredFactor` is 1 when stored power is at least 10, otherwise 0.4. Cadet difficulty uses multiplier 1; Commander uses 1.2. The site sunlight schedule is authored, not extracted from NASA imagery. Water use, recycling, generation, and power share state, but this remains an educational dependency model rather than a mass/energy-balanced engineering simulation.

## Events

| Day | Events | Learning |
| --- | --- | --- |
| 1 | Relay outage; air-loop maintenance | Crew autonomy; air quality and verification |
| 2 | Water recovery fault; disturbed dust on arrays | Reserve margins; equipment efficiency |
| 3 | Solar particle storm | Shelter versus exposure and power/productivity tradeoffs |
| 4 | Distribution breaker; coolant pump fault | Storage and distribution; thermal control |
| 5 | Electrolyzer shutdown | Water, power, and oxygen coupling |

Each event has three decisions, resource changes, engineering points, a source, and an explanation. Safe choices consume resources; shortcuts can damage equipment or health. The engine records actual applied deltas after clamping, so a repair at full capacity never claims an impossible gain. Choices are resolved exactly once, and debriefs must be acknowledged before proceeding. The acknowledgement is a reading/progress signal, not proof of knowledge mastery.

## Optional assignments

After the day's events, assign at most one activity:

- Terrain survey: spend `4 + terrainCost` power, lose 1 equipment point, increment surveys; completes the research objective.
- Maintenance: spend 6 power, restore up to 10 equipment points.
- Conservation: restore up to 5 power points by reducing optional workload.
- Rest: spend 2 food and 2 power, restore up to 8 health and reduce shared fatigue by up to 25 points.
- Tend crop: spend 4 water and 3 power to add up to 15 crop-maturity and 12 condition points.
- Harvest: once per mission, a mature crop adds up to `12 × cropCondition / 100` food points. The actual clamped yield is logged.

All rooms share the same one-activity-per-day limit. The engine rejects activities that would exhaust required supplies, immature or repeated harvests, and actions before the day's event reviews. [Habitat design](HABITAT_DESIGN.md) documents fatigue, the pre-grown crop, daily growth/condition and original-save compatibility. These values are game assumptions. The greenhouse is supplemental and does not replace the crew's packed food.

## Outcomes and scores

Failure occurs immediately if oxygen, water, food, or power reaches zero, crew health reaches zero, or equipment reaches zero. Failure takes precedence over final-day completion. An abort is recorded separately. Success means surviving all five cycles; the health ≥ 60 and survey objectives still affect the final score.

Six equally weighted score dimensions are crew health, average remaining reserves, engineering choice points scaled against the 82-point best path, completed objectives, reviewed debriefs, and final equipment. The rounded mean is 0–100. Failed/aborted missions are capped at 49; successful missions rank Commander at ≥85, Specialist at ≥70, otherwise Cadet.

Achievements require a successful mission plus actual conditions: first completion; health ≥90; engineering ≥90; each reserve ≥40; shelter used in the solar storm; and a survey plus all eight reviewed debriefs. None are randomized.

Restart uses the same seed, difficulty, and site. It resets the run to its initial state. New mission creation preserves existing completed history. Guest progress belongs to this browser; account state is calculated and saved by the server.
