# NASA data provenance

Reviewed and downloaded 14 November 2026. No NASA endorsement or validation is claimed.

## 1. LRO/LOLA LDEM_4 V3.0 — integrated numerical data

| Field | Value |
| --- | --- |
| Dataset ID | `LRO-L-LOLA-4-GDR-V1.0` |
| Product | `LDEM_4`, product version `V3.0` |
| Instrument | Lunar Orbiter Laser Altimeter, Lunar Reconnaissance Orbiter |
| Producer | LRO LOLA Team, NASA Goddard Space Flight Center |
| Discovery portal | https://ode.rsl.wustl.edu/moon/ |
| IMG endpoint | https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_4.img |
| Label endpoint | https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_4.lbl |
| Format | PDS3 detached ASCII label + 2,073,600-byte binary raster |
| Shape | 720 rows × 1,440 columns; signed little-endian 16-bit integer |
| Units | Height in metres relative to a reference sphere of radius 1,737,400 m |
| Conversion | `height_m = signed_DN × 0.5`; radius adds 1,737,400 m |
| Projection | Simple cylindrical; east-positive longitude 0–360° |
| Frame | Body-fixed Mean Earth/Polar Axis of DE421, per the label |
| Resolution | 4 pixels/degree, or 0.25°; nominal equatorial scale 7,580.84 m/pixel |
| Pixel centres | latitude `90 − (row + 0.5)/4`; longitude `(column + 0.5)/4` |
| Product creation | 2017-09-15; input coverage stated in the label: 2009-07-13 through 2016-11-29 |
| SHA-256 | `c04632eba6449af49e3108ed7c25b3b1c450600abd3690df4fc815853a1af476` |

Processing in `scripts/ingest-nasa.mjs`:

1. Download and retain the detached label; verify dimensions, byte order, scaling, and longitude convention.
2. Download the IMG once to `.cache`; validate exact byte length and record a SHA-256 digest.
3. For display, take every eighth source pixel, producing a 180 × 90 grid. The first sample is 89.875° N, 0.125° E and spacing is 2°. This is point subsampling, not averaging.
4. Read three site samples at native resolution. For each, compute the maximum minus minimum of its 3 × 3 native neighborhood. This is **regional relief**, not slope.
5. Save the grid, sites, coordinate metadata, source URLs, and digest to `apps/web/src/data/nasa/processed/terrain.json`.

| Fictional outpost | Raster centre | Measured height | Derived 3 × 3 relief |
| --- | --- | --- | --- |
| Aurora Ridge | 85.125° S, 0.125° E | −768.5 m | 1,640 m |
| Horizon Station | 85.125° S, 90.125° E | −3,768 m | 81.5 m |
| Farpoint Base | 82.125° S, 180.125° E | −2,687.5 m | 160.5 m |

Functional use: map exploration, site comparisons, briefing, and the engine's initial equipment wear and survey power cost. The cost conversion is an authored game rule: clamp rounded relief/1,000 to 1–8 points; a survey costs four additional points. It is not NASA's engineering model.

Limitations: the label reports interpolation and potential 45° latitude-band edge artifacts. Polar cylindrical pixels are distorted and have different east–west dimensions. The display can alias fine features. Neither this grid nor the derived relief certifies landings, identifies a safe ridge, or supports rover navigation. Outpost names do not identify real facilities or NASA-selected landing sites.

Attribution: NASA LRO/LOLA Science Team; NASA PDS Geosciences Node, Washington University in St. Louis. Preserve label and provenance when redistributing derived products.

## 2. NASA SVS south-pole illumination — integrated imagery

- Product: *Illumination at the Moon's South Pole to 80°S, 2025 to 2028*, SVS ID 5027.
- Official source: https://svs.gsfc.nasa.gov/5027
- Selected download: https://svs.gsfc.nasa.gov/vis/a000000/a005000/a005027/moon.2025_print.jpg
- Format: JPEG, 1024 × 576; cached at `apps/web/public/nasa/south-pole-illumination.jpg`.
- Data basis: LOLA terrain and ephemerides documented on the source page. The page offers images, frame sets, and videos, not a quantitative irradiance API.
- Processing: downloaded unchanged. No brightness-to-energy conversion, georeferencing, or numerical extraction.
- Functional use: science-center illumination comparison linked to power and shadow lessons.
- Units/coordinates: a rendered scientific visualization, not a georeferenced numeric raster. Read the original annotation and source for context.
- Credit: NASA/Goddard Space Flight Center Scientific Visualization Studio.
- Limitations: one cached 2025 visualization image does not represent the user's five-day mission, current conditions, or electrical generation. All five-day sunlight factors are authored and marked **simulated**.

## 3. Moon Trek — investigated, external exploration

- Portal: https://trek.nasa.gov/moon/
- Verified service documentation entry: https://trek.nasa.gov/tiles/apidoc/
- NASA API catalog: https://api.nasa.gov/ (also documents Trek WMTS services).
- Moon Trek exposes documented OGC WMTS layer services. This release provides functional exploration links and uses the independently downloaded PDS terrain product for deterministic local maps.
- No unverified tile endpoint is called, no live Trek availability is required, and no claim is made that Trek is a numerical power API.

## 4. ECLSS — educational engineering reference

Official reference: https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/

Functional use: water treatment, air revitalization, and oxygen generation lessons and event explanations. Water treatment checks purity; air revitalization removes contaminants; electrolysis connects oxygen production with water and power. These are ISS references adapted to a hypothetical lunar habitat. The game's 75% base recycling factor is an authored balancing parameter, not a claim about ISS performance or a specified lunar system.

## 5. Lunar environment — educational references

- https://science.nasa.gov/moon/weather-on-the-moon/
- https://science.nasa.gov/moon/facts/

Functional use: radiation, thermal-control, dust, and communication-outage explanations. Dust buildup is attributed to surface operations, not wind. The communication event is a relay failure, not a confusion between long outages and light-travel time. Radiation readiness is not a physical dose measure. Cabin thermal control is not identical to the outside surface temperature.

## Scientific integrity and fallback policy

The habitat greenhouse uses [NASA's Growing Plants in Space](https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/) as contextual education about controlled plant growth and supplemental food on the ISS (reviewed 15 November 2026). It is not a new numerical dataset. The fictional greenhouse starts with a crop planted before arrival; maturity, condition, tending costs and yield are authored game rules. No five-day seed-to-harvest capability or NASA-validated lunar greenhouse is claimed.

- Real data is limited to the identified raster-derived measurements and downloaded NASA imagery.
- Educational references are not fabricated dataset rows. Authored content is kept separate from the measured grid.
- No NASA POWER Earth irradiance data is used. No API keys are exposed or required.
- Downloads fail clearly instead of fabricating records. Shipped cached products keep the application playable when NASA services are unavailable.
- The map immediately renders the reviewed bundled grid while checking `/api/nasa/lunar-terrain` (four-second timeout). Every returned metadata field, grid sample and site record must match the reviewed bundle; an unavailable, malformed or changed response falls back to that authentic bundle. The UI reports delivery status and offers a retry. This compares copies of an archival product; it is not a live NASA observation feed.
- Expand **Dataset provenance & mission effect** in the map to see source units, coordinates, native resolution, source links, digest, and the selected site's actual equipment/survey game costs. Site selection is available through keyboard-accessible buttons as well as map markers.
- The cached SVS image reports loading/failure and provides an image retry plus the official source link. Image failure does not prevent the illumination lesson or terrain-backed gameplay.
- Live solar storm prediction, thermal simulation, dose calculation, physical ECLSS sizing, and exact illumination schedules are outside this educational model.
