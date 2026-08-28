# 01_REQUIREMENTS.md

> Source of truth: MASTER_CONTEXT.md. Status labels (`FINAL/AGREED`, `REQUIRED`, `PROPOSED`, `OPTIONAL`, `REJECTED`, `UNDECIDED`) are preserved from that document. This document converts the official Problem Statement and team decisions into functional (FR) and non-functional (NFR) requirements. It does **not** invent features beyond MASTER_CONTEXT.

---

## 1. Scope Statement

**STATUS: FINAL/AGREED**

12-hour hackathon prototype for **PS-5: Crowd Sourced Civic Issue Reporting and Resolution**, demonstrated locally, scoped to Chennai, using team-provided (non-authoritative) jurisdiction demo data. No deployment. No production government integration (**UNDECIDED / NOT ESTABLISHED**).

Goal: demonstrate the core end-to-end workflow **Report → Categorise → Route → Prioritise → Resolve → Verify → Confirm**.

---

## 2. Functional Requirements

Each FR traces to an official REQ (Section 2 of MASTER_CONTEXT) or an explicit `FINAL/AGREED` decision. Traceability is shown in brackets.

### FR-01 — Citizen Issue Reporting
**STATUS: REQUIRED** [REQ-01, DEC-01–DEC-04]
Citizen can submit a report containing:
- an in-app camera photo
- device GPS location + timestamp (captured automatically at submission)
- a short text description
Photo EXIF location, when present, is cross-checked against device GPS as supplementary evidence (missing EXIF does not invalidate the report) [Principle 3].

### FR-02 — Multi-Platform Access
**STATUS: REQUIRED** [REQ-02]
Reports can be submitted from both a mobile-formatted web client and a desktop web client (single responsive web app; no native app build required in 12 hours — this is an **implementation note, not a scope reduction of REQ-02**).

### FR-03 — Local Language Input
**STATUS: REQUIRED** [REQ-03, DEC-05, DEC-06]
Citizen can provide a description via voice input in a local language; Sarvam AI performs multilingual voice-to-text. Exact languages demoed = **UNDECIDED** (Open Question 39).

### FR-04 — Offline Capture and Sync
**STATUS: REQUIRED** [REQ-04, DEC-25]
Citizen can capture a report (photo, GPS, timestamp, text) without connectivity; it is stored on-device and submitted automatically when connectivity returns.

### FR-05 — Automatic Categorisation
**STATUS: REQUIRED** [REQ-05, DEC-07]
System proposes an issue category from photo + text using AI. Citizen can review/override the category before final submission (Open Question 7 — override is assumed permitted per Principle that Evidence Confidence/AI is not final-say; treat exact override policy as **UNDECIDED** if not implemented in prototype).
Final category list = **PROPOSED-06, unresolved** — to be finalized in Feature Spec (Section 4 of this doc) for prototype purposes only.

### FR-06 — Jurisdiction Determination & Routing
**STATUS: REQUIRED** [REQ-06, DEC-08, Principle 4]
System derives jurisdiction/department automatically from report location + category; citizen never manually selects administrative type. Uses team-provided Chennai demo data [DEC-09] (not authoritative — R-12).

### FR-07 — Duplicate Detection & Merge
**STATUS: REQUIRED** [REQ-07, DEC-11, DEC-12, Principle 8]
System detects candidate duplicate reports of the same real-world Issue (via location + category proximity, exact thresholds **UNDECIDED** — PROPOSED-05) and links them to one Issue without deleting any citizen's individual complaint record.

### FR-08 — Spam / Suspicious Filtering
**STATUS: REQUIRED** [REQ-08, Principle 5, R-05]
System flags suspicious submissions (e.g., identical repeated submissions, excessive submissions in a short window) for review. It must **not** automatically brand a citizen/report as fraudulent — flags route to manual/officer review. Exact detection rules = **PROPOSED-07, undecided**.

### FR-09 — Prioritisation (Risk/Priority Score)
**STATUS: REQUIRED** [REQ-09, DEC-16, DEC-17, Principle 12]
System computes a rule-based (non-AI-discretionary) priority score per Issue from multiple factors: severity, public exposure, vulnerable-population impact, critical-infrastructure impact, duration, community corroboration, recurrence, evidence confidence. Exact weights = **PROPOSED-04, undecided**.

### FR-10 — Live Status Tracking
**STATUS: REQUIRED** [REQ-10]
Citizen can view current status of their own complaint at any time, from submission through resolution.

### FR-11 — Stage Notifications (SMS)
**STATUS: REQUIRED** [REQ-11, DEC-23]
Citizen receives an SMS at each lifecycle stage: submitted, acknowledged, ongoing, resolved, reopened. SMS provider = **UNDECIDED** (DEC-24); mock/fallback SMS = **PROPOSED-12, undecided** — to be resolved in Feature Spec as a prototype implementation choice, not a scope change.

### FR-12 — Citizen Confirm / Reopen
**STATUS: REQUIRED** [REQ-12, DEC-22, Principle 11]
After an Issue is marked Resolved, the reporting citizen(s) can either confirm resolution (closing it) or reopen it.

### FR-13 — Officer/Staff Dashboard & Map
**STATUS: REQUIRED** [REQ-13, DEC-18, DEC-19]
Officers see a jurisdiction-scoped dashboard listing open Issues with status, priority, and evidence, plus a map/heatmap view. Exact heatmap calculation = **PROPOSED-09, undecided**.

### FR-14 — Department Performance Tracking
**STATUS: REQUIRED** [REQ-14]
System tracks, at minimum, department response time and pending backlog count. Additional metrics (ack time, resolution time, reopen rate, etc.) are **PROPOSED-10, optional** for the prototype.

### FR-15 — Recurring Hotspot Surfacing
**STATUS: REQUIRED** [REQ-15, PROPOSED-11]
System surfaces locations with recurring/concentrated issues for planning purposes. Exact recurrence algorithm = **undecided**; prototype-level definition to be fixed in Feature Spec.

### FR-16 — Accessibility for Limited Digital Familiarity
**STATUS: REQUIRED** [REQ-16]
Reporting flow must be usable with minimal steps, simple visual language, and voice-input support, favoring the simplest interaction path (camera-first, minimal typing).

### FR-17 — Officer Resolution Workflow
**STATUS: REQUIRED** [DEC-20, DEC-21, Principle 9]
Officer acknowledges an Issue, updates status, and — to mark it Resolved — must capture a fresh photo with fresh GPS + timestamp through the app.

### FR-18 — Resolution Cross-Verification
**STATUS: REQUIRED** [DEC-21, Principle 10, PROPOSED-08]
System compares officer resolution evidence (location/time/photo) against the original complaint. A mismatch produces a "Needs Verification" state rather than an automatic fraud accusation. Exact algorithm/thresholds = **UNDECIDED** (Open Questions 30–33).

### FR-19 — Community Issue View
**STATUS: REQUIRED** [DEC-13, DEC-14]
Citizens can view nearby unresolved Issues (aggregated, not individual complainants) without exposing any other citizen's personal information.

### FR-20 — Complaint vs. Issue Data Model Behavior
**STATUS: REQUIRED** [DEC-11, Section 7]
System must behave according to the Complaint (individual submission) vs. Issue (real-world problem) distinction throughout all flows described above.

---

## 3. Non-Functional Requirements

### NFR-01 — Time-Boxed Delivery
**STATUS: FINAL/AGREED** [C-01, DEC-29, R-14]
The prototype must be achievable within ~12 hours; feature selection must protect the core end-to-end demo path over completeness.

### NFR-02 — Local-Only Operation
**STATUS: FINAL/AGREED** [C-02, C-03, DEC-26, DEC-27]
Runs locally; no deployment or hosting required.

### NFR-03 — Prototype Data Honesty
**STATUS: FINAL/AGREED** [C-05, DEC-09, R-12]
Chennai jurisdiction data is team-authored demo data and must be visibly labeled as non-authoritative wherever shown (UI and docs).

### NFR-04 — Deterministic Risk Scoring
**STATUS: FINAL/AGREED** [DEC-16]
Priority/Risk scoring must be rule-based and reproducible — not left to free-form AI judgment.

### NFR-05 — Non-Accusatory Evidence Handling
**STATUS: FINAL/AGREED** [Principle 5, Principle 10]
No automated feature may declare a citizen or officer fraudulent; all mismatch/suspicion outcomes route to a review state.

### NFR-06 — Privacy of Community Data
**STATUS: FINAL/AGREED** [DEC-14, R-11]
Community/nearby-issue views must never expose reporter identity or personal data.

### NFR-07 — Tech Stack Constraints (as discussed, not mandatory beyond database/map)
**STATUS: FINAL/AGREED for DB & Map; PROPOSED for rest**
SQLite (DB) and Leaflet + OpenStreetMap (map) are locked. Frontend/backend framework choices (React+Vite, Tailwind, Node+Express, Dexie/IndexedDB, Gemini) remain **PROPOSED** — implementation detail, out of scope for this document set.

### NFR-08 — Authentication
**STATUS: UNDECIDED** [C-09, UNDECIDED-01]
No authentication method is finalized. Documents in this set assume role separation (citizen/officer/admin) exists but do not prescribe a mechanism (deferred to architecture/security docs, explicitly out of scope here).

### NFR-09 — Usability Baseline
**STATUS: REQUIRED** [REQ-16]
Core reporting flow must be completable in a small number of steps without requiring reading dense text, to remain usable by citizens with limited digital familiarity.

---

## 4. Explicitly Out of Scope for This Document Set

**STATUS: FINAL/AGREED (per task instructions)**
The following are deliberately **not** covered in these six documents (produced separately):
- Technical architecture
- Database schema
- API contracts
- AI implementation details (prompts, model configs)
- GIS implementation details (exact geospatial algorithms)
- Security architecture

---

## 5. Requirement Traceability Cross-Check

| Official REQ | Covered By | Demonstrable in 12h Prototype? |
|---|---|---|
| REQ-01 Report an issue | FR-01 | Yes |
| REQ-02 Mobile and web | FR-02 | Yes (responsive web only) |
| REQ-03 Local languages | FR-03 | Partial — depends on Sarvam AI integration succeeding within time budget; see Definition of Done |
| REQ-04 Offline reporting | FR-04 | Partial — basic local-store-and-sync only; full offline PWA robustness is a risk |
| REQ-05 Auto categorisation | FR-05 | Yes, with fallback to manual category if AI call fails/slow |
| REQ-06 Department routing | FR-06 | Yes, using demo jurisdiction data |
| REQ-07 Duplicate detection | FR-07 | Yes, simplified radius+category rule |
| REQ-08 Spam/false filtering | FR-08 | Partial — basic heuristic flag only, not full ML detection |
| REQ-09 Prioritisation | FR-09 | Yes, simplified weighted rule |
| REQ-10 Live status | FR-10 | Yes |
| REQ-11 Stage notifications | FR-11 | Partial — real SMS depends on provider decision; mock fallback likely needed |
| REQ-12 Confirm/reopen | FR-12 | Yes |
| REQ-13 Staff map/dashboard | FR-13 | Yes, simplified |
| REQ-14 Response/backlog tracking | FR-14 | Yes, basic metrics only |
| REQ-15 Recurring locations | FR-15 | Partial — simple clustering only |
| REQ-16 Limited digital familiarity | FR-16 | Yes, by design constraint |

See `11_DEFINITION_OF_DONE.md` for the final risk-flagged list of requirements that may not be fully demonstrable, and `03_FEATURE_SPEC.md` for MUST/SHOULD/OPTIONAL/OUT-OF-SCOPE feature cuts that make these "Partial" items demo-safe.
