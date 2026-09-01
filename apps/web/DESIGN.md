# Design

Recorded from the built surface at `src/pages/index.astro`. Product truth lives in `../../PRODUCT.md`.

## World

**A quiet district map.** A full-bleed map is the ground; confirmed cuts surface as soft coloured blobs, pending reports as faint dashed rings. H3 is internal plumbing only — a cell index becomes a compact privacy-safe visual area, never a drawn hexagon — so the public surface never teaches the visitor what a "resolution-9 index" is. Adjacent cells reporting the same service merge into one growing area; isolated reports stay local.

The difference between *one neighbour reporting* and *a quorum agreeing* is a matter of firmness, not of geography: both states use the same compact base footprint, while a pending area is dashed and translucent and a confirmed area is solid and stronger. The map is a heat map in spirit — intensity as confidence — without pretending to have a density field it does not collect.

## Palette

**Daylight, not dusk.** The first build rendered the garden at night, reasoning from a power cut. The owner rejected it: water cuts happen in daylight, Lima is bright, and a dark map reads as unfamiliar next to the maps people already use.

| Token | Value | Role |
|---|---|---|
| `--ground` | `#EFF2EC` | Ground — a pale garden green-gray, never plain white |
| `--surface` | `#FBFCF9` | Rail, plate, list rows |
| `--ink` | `#16201A` | Body, headings, primary-button fill |
| `--muted` | `#54655B` | Secondary prose, tinted from the ground hue, never gray |
| `--line` | `#D3DCD3` | Hairlines, control borders |
| `--agua` | `#0A6C9C` ink / `#2C9FDA` fill | Water |
| `--luz` | `#8A5A00` ink / `#F0A81E` fill | Electricity |
| `--net` | `#68399F` ink / `#9760D8` fill | Internet |

Each service carries two values: an `ink` darkened to clear 4.5:1 on the pale ground (measured, not eyeballed: 5.11, 5.24, 6.95) and a brighter `fill` for the outage blob. Colour is always paired with a written label and a drawn icon; colour alone never encodes a service.

The OSM raster basemap is **muted, not restyled**: `filter: saturate(.35) brightness(1.06) contrast(.95)` on `.leaflet-tile-pane` only.

The reason is cartographic, not cosmetic. OSM's standard style is a *mapper's reference render*: it colour-codes road classes and draws every shop, pharmacy and bus stop so contributors can verify the database. A product basemap does the opposite — it suppresses everything that is not the visitor's content. Muting the tile pane, and never the overlay pane, leaves the outage blobs at full strength over a quiet ground.

A purpose-built light basemap (CARTO Positron and its peers) is the real fix and looks like the maps people already know, but every such service now requires an API key. The no-key decision still holds; this filter is what it costs.

## Type

- **Comfortaa 600/700** — wordmark and `h1` only. Rounded, hand-adjacent, carries the map's character.
- **Nunito 400/600/800** — everything else. Rounded to match, but with the weight the scene demands (sunlight, one hand, small type).
- Distances and counts use `font-variant-numeric: tabular-nums` so the column does not jitter as it re-sorts.

## Composition

- **Mobile is primary.** Full-bleed map; a sheet with two states (`peek` / `open`) driven by `data-state` on `#rail`.
- **The map behaves like a map.** Wheel and trackpad zoom are on: this is a full-screen surface with no page scroll to protect. A persistent locate control sits under the zoom buttons, and the visitor's own position is a `divIcon` dot — never a vector.
- **Districts frame the view.** The approved pilot zones are the districts. A `#district-filter` selects which one to view; the map fits that district's bounds. When the visitor shares a position, their district is detected and selected automatically; the locate control always returns to it. "Todos" fits all reported cells instead.
- Framing rule: with a district selected, the map fits the district (and the visitor's own position when it is *their* district). With no position it opens on the pilot zone at zoom 13, never the whole metro.
- The `peek` state carries the payload, never the framing: the `#answer` line ("Lo más cerca: Agua a 190 m") sits above the fold, the headline below it.
- **Desktop ≥56rem:** the sheet becomes a fixed 25rem left rail, transform disabled, grip hidden.
- The unofficial `.plate` floats top and is never dismissible; on desktop it clears the rail at `left: 26.5rem`.

## Motion

Motion is navigation, not decoration. Leaflet's `fitBounds` / `setView` animate the district framing; tapping a report in the list flies the map to that cell centre. The visitor's own dot pulses (`animation: pulse`) as the one always-on signal.

`prefers-reduced-motion: reduce` removes the pulse and the rail transition.

## Refresh

The cell list and map poll `/v1/cells` every 30 seconds when the tab is visible, so a neighbour's report arrives without a reload. Background refresh never re-frames the map — it updates the data in place and leaves the visitor's current view alone.

## Browser surfaces

Themed, not left to defaults: `::selection`, `:focus-visible` (`--agua`, 2px, offset 3), scrollbars (`--line` on transparent), the select chevron (inline SVG in `--muted`), Leaflet's zoom control, attribution and tooltips.

## States

Empty, loading, denied-location, invalid-report, submitted, pending, and provider-error all exist. **Pending and confirmed are distinct states**, not just different shapes: a pending report reads "Posible corte de X reportado por un vecino" and draws dashed, translucent; a confirmed cut reads "Corte de X en una zona cercana" and draws solid. **Location denial is a first-class state**: the map stays on the pilot zone, `#locate` appears offering the permission on the visitor's terms, and the list falls back to a stable service order with no distances. The map's own locate control stays available in every state, not only after a denial.

## Non-negotiables

- The `#cell-list` text is the accessible equivalent of the map, not a fallback to delete.
- The raw H3 index never appears as text; an invalid index is dropped rather than mapped.
- A report count is never exposed — only `confirmed` vs not. Exact per-cell counts would let a caller fingerprint neighbours.
- The unofficial notice names Sedapal and Luz del Sur and is present in every state.
- OSM attribution stays visible; on mobile `.leaflet-bottom` lifts `9.6rem` to clear the peek sheet.
