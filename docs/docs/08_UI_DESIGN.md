# 08_UI_DESIGN.md

> Defines every citizen/officer/admin screen and navigation between them, consistent with 02_USER_FLOWS.md and 03_FEATURE_SPEC.md. No technical/architecture detail (component libraries, code) included — that belongs to separate documents.

---

## 1. Navigation Map (Overview)

```
[Role Entry] 
   ├── Citizen App
   │     ├── Home
   │     ├── Report Issue (camera → details → category → review → submit)
   │     ├── My Reports (list → detail/status/timeline → confirm/reopen)
   │     ├── Nearby Issues (map/list)
   │     └── (Pending Sync indicator, global)
   │
   ├── Officer App
   │     ├── Dashboard (list + map/heatmap)
   │     ├── Issue Detail (evidence, linked complaints, priority breakdown)
   │     │     └── Resolution Capture (camera → submit → verification result)
   │     └── (Jurisdiction scope, global)
   │
   └── Admin App
         ├── City Dashboard (all departments, backlog, response time)
         ├── Department Detail
         ├── Hotspot Map
         └── SMS Outbox (mock notification log, prototype-only)
```

Authentication/login screen exists conceptually to select role, but its mechanism is **UNDECIDED** (out of scope here — see Requirements NFR-08).

---

## 2. Citizen Screens

### C-1 Home
- **Purpose:** Entry point after login/role selection.
- **Elements:** Big primary action "Report Issue"; secondary links to "My Reports" and "Nearby Issues"; offline indicator if applicable.
- **Navigates to:** C-2, C-4, C-5.

### C-2 Report Issue — Capture
- **Purpose:** F-01 camera-first capture.
- **Elements:** Full-screen in-app camera viewfinder, capture button; no gallery-upload option (Principle 1).
- **Behavior:** On capture, auto-attaches GPS + timestamp (shown as a small confirmation chip, e.g., "Location captured").
- **Navigates to:** C-3.

### C-3 Report Issue — Description
- **Purpose:** F-01/F-03 description input.
- **Elements:** Text field, microphone button (voice input), photo thumbnail preview, "Next" button.
- **Behavior:** Tapping mic starts recording; on stop, shows transcript in the text field, editable.
- **Edge case UI:** If transcription fails, an inline note ("Couldn't transcribe — please type") appears; text field remains usable.
- **Navigates to:** C-4.

### C-4 Report Issue — Category Confirmation
- **Purpose:** F-04 AI categorisation review.
- **Elements:** Suggested category shown large with a "Change category" option opening a short fixed list (pothole, garbage, streetlight, drainage, footpath, road damage, water supply, other).
- **Edge case UI:** If AI suggestion unavailable, screen opens directly to the manual list, pre-nothing-selected.
- **Navigates to:** C-5 (possible-duplicate interstitial) or C-6.

### C-5 Possible Duplicate Check (conditional)
- **Purpose:** F-06 duplicate confirmation.
- **Elements:** Card showing the matched existing Issue (category, small map thumbnail, aggregate report count — no personal info), two buttons: "Yes, same issue" / "No, this is different."
- **Navigates to:** C-6 (submission confirmation, either linked or new).

### C-6 Submission Confirmation
- **Purpose:** Close the loop on F-01/F-02.
- **Elements:** Reference ID, initial status "Submitted," "View My Reports" button.
- **Navigates to:** C-7 (My Reports).

### C-7 My Reports (List)
- **Purpose:** F-10 status visibility entry point.
- **Elements:** List of the citizen's complaints with category icon, short status chip (Submitted/Acknowledged/Ongoing/Resolved/Closed/Reopened/Needs Verification), date. Pending-Sync items visually marked distinctly (F-02).
- **Navigates to:** C-8.

### C-8 Report Detail / Timeline
- **Purpose:** F-10 timeline + F-12 confirm/reopen.
- **Elements:** Photo, category, location (small map), status timeline (vertical stepper), and — only when status = Resolved — "Confirm Resolved" / "Reopen" buttons with optional note field for Reopen.
- **Navigates to:** back to C-7; Reopen submission returns to C-8 with updated status.

### C-9 Nearby Issues (Map/List Toggle)
- **Purpose:** F-16 community view.
- **Elements:** Leaflet/OSM map with pins for unresolved Issues (color by priority band), toggle to list view; tapping a pin/row shows an aggregate popup (category, report count, status) — never a reporter identity.
- **Navigates to:** back to C-1.

---

## 3. Officer Screens

### O-1 Dashboard
- **Purpose:** F-13 jurisdiction-scoped operating view.
- **Elements:** Toggle between List and Map/Heatmap; list sorted by priority score (highest first) by default; each row shows category, status chip, priority indicator, age.
- **Navigates to:** O-2.

### O-2 Issue Detail
- **Purpose:** F-14 workflow actions + evidence review.
- **Elements:** Photo(s), location map, all linked complaints (aggregated, count shown), priority score with factor breakdown, Evidence Confidence indicator, action buttons appropriate to current status: "Acknowledge" → "Start Work" → "Mark Resolved."
- **Navigates to:** O-3 (on "Mark Resolved").

### O-3 Resolution Capture
- **Purpose:** F-14/F-15 resolution evidence + verification.
- **Elements:** In-app camera for fresh photo, auto-captured GPS/timestamp chip, "Submit Resolution" button.
- **Behavior:** On submit, shows verification result inline: "Resolved — Verified" (success) or "Sent for Verification — location mismatch detected" (F-15 mismatch path), returning to O-2 with updated status.
- **Edge case UI:** If GPS unavailable, submit button is disabled with an inline message explaining GPS is required to submit resolution evidence.

---

## 4. Admin Screens

### A-1 City Dashboard
- **Purpose:** F-17 department tracking overview.
- **Elements:** Cards per department: open count, backlog count, avg. response time; overall city map of all open Issues.
- **Navigates to:** A-2, A-3.

### A-2 Department Detail
- **Purpose:** F-17 drill-down.
- **Elements:** Department's Issue queue (list), same metrics as A-1 scoped to one department.
- **Navigates to:** O-2-equivalent read view (admin can view but exact edit permissions are UNDECIDED, per Requirements NFR — treat as view-only in this prototype).

### A-3 Hotspot Map
- **Purpose:** F-18 recurring-location surfacing.
- **Elements:** Map with clustered/highlighted areas of concentrated Issues; simple legend (e.g., low/medium/high concentration).
- **Navigates to:** back to A-1.

### A-4 SMS Outbox (prototype-only diagnostic view)
- **Purpose:** Make F-11's mock SMS notifications visible/demonstrable, since no real phone is used in the demo.
- **Elements:** Chronological log of simulated SMS messages: recipient (demo identifier), stage, timestamp, linked complaint reference.
- **Navigates to:** back to A-1.

---

## 5. Cross-Cutting UI Rules

- **Non-accusatory language:** Any suspicious/mismatch state is worded neutrally (e.g., "Needs Verification," never "Fraud Suspected" or "Fake Report") — enforces NFR-05.
- **Non-authoritative data disclosure:** Any map screen using the Chennai jurisdiction demo data displays a small persistent label: "Demo jurisdiction data — not official" — enforces NFR-03.
- **Accessibility-first reporting:** C-2/C-3/C-4 (the report flow) use large touch targets, icon+text labels, and voice input as a first-class option, minimizing typing — enforces FR-16/NFR-09.
- **Privacy:** No citizen-facing screen (C-9 in particular) ever displays another citizen's name, phone number, or account identifier.

---

## 6. Screens Explicitly Not Designed Here

- Login/authentication screen content (mechanism UNDECIDED).
- Any screen for government/utility integration (Out of Scope, Feature Spec Part C).
- Any admin permission-management screen (permission model UNDECIDED).
