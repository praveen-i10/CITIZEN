# 04_DATABASE.md

> Implements: 01_REQUIREMENTS.md (FR-01–FR-20), 02_USER_FLOWS.md (all flows), 03_FEATURE_SPEC.md (F-01–F-18).
> Engine: **SQLite** (FINAL/AGREED, NFR-07). No ORM assumed beyond simple parameterized queries — kept minimal for a 12h build.
> Depends on: 05_API_CONTRACT.md (every field here must be reachable by an endpoint), 06_AI_SPEC.md (categorisation/confidence fields), 07_MAP_GIS_SPEC.md (jurisdiction/location fields), 09_SECURITY.md (auth/role fields).
> Feeds: 05, 06, 07, 09 all assume this schema.

---

## 1. Design Principles

1. **Complaint vs. Issue is structural, not a status flag.** `complaints` = individual citizen submissions (FR-20, DEC-11). `issues` = the real-world problem; one `issue` has 1..N `complaints`.
2. All statuses are stored as plain `TEXT` with an application-level enum (SQLite has no native enum) — validated in the API layer (05_API_CONTRACT.md §4).
3. Evidence Confidence and Risk/Priority are **separate columns** on `issues` (Principle 6), each independently recomputable.
4. No destructive deletes anywhere a citizen's complaint is involved (Principle 8) — `complaints` rows are never deleted, only reassigned (`issue_id`) or flagged.
5. Chennai jurisdiction data is clearly namespaced and labeled non-authoritative (NFR-03) via the `is_demo_data` marker convention (all seed rows in this domain are demo data — no production/demo split is needed since 100% of jurisdiction data is demo for this prototype).
6. Authentication mechanism is UNDECIDED (NFR-08) — `users` includes only what is needed for role separation, not a specific auth scheme. See 09_SECURITY.md.

---

## 2. Entity-Relationship Overview

```
departments ──< jurisdiction_zones >── (spatial polygon, simplified as bounding data)
     │
     ├──< users (role=officer, department_id) 
     │
issues ──< complaints >── users (role=citizen, reporter)
  │  │
  │  ├──< resolution_evidence (1:1 per resolution attempt)
  │  ├──< status_history >──
  │  └──< issue_evidence_signals (feeds Evidence Confidence)
  │
notifications ──> complaints / issues
sms_outbox ──> notifications
suspicious_flags ──> complaints
hotspots (derived/materialized, recomputed) ──> issues (by grid cell)
```

---

## 3. Tables

### 3.1 `users`
Represents citizens, officers, and admins (FR-16, Section 6 MASTER_CONTEXT). Auth mechanism deliberately not prescribed (NFR-08).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PK AUTOINCREMENT | |
| role | TEXT | NOT NULL, CHECK IN ('citizen','officer','admin') | role separation, no fine-grained admin permissions (Part C, feature spec) |
| display_name | TEXT | NOT NULL | |
| phone_number | TEXT | NOT NULL, UNIQUE | used as SMS destination (mock) and as citizen identifier for the prototype (see 09_SECURITY.md — not a real auth credential) |
| department_id | INTEGER | NULL, FK → departments.id | required only for role='officer' |
| jurisdiction_zone_id | INTEGER | NULL, FK → jurisdiction_zones.id | officer's assigned zone, for dashboard scoping (FR-13) |
| created_at | TEXT | NOT NULL DEFAULT (datetime('now')) | ISO8601 |

Index: `idx_users_role`, `idx_users_department`.

### 3.2 `departments`
FR-06, FR-14.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PK AUTOINCREMENT | |
| name | TEXT | NOT NULL | e.g. "Roads & Infrastructure", "Solid Waste Management", "Streetlighting", "Water Supply (Metro Water demo)" |
| category_types | TEXT | NOT NULL | JSON array of `issue_category` values this department handles, e.g. `["pothole","road_damage"]` |
| is_demo_data | INTEGER | NOT NULL DEFAULT 1 | always 1 in this prototype (NFR-03) |

### 3.3 `jurisdiction_zones`
Team-provided Chennai demo data (DEC-09, NFR-03). See 07_MAP_GIS_SPEC.md for the geometric model used at lookup time; this table stores the zone identity + department mapping only.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PK AUTOINCREMENT | |
| zone_name | TEXT | NOT NULL | e.g. "Zone 5 - Demo Adyar" |
| local_body_type | TEXT | NOT NULL, CHECK IN ('corporation_zone','municipality_demo','panchayat_demo') | simplified hierarchy per MASTER_CONTEXT §7 ("Location → State → District → Local Body → Ward/Panchayat → Department → Officer"), collapsed for prototype |
| ward_label | TEXT | NULL | e.g. "Ward 175 (demo)" |
| department_id | INTEGER | NOT NULL, FK → departments.id | default department for issues in this zone lacking a more specific category rule |
| boundary_geojson | TEXT | NOT NULL | GeoJSON polygon/bbox, team-authored (see 07_MAP_GIS_SPEC.md §2) |
| is_demo_data | INTEGER | NOT NULL DEFAULT 1 | always 1 — must render with a "demo data, non-authoritative" badge per NFR-03 |

Index: none spatial (SQLite has no native GIS index in this minimal build); lookup done in application code per 07_MAP_GIS_SPEC.md.

### 3.4 `issues`
The real-world civic problem (FR-20, DEC-11). One row per distinct problem.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PK AUTOINCREMENT | |
| category | TEXT | NOT NULL, CHECK IN (fixed list — §5.1) | set from first complaint's confirmed category |
| status | TEXT | NOT NULL DEFAULT 'submitted', CHECK IN (fixed list — §5.2) | |
| jurisdiction_zone_id | INTEGER | NULL, FK → jurisdiction_zones.id | NULL = unassigned/needs manual routing (Flow 1 E6) |
| department_id | INTEGER | NULL, FK → departments.id | resolved routing target |
| representative_lat | REAL | NOT NULL | location of first complaint; used for map pin & jurisdiction lookup |
| representative_lng | REAL | NOT NULL | |
| evidence_confidence_band | TEXT | NULL, CHECK IN ('high','needs_verification','low') | F-08; recomputed, never a fraud verdict |
| evidence_confidence_score | REAL | NULL | raw 0–1 value backing the band |
| priority_score | REAL | NOT NULL DEFAULT 0 | F-09 weighted sum, 0–100 scale |
| priority_breakdown_json | TEXT | NULL | JSON of the 8 factor sub-scores, shown to officers (FR-13) |
| needs_manual_routing | INTEGER | NOT NULL DEFAULT 0 | 1 if no jurisdiction match (Flow 1 E6) |
| created_at | TEXT | NOT NULL DEFAULT (datetime('now')) | |
| updated_at | TEXT | NOT NULL DEFAULT (datetime('now')) | |
| resolved_at | TEXT | NULL | set when status first becomes 'resolved' |
| closed_at | TEXT | NULL | set when citizen confirms |

Indexes: `idx_issues_status`, `idx_issues_department`, `idx_issues_jurisdiction`, `idx_issues_category`, `idx_issues_location (representative_lat, representative_lng)`.

### 3.5 `complaints`
Individual citizen submissions (FR-01, FR-20). Never deleted (Principle 8).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PK AUTOINCREMENT | |
| reference_id | TEXT | NOT NULL, UNIQUE | human-shown ID, e.g. `CVC-2026-000123` |
| issue_id | INTEGER | NOT NULL, FK → issues.id | always linked; a "new Issue" is created and immediately linked to its first complaint |
| reporter_user_id | INTEGER | NOT NULL, FK → users.id | must have role='citizen' |
| description_text | TEXT | NOT NULL | final text (typed or transcript, possibly edited) |
| description_source | TEXT | NOT NULL, CHECK IN ('typed','voice_transcript') | F-03 |
| voice_language_code | TEXT | NULL | Sarvam AI detected/selected language, if voice used (06_AI_SPEC.md) |
| photo_path | TEXT | NOT NULL | local filesystem path/URL (09_SECURITY.md §5) |
| photo_exif_lat | REAL | NULL | if present in EXIF |
| photo_exif_lng | REAL | NULL | |
| exif_gps_match | INTEGER | NULL | 1/0/NULL(no EXIF) — supplementary signal only (Principle 3) |
| device_gps_lat | REAL | NULL | NULL only when offline with no cached fix (Flow 2 E1) |
| device_gps_lng | REAL | NULL | |
| gps_is_approximate | INTEGER | NOT NULL DEFAULT 0 | 1 if from cached/last-known fix while offline |
| captured_at | TEXT | NOT NULL | device timestamp at capture time |
| submitted_at | TEXT | NULL | server receipt time; NULL while Pending Sync |
| ai_suggested_category | TEXT | NULL | raw AI output before citizen review (06_AI_SPEC.md) |
| ai_category_confidence | REAL | NULL | 0–1, from AI response |
| final_category | TEXT | NOT NULL, CHECK IN (fixed list) | citizen-confirmed or citizen-overridden or manual (AI failure) |
| category_source | TEXT | NOT NULL, CHECK IN ('ai_confirmed','ai_overridden','manual_fallback') | |
| sync_status | TEXT | NOT NULL DEFAULT 'submitted', CHECK IN ('pending_sync','submitted') | FR-04 |
| duplicate_link_decision | TEXT | NULL, CHECK IN ('linked_as_duplicate','new_issue','not_applicable') | outcome of F-06 |
| is_independent_corroboration | INTEGER | NOT NULL DEFAULT 1 | 0 if same reporter_user_id already has a complaint on this issue_id (Principle 7) |
| suspicious_flag | INTEGER | NOT NULL DEFAULT 0 | F-07, never shown to citizen as accusation |
| suspicious_flag_reason | TEXT | NULL | e.g. 'identical_repeat', 'burst_window' |
| created_at | TEXT | NOT NULL DEFAULT (datetime('now')) | |

Indexes: `idx_complaints_issue`, `idx_complaints_reporter`, `idx_complaints_sync_status`, `idx_complaints_reference` (unique).

**Duplicate/independent-reporter rule enforced in application code at insert time** (not a DB constraint) — see 05_API_CONTRACT.md §6.3.

### 3.6 `resolution_evidence`
Officer's fresh proof at resolution time (FR-17, FR-18, Principle 9/10). One row per resolution attempt (an Issue can have more than one attempt if reopened).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PK AUTOINCREMENT | |
| issue_id | INTEGER | NOT NULL, FK → issues.id | |
| officer_user_id | INTEGER | NOT NULL, FK → users.id | must have role='officer' |
| photo_path | TEXT | NOT NULL | fresh in-app photo, required (F-14 edge case: capture failure blocks transition) |
| officer_gps_lat | REAL | NULL | NULL if unavailable (Flow 6 E2 → forces Needs Verification) |
| officer_gps_lng | REAL | NULL | |
| captured_at | TEXT | NOT NULL | |
| distance_from_original_m | REAL | NULL | computed vs. issues.representative_lat/lng (07_MAP_GIS_SPEC.md §5) |
| verification_result | TEXT | NOT NULL, CHECK IN ('matched','needs_verification') | F-15 |
| verification_reason | TEXT | NULL | e.g. 'gps_unavailable', 'distance_exceeds_tolerance', 'within_tolerance' |
| created_at | TEXT | NOT NULL DEFAULT (datetime('now')) | |

Index: `idx_resolution_issue`.

### 3.7 `status_history`
Backs FR-10 (Live Status Tracking / timeline) and audit trail.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PK AUTOINCREMENT | |
| issue_id | INTEGER | NOT NULL, FK → issues.id | |
| from_status | TEXT | NULL | NULL for the first row (creation) |
| to_status | TEXT | NOT NULL | |
| changed_by_user_id | INTEGER | NULL, FK → users.id | NULL if system-triggered (e.g., auto-flag) |
| note | TEXT | NULL | e.g. citizen's reopen note (F-12) |
| created_at | TEXT | NOT NULL DEFAULT (datetime('now')) | |

Index: `idx_status_history_issue`.

### 3.8 `notifications` and `sms_outbox`
FR-11. Mock SMS is the MUST-HAVE default (Feature Spec Part A).

**`notifications`** — logical notification events (one per lifecycle transition per affected complaint/reporter):

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PK AUTOINCREMENT | |
| complaint_id | INTEGER | NOT NULL, FK → complaints.id | notification is always scoped to the citizen's own complaint (never issue-wide broadcast without a complaint) |
| stage | TEXT | NOT NULL, CHECK IN ('submitted','acknowledged','ongoing','resolved','reopened','closed') | |
| created_at | TEXT | NOT NULL DEFAULT (datetime('now')) | |

**`sms_outbox`** — mock SMS send log (F-11):

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PK AUTOINCREMENT | |
| notification_id | INTEGER | NOT NULL, FK → notifications.id | |
| to_phone_number | TEXT | NOT NULL | |
| message_body | TEXT | NOT NULL | rendered text, e.g. "Your report CVC-2026-000123 has been acknowledged." |
| send_status | TEXT | NOT NULL DEFAULT 'sent_mock', CHECK IN ('sent_mock','failed_simulated') | never blocks the underlying status change (Flow 3 E1) |
| created_at | TEXT | NOT NULL DEFAULT (datetime('now')) | |

Index: `idx_sms_outbox_notification`.

### 3.9 `issue_evidence_signals`
Backing detail for Evidence Confidence (F-08) — kept separate from `issues` so the recompute logic has an auditable input set.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PK AUTOINCREMENT | |
| issue_id | INTEGER | NOT NULL, FK → issues.id | |
| has_fresh_photo | INTEGER | NOT NULL DEFAULT 1 | |
| has_valid_gps | INTEGER | NOT NULL DEFAULT 1 | |
| has_valid_timestamp | INTEGER | NOT NULL DEFAULT 1 | |
| independent_corroboration_count | INTEGER | NOT NULL DEFAULT 0 | count of complaints on this issue where `is_independent_corroboration=1`, minus 1 |
| exif_gps_match_count | INTEGER | NOT NULL DEFAULT 0 | |
| computed_at | TEXT | NOT NULL DEFAULT (datetime('now')) | recomputed on every corroborating complaint (F-08 trigger) |

Index: `idx_evidence_signals_issue`.

### 3.10 `hotspots` (derived/materialized)
FR-15, F-18 — recomputed on demand, not continuously maintained (simple grid clustering, 07_MAP_GIS_SPEC.md §6).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PK AUTOINCREMENT | |
| grid_cell_id | TEXT | NOT NULL | e.g. `"13.05_80.21"` lat/lng truncated to fixed grid resolution |
| issue_count | INTEGER | NOT NULL | |
| dominant_category | TEXT | NULL | most common category in the cell |
| computed_at | TEXT | NOT NULL DEFAULT (datetime('now')) | table is truncated and rebuilt on each admin hotspot view load (acceptable for 12h prototype scale) |

---

## 4. Status Representation

Two independent status machines exist:

- **Issue lifecycle status** (`issues.status`): `submitted → acknowledged → ongoing → resolved → (closed | reopened) `, with a side-branch `needs_verification` (entered instead of `resolved` on a resolution mismatch, F-15). `reopened` issues re-enter the active officer queue and can move through `acknowledged → ongoing → resolved` again.
- **Complaint sync status** (`complaints.sync_status`): `pending_sync → submitted`, independent of the parent Issue's lifecycle (FR-04).

Exact auto-close timeout after `resolved` remains **UNDECIDED** (Open Question 34-adjacent, 02_USER_FLOWS.md Flow 5 E1) — no DB column models a timeout; `resolved` simply persists until a citizen action changes it.

---

## 5. Fixed Enumerations (Prototype Defaults)

### 5.1 `issue_category` (Feature Spec Part A, fixed demo list)
`pothole`, `garbage`, `streetlight`, `drainage`, `footpath`, `road_damage`, `water_supply`, `other`

### 5.2 `issues.status`
`submitted`, `acknowledged`, `ongoing`, `resolved`, `needs_verification`, `reopened`, `closed`

### 5.3 `evidence_confidence_band`
`high`, `needs_verification`, `low` — never rendered to citizens as a fraud label (Principle 5); officer/admin-facing only.

---

## 6. Required Demo/Seed Data (NFR-03)

For a working 12-hour demo, the following seed data is required and must be marked non-authoritative wherever surfaced in UI:

- 3–5 `departments` (Roads, Waste Management, Streetlighting, Drainage, Water Supply — demo).
- 4–6 `jurisdiction_zones` covering a small, deliberately chosen area of Chennai (e.g., a few adjoining wards) with hand-authored `boundary_geojson` (see 07_MAP_GIS_SPEC.md §2 for exact demo coordinates).
- 2–3 `users` with role='officer', one per major zone/department pairing, plus 1 role='admin'.
- 3–5 seed `users` with role='citizen' for demo submissions.
- At least one deliberately duplicate pair of complaints (same small area, same category) to demonstrate F-06.
- At least one deliberately mismatched resolution (officer GPS far from original) to demonstrate F-15/Needs Verification.
- At least 3 issues clustered in one grid cell to demonstrate F-18 hotspot surfacing.

---

## 7. Consistency Cross-Check

- Every FR in 01_REQUIREMENTS.md maps to at least one table/column above (FR-01→complaints, FR-04→sync_status, FR-05→ai_suggested_category, FR-06→jurisdiction_zone_id/department_id, FR-07→duplicate_link_decision, FR-08→suspicious_flag, FR-09→priority_score, FR-10→status_history, FR-11→notifications/sms_outbox, FR-12→status transitions, FR-13/14→departments+aggregation, FR-15→hotspots, FR-17/18→resolution_evidence, FR-19→issues view excludes reporter identity by design (see 05_API_CONTRACT.md §7), FR-20→issues/complaints split).
- No table stores technical architecture excluded by scope (no schema for government integrations, no auth-provider-specific tables — NFR-08 kept open per 09_SECURITY.md).
