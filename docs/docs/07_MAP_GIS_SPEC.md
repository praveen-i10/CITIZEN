# 07_MAP_GIS_SPEC.md

> Implements: FR-06 (Jurisdiction Routing), FR-07 (Duplicate Detection), FR-13 (Map/Heatmap), FR-15 (Hotspots), FR-19 (Nearby Issues), F-05, F-06, F-13, F-15, F-16, F-18.
> Depends on: 04_DATABASE.md §3.3 (`jurisdiction_zones`), §3.4 (`issues.representative_lat/lng`), §3.10 (`hotspots`); 05_API_CONTRACT.md (endpoints calling into the logic below).
> Feeds: 05_API_CONTRACT.md, 04_DATABASE.md seed data (§6 there references §2 here for exact demo coordinates approach).
> Locked technology (FINAL/AGREED, DEC-10): **Leaflet + OpenStreetMap**. All geometric logic below is deliberately simple (bounding-box / point-in-polygon on hand-authored small polygons, haversine distance) — no PostGIS, no spatial index, appropriate for a 12h SQLite-backed prototype (NFR-07).

---

## 1. Coordinate and Data Conventions

- All coordinates: WGS84 decimal degrees (`lat`, `lng`), matching Leaflet/OSM convention.
- Chennai demo area: prototype restricts jurisdiction coverage to a small, deliberately bounded subset of Chennai (e.g., 2–4 adjoining wards/localities chosen at build time for visual clarity on the map) — not full-city coverage. This bounded scope is intentional (NFR-01, time-boxed delivery) and must be visible in the UI (e.g., the map's default viewport is the covered demo area, not all of Chennai).
- Every jurisdiction/administrative element rendered in the UI must carry a persistent **"Demo jurisdiction data — not an official government dataset"** label (NFR-03, DEC-09) — enforced at the UI layer using `jurisdiction_zones.is_demo_data`.

---

## 2. Chennai Demo Jurisdiction Data (DEC-09)

### 2.1 Structure
Each `jurisdiction_zones` row (04_DATABASE.md §3.3) stores a `boundary_geojson` polygon. For a 12h build, polygons should be **simple, hand-drawn quadrilaterals or small convex polygons** around chosen demo areas — not accurate cadastral boundaries. Team-authored via a simple tool (e.g., drawing points on OSM in a GeoJSON editor, or geojson.io) and pasted into seed data.

### 2.2 Simplified Hierarchy
MASTER_CONTEXT's conceptual hierarchy (`Location → State → District → Local Body → Ward/Panchayat → Department → Officer`) is collapsed to two levels for the prototype:
```
jurisdiction_zones (local_body_type + ward_label)  →  departments (via department_id)
```
State/District are not modeled as separate tables — implicitly "Tamil Nadu / Chennai" for all demo data, not worth a table for a single-city 12h prototype.

### 2.3 Non-Authoritative Labeling Rule
Any screen showing a jurisdiction name, ward label, or department assignment derived from `jurisdiction_zones` must render the demo-data badge. This is a UI requirement driven by this spec + NFR-03, implemented wherever 05_API_CONTRACT.md responses include `jurisdiction_zone_id`/`department_id`.

---

## 3. Device Location Capture

- Captured client-side via browser/device Geolocation API (PROPOSED mechanism, not upgraded to FINAL — simplest viable choice, no alternative was discussed).
- Required at report-submission time online (Flow 1 E1: blocks submission if denied/unavailable, per DEC-02).
- Offline: last cached fix is used if available; flagged `gps_is_approximate=true` (Flow 2 E1); if no cached fix exists at all, complaint is still accepted with `location_needs_correction=true` (05_API_CONTRACT.md §3.1 step 2) rather than blocked, since offline capture must not silently fail.

---

## 4. Jurisdiction Lookup (F-05, FR-06)

**Algorithm (simplified point-in-polygon):**
1. Given a complaint's location (`device_gps_lat/lng`, or EXIF location as a secondary fallback if device GPS is entirely absent per Principle 3), test the point against each `jurisdiction_zones.boundary_geojson` polygon in seed order.
2. First polygon containing the point wins (`jurisdiction_zone_id` set). Demo data is small enough (single-digit polygon count) that no spatial index is needed — a linear scan of ~4–6 polygons per request is trivial at prototype scale.
3. Department resolution: prefer a department whose `category_types` (04_DATABASE.md §3.2) includes the complaint's `final_category` **and** belongs to the matched zone's local body; fall back to the zone's default `department_id` if no category-specific department exists in that zone.
4. No polygon contains the point → `needs_manual_routing=1`, `jurisdiction_zone_id=NULL`, `department_id=NULL` (Flow 1 E6). Never dropped — always stored and visible to admin (05_API_CONTRACT.md §5.1/§5.3 surfaces these).

**Point-in-polygon test:** standard ray-casting algorithm implemented directly in application code (no external GIS library needed for a handful of simple polygons — keeps the dependency footprint minimal per NFR-01).

---

## 5. Duplicate Detection Geospatial Logic (F-06, FR-07)

**Rule (fixed-radius + category match, PROPOSED simplified per Feature Spec):**
1. On new complaint submission, compute haversine distance from the new complaint's location to every open (`status` not in `closed`) Issue's `representative_lat/lng` that shares the same `final_category` (or AI-suggested category if not yet confirmed).
2. **Demo duplicate radius: 75 meters** (PROPOSED-05, exact threshold UNDECIDED at product-decision level — 75m is adopted here only as the prototype's working default, chosen because it comfortably covers "same pothole, opposite side of a normal street" without over-merging across a full block; must be labeled provisional if surfaced in any documentation, not treated as a final tuned value).
3. Nearest match within radius becomes the `duplicate_candidate` returned to the citizen for confirm/deny (05_API_CONTRACT.md §3.1 step 5) — never auto-merged without citizen confirmation.
4. **Known limitation (accepted per Feature Spec F-06 edge case):** two genuinely distinct issues of the same category within 75m may be incorrectly offered as a duplicate candidate. Since the citizen always confirms/denies, this is self-correcting at the UI layer and not a silent data-integrity bug — but is explicitly flagged here as a prototype-level accepted risk, not a production algorithm.

**Haversine formula** (standard great-circle distance) is used rather than planar distance, since it's a single well-known formula and no external GIS library is required.

---

## 6. Recurring Hotspot Surfacing (F-18, FR-15)

**Algorithm (simple grid clustering, PROPOSED-11 simplified per Feature Spec):**
1. Truncate every open/resolved `issues.representative_lat/lng` to a fixed grid resolution — **demo grid cell size: 0.005° latitude/longitude (~500m)**, chosen only for visual legibility on the small demo map area; not derived from any formal spatial-statistics method.
2. `grid_cell_id = "{lat_truncated}_{lng_truncated}"`.
3. Group and count Issues per cell; cells with `issue_count ≥ 3` (demo threshold from Feature Spec F-18 acceptance criteria) are surfaced as hotspots.
4. Recomputed on-demand at `GET /admin/hotspots` (05_API_CONTRACT.md §5.2) — the `hotspots` table (04_DATABASE.md §3.10) is truncated and rebuilt each time, avoiding any need for incremental-update logic in the 12h budget.
5. `dominant_category` per cell = mode of `category` among Issues in that cell (simple count, ties broken by first-seen).

This is explicitly **not** a weighted-risk heatmap (that was descoped, Feature Spec §Part A) — it is a plain density-by-count clustering, satisfying REQ-15's "surface recurring locations" requirement at prototype fidelity.

---

## 7. Nearby Issues (F-16, FR-19)

- `GET /issues/nearby` (05_API_CONTRACT.md §3.7): haversine distance filter from the citizen's current location (or Chennai demo-area center if location denied — Flow 4 E2), default **radius 1500m** (chosen to comfortably cover the small demo jurisdiction area without an empty result in the common case; adjustable at build time, not a hard product decision).
- Returns only aggregated Issue-level fields (§7 of 05_API_CONTRACT.md — no reporter identity, per NFR-06).
- Empty result → empty state ("No unresolved issues near you," Flow 4 E1).

---

## 8. Officer Map & Dashboard Rendering (F-13, FR-13)

- Officer dashboard map (05_API_CONTRACT.md §4.1) renders Leaflet markers for each open Issue in the officer's `jurisdiction_zone_id`/`department_id`, colored/sized by `priority_score` band (simple 3-tier: high/medium/low, thresholds e.g. ≥66/≥33/<33 on the 0–100 scale — a UI convenience derived from the already-computed `priority_score`, not a separate GIS computation).
- Optional simple density overlay (SHOULD HAVE per Feature Spec F-13): reuse the same grid-count approach as §6, restricted to the officer's jurisdiction, rendered as a Leaflet heat-layer or simple colored-cell overlay — **not** the admin-wide hotspot feature, though it shares the same underlying algorithm for consistency and to avoid building two separate clustering implementations in 12h.
- Selecting a pin opens the Issue detail (`GET /officer/issues/{id}`); list and map share the same underlying dataset so they never desync.

---

## 9. Resolution Distance Tolerance (F-15, FR-18)

Referenced from 05_API_CONTRACT.md §4.5 — defined here since it is a geospatial rule:
- Officer resolution GPS vs. the Issue's `representative_lat/lng`: haversine distance computed.
- **Demo tolerance: 100 meters** (Open Question 30, UNDECIDED at product-decision level — 100m adopted here only as the prototype's working default; intentionally looser than the 75m duplicate radius since an officer's resolution point may reasonably be a few meters off from the original citizen's exact standing position for the same physical issue).
- Within tolerance → `matched`. Outside tolerance or GPS unavailable → `needs_verification` (conservative default per Flow 6 E2, Principle 10 — never an automatic accusation, just a routed review state).

---

## 10. Explicit Non-Goals

- No third-party geocoding/reverse-geocoding service is integrated (out of scope, time-boxed).
- No spatial database extension (e.g., SpatiaLite) — plain SQLite + application-code geometry is sufficient at demo data volumes (single-digit polygons, low-hundreds of Issues at most).
- No real-time officer location tracking — only point-in-time GPS capture at report/resolution moments.
- No routing/navigation features for officers.

---

## 11. Consistency Cross-Check

- FR-06 → §4 (jurisdiction lookup), consumed by 05_API_CONTRACT.md §3.1 step 6.
- FR-07 → §5 (duplicate detection), consumed by 05_API_CONTRACT.md §3.1 step 5 and §3.3.
- FR-13 → §8 (officer map), consumed by 05_API_CONTRACT.md §4.1.
- FR-15 → §6 (hotspots), consumed by 05_API_CONTRACT.md §5.2.
- FR-18 → §9 (resolution tolerance), consumed by 05_API_CONTRACT.md §4.5.
- FR-19 → §7 (nearby issues), consumed by 05_API_CONTRACT.md §3.7, respecting NFR-06 privacy rules defined in 05_API_CONTRACT.md §7.
- All demo/thresholds (75m duplicate radius, 100m resolution tolerance, 500m grid cell, 1500m nearby radius, hotspot count≥3) are explicitly marked as prototype defaults, not final product decisions, consistent with their UNDECIDED status in MASTER_CONTEXT.
