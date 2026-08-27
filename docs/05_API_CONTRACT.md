# 05_API_CONTRACT.md

> Implements: 02_USER_FLOWS.md (every numbered step maps to an endpoint below), 03_FEATURE_SPEC.md (F-01–F-18).
> Depends on: 04_DATABASE.md (all request/response fields trace to columns there), 06_AI_SPEC.md (categorisation/voice endpoints proxy to AI spec's interfaces), 07_MAP_GIS_SPEC.md (jurisdiction/duplicate/nearby/heatmap logic), 09_SECURITY.md (auth assumptions, upload handling).
> Style: REST over JSON, Node.js + Express (PROPOSED, not upgraded to FINAL here — see 04_DATABASE.md NFR-07; used only because it's the discussed default and nothing simpler was proposed). Base path: `/api/v1`.

---

## 1. Authentication Assumption (NFR-08, UNDECIDED)

No authentication mechanism is finalized. For this prototype:
- Every request carries a header `X-Demo-User-Id` (or an equivalent seeded session token) identifying which seed `users` row is acting. **This is a prototype convenience, not a security mechanism** — see 09_SECURITY.md §1 for explicit limitations and what a real deployment would need instead.
- Endpoints below note the expected `role` for the acting user; the API layer checks `role` against the DB row for `X-Demo-User-Id`, returning `403` on mismatch. This satisfies "role separation exists" (NFR-08) without prescribing a login mechanism.

---

## 2. Conventions

- All success responses: `{ "data": {...} }`. All errors: `{ "error": { "code": "STRING_CODE", "message": "human readable" } }`, HTTP status matches the code's category (400 validation, 403 authorization, 404 not found, 409 conflict, 422 domain rule, 500 server).
- Timestamps: ISO8601 UTC strings.
- File uploads (photos, audio): `multipart/form-data`. Max photo size 8MB; accepted types `image/jpeg`, `image/png`. Max audio clip length 60s (see 06_AI_SPEC.md §3 for rationale).
- Pagination: `?page=1&pageSize=20` on list endpoints; response includes `meta: { page, pageSize, total }`.

---

## 3. Citizen Endpoints

### 3.1 `POST /complaints` — Submit a Report (Flow 1, F-01)
**Role:** citizen.
**Content-Type:** `multipart/form-data`.

**Request fields:**
| Field | Type | Required | Notes |
|---|---|---|---|
| photo | file | Yes | in-app camera capture only; client enforces no-gallery-upload (Principle 1) — API cannot verify this, trusts client |
| device_gps_lat / device_gps_lng | float | Conditionally | required unless `is_offline_capture=true` with no cached fix (see E1 below) |
| gps_is_approximate | boolean | No, default false | set true for cached/last-known offline fix (Flow 2 E1) |
| captured_at | ISO8601 string | Yes | device timestamp |
| description_text | string | Conditionally | required if no `voice_audio` provided |
| voice_audio | file | Conditionally | if provided, server calls 06_AI_SPEC.md §3 (Sarvam) to produce transcript first |
| photo_exif_lat / photo_exif_lng | float | No | if client extracted EXIF |
| is_offline_capture | boolean | No, default false | marks that this was captured offline and is now syncing (F-02) |

**Behavior:**
1. Validate photo present; if `device_gps_lat/lng` missing and `is_offline_capture=false` → `400 GPS_REQUIRED` (Flow 1 E1).
2. If `is_offline_capture=true` and no GPS at all → accept with `gps_is_approximate=true` and a `location_needs_correction=true` flag in the response (Flow 2 E1).
3. If `voice_audio` present → call AI voice-to-text (06_AI_SPEC.md §3); on failure, respond `422 VOICE_TRANSCRIPTION_FAILED` **only if** `description_text` is also absent — otherwise proceed with `description_text` and log a soft warning (Flow 1 E3 / F-03 edge case: never block).
4. Call AI categorisation (06_AI_SPEC.md §2) with photo + description. On failure/timeout (>5s) → `ai_suggested_category=null`, response includes `category_source_required=manual` so client shows the manual picker (Flow 1 E4 / F-04 edge case).
5. Run duplicate check (07_MAP_GIS_SPEC.md §5) against open Issues near `device_gps_lat/lng` (or EXIF location if GPS missing entirely).
   - If AI-confirmed category and location both present, and a candidate match exists → do **not** auto-link; return `duplicate_candidate` in the response for client-side confirm/deny (Flow 1 E5). Complaint is created in a `pending_duplicate_decision` sub-state (tracked client-side + `duplicate_link_decision=NULL` until `/complaints/{id}/duplicate-decision` is called).
   - If no candidate → create a new `issues` row immediately.
6. Run jurisdiction lookup (07_MAP_GIS_SPEC.md §4). No match → `issues.needs_manual_routing=1`, still create the record (Flow 1 E6, never dropped).
7. Run suspicious-submission heuristic (F-07, §6.2 below) — tags silently, never blocks.
8. Insert `complaints` row, `status_history` row (`NULL → submitted`), `notifications` row (`stage=submitted`), `sms_outbox` mock row.

**Response `201`:**
```json
{
  "data": {
    "complaint_id": 123,
    "reference_id": "CVC-2026-000123",
    "issue_id": 456,
    "status": "submitted",
    "final_category": "pothole",
    "category_source": "ai_confirmed",
    "duplicate_candidate": null,
    "needs_manual_routing": false,
    "gps_is_approximate": false
  }
}
```
If a duplicate candidate exists, `duplicate_candidate` is populated:
```json
"duplicate_candidate": {
  "issue_id": 789,
  "distance_m": 42,
  "category": "pothole",
  "existing_complaint_count": 2
}
```

**Errors:** `400 CAMERA_PHOTO_REQUIRED`, `400 GPS_REQUIRED`, `400 DESCRIPTION_REQUIRED` (neither text nor usable voice).

---

### 3.2 `POST /complaints/{id}/category-override` (F-04, Flow 1 step 9 / E4)
**Role:** citizen (must own the complaint).
Body: `{ "final_category": "drainage" }`. Sets `category_source=ai_overridden` or `manual_fallback` (if AI had failed). Re-runs jurisdiction lookup if department mapping depends on category (07_MAP_GIS_SPEC.md §4).

### 3.3 `POST /complaints/{id}/duplicate-decision` (F-06, Flow 1 E5)
**Role:** citizen (must own the complaint).
Body: `{ "decision": "same_issue" | "different_issue" }`.
- `same_issue` → complaint's `issue_id` reassigned to the candidate Issue; `duplicate_link_decision=linked_as_duplicate`; recompute `is_independent_corroboration` and trigger Evidence Confidence recompute (F-08) and Priority Score recompute (F-09).
- `different_issue` → new `issues` row created for this complaint; `duplicate_link_decision=new_issue`.

### 3.4 `GET /complaints/mine` (Flow 3, FR-10)
**Role:** citizen. Returns the citizen's own complaints with current Issue status + `status_history` timeline. Empty list → client renders empty state (Flow 3 E2).

### 3.5 `GET /complaints/{id}` (Flow 3)
**Role:** citizen (owner) or officer/admin (jurisdiction-scoped). Returns full detail including resolution evidence summary when present (never another citizen's personal data — enforced by scoping to `reporter_user_id = caller` for citizens).

### 3.6 `POST /complaints/sync-batch` (F-02, Flow 2)
**Role:** citizen. Body: array of locally-queued reports (same shape as §3.1, batched). Used when connectivity returns after offline capture. Each item processed through the same pipeline as §3.1; response is an array of per-item results (success or `409 SYNC_ITEM_FAILED` with reason, never silently dropped — client retains failed items for retry per Flow 2 E3).

### 3.7 `GET /issues/nearby` (F-16, Flow 4)
**Role:** citizen. Query: `?lat=&lng=&radius_m=` (default radius per 07_MAP_GIS_SPEC.md §7). Returns aggregated unresolved Issues only — **response schema explicitly excludes any reporter/complaint-level personal field** (NFR-06):
```json
{ "data": [ { "issue_id": 456, "category": "pothole", "status": "acknowledged",
              "priority_band": "high", "lat": 13.05, "lng": 80.21, "complaint_count": 3 } ] }
```
No location permission → client omits `lat/lng`, server defaults to Chennai demo-area center (Flow 4 E2).

### 3.8 `POST /issues/{id}/confirm-resolution` (F-12, Flow 5)
**Role:** citizen (must be linked reporter on this Issue). Body: `{}`. Requires `issues.status=resolved`. Sets `status=closed`, `closed_at=now`, `status_history` row, `notifications`+mock SMS (`stage=closed`).

### 3.9 `POST /issues/{id}/reopen` (F-12, Flow 5)
**Role:** citizen (must be linked reporter). Body: `{ "note": "optional text" }`. Requires `issues.status=resolved`. Sets `status=reopened`, re-enters officer active queue, `status_history` row, notification (`stage=reopened`). If another linked citizen already confirmed, reopen still takes precedence (F-12 edge case, ASSUMED default) — endpoint always succeeds regardless of prior confirm state as long as current status is still `resolved` or `closed` within the same review window; if already `closed` by another reporter, reopening moves it back to `reopened` per the documented default rule.

---

## 4. Officer Endpoints

### 4.1 `GET /officer/dashboard` (F-13, Flow 6)
**Role:** officer. Returns Issues scoped to `users.jurisdiction_zone_id`/`department_id`, sorted by `priority_score` desc. Includes list + map-ready `{lat,lng,category,status,priority_band}` array for Leaflet rendering (07_MAP_GIS_SPEC.md §8). Empty jurisdiction → empty array, not an error.

### 4.2 `GET /officer/issues/{id}` (Flow 6 step 2)
**Role:** officer (must match issue's department/zone, else `403`). Returns full evidence: linked complaints (photo/GPS/timestamp per complaint), priority breakdown, evidence confidence band.

### 4.3 `POST /officer/issues/{id}/acknowledge` (Flow 6 step 3, F-14)
**Role:** officer. Requires current `status=submitted` or `reopened`. → `status=acknowledged`, `status_history`, notification+SMS to all linked complaints' reporters (`stage=acknowledged`).

### 4.4 `POST /officer/issues/{id}/start-work` (Flow 6 step 4, F-14)
**Role:** officer. Requires `status=acknowledged`. → `status=ongoing`, notification+SMS (`stage=ongoing`).

### 4.5 `POST /officer/issues/{id}/resolve` (Flow 6 steps 5–7, F-14, F-15, F-17, F-18)
**Role:** officer. Requires `status=ongoing`. `multipart/form-data`: `photo` (required — capture failure client-side blocks the call entirely, Flow 6 E1), `officer_gps_lat`/`officer_gps_lng` (optional — absence handled below), `captured_at`.

**Behavior:**
1. If `officer_gps_lat/lng` missing → create `resolution_evidence` with `verification_result=needs_verification`, `verification_reason=gps_unavailable`; `issues.status=needs_verification` (Flow 6 E2, conservative default).
2. Else compute distance to `issues.representative_lat/lng` (07_MAP_GIS_SPEC.md §5 tolerance rule). Within tolerance → `verification_result=matched`, `status=resolved`, `resolved_at=now`, notify all reporters (`stage=resolved`) → they enter Flow 5. Outside tolerance → `verification_result=needs_verification`, `verification_reason=distance_exceeds_tolerance`, `status=needs_verification`, admin-visible flag, officer sees non-accusatory message (NFR-05).
3. On success, trigger hotspot recompute is **not** synchronous (see §6.4) — hotspots are recomputed on-demand at `GET /admin/hotspots`.

**Errors:** `400 PHOTO_REQUIRED`, `409 INVALID_STATUS_TRANSITION` (e.g., resolving a `submitted` issue).

### 4.6 `POST /officer/issues/{id}/reassign-block-check` (Flow 6 E3)
**Role:** officer. Any resolve/acknowledge/start-work call on an Issue outside the officer's `jurisdiction_zone_id`/`department_id` returns `403 OUTSIDE_JURISDICTION` directly from §4.3–4.5 (no separate endpoint needed — noted here for traceability). Reassignment mechanism itself is **UNDECIDED**, out of scope beyond this block (02_USER_FLOWS.md Flow 6 E3).

---

## 5. Admin Endpoints

### 5.1 `GET /admin/dashboard` (Flow 7, FR-13/14)
**Role:** admin. City-wide (not zone-scoped) Issue list + per-department backlog count + average response time (F-17). `no data` rendered when no resolved Issues exist yet.

### 5.2 `GET /admin/hotspots` (F-18, Flow 7)
**Role:** admin. Triggers on-demand recompute of `hotspots` table (07_MAP_GIS_SPEC.md §6) and returns grid cells with `issue_count ≥ 3` (demo threshold, PROPOSED-11 simplified per Feature Spec).

### 5.3 `GET /admin/issues/{id}/flags` (F-07, F-15)
**Role:** admin. Returns suspicious-flag and needs-verification Issues for manual review (NFR-05 — review queue, never an automatic accusation surface).

### 5.4 `GET /admin/sms-outbox` (F-11)
**Role:** admin. Lists `sms_outbox` rows for demo purposes ("SMS Outbox" view per Feature Spec F-11).

---

## 6. Cross-Cutting Rules

### 6.1 Status Transition Validation
Enforced centrally (not per-endpoint duplication): a transition table mirrors 04_DATABASE.md §4. Any endpoint attempting a transition not in the table returns `409 INVALID_STATUS_TRANSITION`.

Allowed: `submitted→acknowledged`, `acknowledged→ongoing`, `ongoing→resolved`, `ongoing→needs_verification`, `resolved→closed`, `resolved→reopened`, `closed→reopened`, `reopened→acknowledged`, `needs_verification→acknowledged` (admin manually clears back into queue — mechanism for admin override is basic and OPTIONAL if time allows; MUST-HAVE minimum is that `needs_verification` is visibly queued for admin, per F-15).

### 6.2 Suspicious Submission Heuristic (F-07)
Applied inside `POST /complaints` before insert: if the same `reporter_user_id` has ≥3 complaints with identical `photo` hash OR ≥5 complaints within a 10-minute window, set `suspicious_flag=1`. Never returned to the citizen in the response (NFR-05); visible only via `GET /admin/issues/{id}/flags`.

### 6.3 Independent Corroboration Rule (Principle 7)
At complaint-to-Issue linking time (§3.1 step 5, §3.3), `is_independent_corroboration` is set to `0` if `reporter_user_id` already has any other complaint on the same `issue_id`; otherwise `1`. This value feeds `issue_evidence_signals.independent_corroboration_count` (F-08).

### 6.4 Recomputation Triggers
- Evidence Confidence (F-08): recomputed synchronously whenever a complaint is newly linked to an Issue (new corroboration).
- Priority Score (F-09): recomputed synchronously whenever Evidence Confidence changes, or an Issue is reopened (per Feature Spec F-09 trigger list).
- Hotspots (F-18): recomputed lazily, only on `GET /admin/hotspots` — not on every write, to stay within the 12h build budget.

---

## 7. Privacy Enforcement in Responses (NFR-06)

`GET /issues/nearby` (§3.7) and any other citizen-facing aggregate endpoint must never include: `reporter_user_id`, `reporter` name/phone, individual `complaints` rows, or `photo_path` values tied to a specific citizen. Only officer/admin-scoped endpoints (§4.2, §5.x) may include complaint-level personal data, and only within the officer's own jurisdiction.

---

## 8. Consistency Cross-Check

- Every endpoint traces to a Flow step in 02_USER_FLOWS.md (cited inline above).
- Every FR-required behavior (01_REQUIREMENTS.md) has a corresponding endpoint or cross-cutting rule.
- Every request/response field traces to a 04_DATABASE.md column; no endpoint invents untracked data.
- AI-touching endpoints (§3.1 steps 3–4) call into 06_AI_SPEC.md's defined interfaces only.
- Geo-touching endpoints (§3.1 step 5–6, §3.7, §4.5, §5.2) call into 07_MAP_GIS_SPEC.md's defined logic only.
- Auth model matches 09_SECURITY.md's stated prototype limitations — no endpoint here assumes a real login system exists.
