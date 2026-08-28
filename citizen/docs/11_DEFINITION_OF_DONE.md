# 11_DEFINITION_OF_DONE.md

> Source of truth: MASTER_CONTEXT.md. This checklist defines what "done" means for the 12-hour prototype (C-01, DEC-29). It preserves MASTER_CONTEXT's status distinctions — items marked FINAL/AGREED or REQUIRED are treated as MUST HAVE candidates; PROPOSED items are SHOULD HAVE/OPTIONAL depending on feasibility; REJECTED and out-of-scope items are excluded entirely. Where MASTER_CONTEXT is UNDECIDED, this document does not resolve the decision — it only states what minimal, demo-safe behavior is needed for the prototype to be presentable.

---

## 1. How to Read This Document

- **MUST HAVE** — without this, the core end-to-end story (10_DEMO_SCENARIO.md) cannot be shown. Protect these first.
- **SHOULD HAVE** — strengthens the demo and reflects agreed principles, but the demo survives without it.
- **OPTIONAL** — nice if time remains; explicitly not worth trading MUST HAVE time for.
- **OUT OF SCOPE** — not attempted in this 12-hour prototype, per MASTER_CONTEXT (production government integration, nationwide jurisdiction coverage, advanced AI verification, etc.).

---

## 2. Core End-to-End Workflow

**MUST HAVE**
- [ ] A citizen can submit a Complaint with photo, location, and short description (REQ-01, DEC-01, DEC-02, DEC-04).
- [ ] The Complaint is automatically categorised (REQ-05, DEC-07) — even if via a simple/fallback classifier if the primary AI service fails.
- [ ] The Complaint is automatically routed to a department based on location using the team's demo jurisdiction data (REQ-06, DEC-08, DEC-09).
- [ ] The Complaint receives a Risk/Priority ranking distinct from raw report count (REQ-09, DEC-16, DEC-17, Principle 12).
- [ ] An officer can view the routed Issue, acknowledge it, and mark it resolved with fresh photo/location/timestamp evidence (REQ-13 partial, DEC-18, DEC-20, Principle 9).
- [ ] Resolution evidence is cross-checked against the original complaint in some form, even a simplified rule (DEC-21, Principle 10).
- [ ] The citizen can see the Resolved status and confirm or reopen it (REQ-12, DEC-22, Principle 11).
- [ ] Status is visible to the citizen from submission through resolution (REQ-10, Section 7 Status concept).

**SHOULD HAVE**
- [ ] Two independent citizen reports of the same real-world problem are linked to one Issue (REQ-07, DEC-11, DEC-12) rather than treated as unrelated.

**OPTIONAL**
- [ ] A mismatch in resolution evidence produces a "Needs Verification" state rather than a hard pass/fail (Principle 10, PROPOSED-08).

---

## 3. Citizen Functionality

**MUST HAVE**
- [ ] Report an issue via in-app camera, device GPS/timestamp, and text description (Principle 1, Principle 2, DEC-01, DEC-02, DEC-04).
- [ ] View own complaint status history (REQ-10).
- [ ] Confirm or reopen a resolved Issue (REQ-12, DEC-22).

**SHOULD HAVE**
- [ ] Provide a description via voice input in at least one language, using whichever transcription path was actually wired in (DEC-05, DEC-06) — exact language coverage is UNDECIDED (open question #39) and not required to be exhaustive.
- [ ] View nearby unresolved aggregated Issues without seeing other citizens' personal information (DEC-13, DEC-14).

**OPTIONAL**
- [ ] EXIF-based secondary location cross-check on uploaded/captured photos (Principle 3) — missing EXIF must never block submission (R-02).

**OUT OF SCOPE**
- [ ] Full multilingual UI localisation across all Indian languages.

---

## 4. Officer Functionality

**MUST HAVE**
- [ ] View issues assigned to own jurisdiction/department (DEC-18, REQ-13).
- [ ] Acknowledge and update status on an issue (Section 6 Officer role).
- [ ] Submit resolution evidence (fresh photo + location + timestamp) (DEC-20).

**SHOULD HAVE**
- [ ] A map view of open issues in the officer's jurisdiction (DEC-19) — a full heatmap is not required for this to count as done; a simple map with markers satisfies REQ-13's map requirement.

**OPTIONAL**
- [ ] Heatmap visualisation of issue density/weighted risk (PROPOSED-09) — exact calculation is unresolved and not expected to be finalised in 12 hours.
- [ ] Department response-time / backlog metrics beyond a basic open/pending count (REQ-14, PROPOSED-10).

---

## 5. Admin / Municipal Functionality

**MUST HAVE**
- [ ] Some consolidated view of issues across the demo jurisdiction data exists (Section 6, Municipal/Admin User) — this can be the same dashboard used by officers if a separate admin role is not built, since exact admin permissions are UNDECIDED (Section 6).

**SHOULD HAVE**
- [ ] Basic department response-time / pending-backlog visibility (REQ-14).

**OPTIONAL**
- [ ] Recurring/hotspot problem-location surfacing (REQ-15, PROPOSED-11) — a simple "count of issues per demo location" satisfies the spirit of this if a full algorithm isn't feasible; do not build a real geographic clustering algorithm at the expense of MUST HAVE items.

**OUT OF SCOPE**
- [ ] A distinct, fully separate admin authentication/permission system beyond what officer accounts already require (C-09, UNDECIDED-01).

---

## 6. Evidence / Location Verification

**MUST HAVE**
- [ ] Device GPS and timestamp are captured and stored with every citizen complaint (DEC-02, Principle 2).
- [ ] Officer resolution requires a fresh photo with location/timestamp, not just a status toggle (DEC-20, Principle 9).

**SHOULD HAVE**
- [ ] Some explicit, even if simplified, geo/time comparison between citizen and officer evidence at resolution (DEC-21) — an exact tolerance/threshold is UNDECIDED (open question #30) and may be a fixed demo-safe value rather than a tuned production threshold.

**OPTIONAL**
- [ ] Photo EXIF cross-check against device GPS (Principle 3, DEC-03).
- [ ] A formal Evidence Confidence score or band (high/needs verification/low) (PROPOSED-01, PROPOSED-02, PROPOSED-03) — this remains PROPOSED in MASTER_CONTEXT and is not required for the prototype to be considered done.

**OUT OF SCOPE**
- [ ] Service-complaint-specific verification (e.g., water supply) requiring independent reports/geographic clustering/duration signals (R-04) — MASTER_CONTEXT leaves the exact method unresolved and the demo scenario is physical-complaint-only.
- [ ] Advanced AI-based evidence verification (OPTIONAL-02).

---

## 7. Duplicate / Issue Behavior

**MUST HAVE**
- [ ] The system distinguishes an individual Complaint from an underlying Issue in its data model (DEC-11, REJECTED-02).

**SHOULD HAVE**
- [ ] At least one working duplicate-detection path (e.g., fixed radius + matching category) that links two independent reports to one Issue (REQ-07, PROPOSED-05) — exact thresholds are UNDECIDED and a fixed, demo-chosen value is acceptable.
- [ ] Independent reporters are counted separately from repeated reports by the same citizen (Principle 7, R-10).
- [ ] Original citizen Complaints are preserved (not deleted) when merged into an Issue (Principle 8).

**OPTIONAL**
- [ ] Suspicious-pattern / spam-report detection (REQ-08, PROPOSED-07) — this is PROPOSED-level and not finalised in MASTER_CONTEXT; a full implementation is not expected within 12 hours.

---

## 8. Priority Scoring

**MUST HAVE**
- [ ] A rule-based (not purely AI-decided) Risk/Priority Score exists and visibly affects ordering on the officer dashboard (DEC-16, REQ-09).
- [ ] The score is not based on report count alone (Principle 12, R-07).

**SHOULD HAVE**
- [ ] The score reflects, in some simplified form, the agreed factor set: severity, public exposure, vulnerable population impact, critical infrastructure impact, duration, community corroboration, recurrence, evidence confidence (DEC-17) — exact weights are UNDECIDED (PROPOSED-04) and a fixed demo weighting is acceptable and expected.

**OUT OF SCOPE**
- [ ] Finalised, tuned production weights for the risk score (R-08) — MASTER_CONTEXT explicitly leaves this unresolved.

---

## 9. Status / Notifications

**MUST HAVE**
- [ ] Status is visible to the citizen through at least Submitted → Acknowledged → Ongoing → Resolved (Section 7).
- [ ] Some notification mechanism (live SMS or mock SMS) fires on at least the Resolved stage (DEC-23, PROPOSED-12).

**SHOULD HAVE**
- [ ] Notifications fire at each defined lifecycle stage: submitted, acknowledged, ongoing, resolved, reopened (DEC-23).

**OPTIONAL**
- [ ] A live, integrated SMS provider rather than a mock panel (DEC-24 is UNDECIDED — either satisfies "done").

**OUT OF SCOPE**
- [ ] A finalised, production SMS state machine covering every edge case (UNDECIDED-02, UNDECIDED-03).

---

## 10. Offline / Local-Language Requirements

**SHOULD HAVE**
- [ ] A citizen can capture a complaint while offline and have it stored locally for later submission (REQ-04, DEC-25) — the exact storage tech (Dexie.js/IndexedDB, PWA) is PROPOSED, not finalised, so any working local-storage-then-sync mechanism satisfies this.
- [ ] At least one non-English language path is demonstrable via voice input (DEC-05, DEC-06), even if only one language is wired in for the demo.

**OPTIONAL**
- [ ] Full PWA installability / offline app-shell behavior beyond basic report queuing.

**OUT OF SCOPE**
- [ ] Robust offline conflict resolution or sync-retry logic under real-world network conditions — this is a 12-hour prototype (R-14) and full production-grade offline sync is not expected.

---

## 11. Community View

**SHOULD HAVE**
- [ ] Citizens can view nearby unresolved aggregated Issues (DEC-13).
- [ ] No other citizen's personal information (name, contact, exact identity) is exposed in this view (DEC-14, R-11).

**OPTIONAL**
- [ ] Filtering/sorting of the community view by category or distance.

---

## 12. Usability (Limited Digital Familiarity)

**SHOULD HAVE**
- [ ] The citizen reporting flow can be completed in a small number of clear steps without requiring the citizen to know administrative/jurisdiction terminology (REQ-16, Principle 4).
- [ ] Core actions (report, view status, confirm/reopen) use plain-language labels rather than technical or bureaucratic terms.

**OPTIONAL**
- [ ] Formal accessibility testing (screen reader support, contrast audits, etc.) — valuable but not feasible to fully validate in 12 hours; do not let this consume MUST HAVE time.

> Detailed UI behavior is defined separately in 08_UI_DESIGN.md; this section only checks that the delivered UI does not contradict REQ-16.

---

## 13. Privacy

**MUST HAVE**
- [ ] The community/nearby-issues view never displays another citizen's personal identifying information (DEC-14, R-11).

**SHOULD HAVE**
- [ ] Officer-facing views expose only the information officers need (location, evidence, category, status) rather than unrelated citizen account details.

**OUT OF SCOPE**
- [ ] A finalised authentication/authorisation security model (C-09, UNDECIDED-01) — this is explicitly deferred to a separate security architecture document per the task boundary.

---

## 14. Prototype-Data Honesty

**MUST HAVE**
- [ ] The Chennai jurisdiction/demo dataset is clearly presented (in-app label, presenter narration, or both) as team-provided demo data, **not** an authoritative government dataset (DEC-09, R-12, C-05).
- [ ] No claim is made, in the app or presentation materials, that Swachhata-MoHUA, CPGRAMS, or GCC capabilities have been verified beyond what the team has actually confirmed (Section 8, Research Rule) — any comparison must distinguish verified fact, team observation, and assumption requiring verification.
- [ ] No claim is made that the prototype is production-ready or deployed (C-10, DEC-27).

---

## 15. Requirement-Risk Table

Cross-check of every official REQ (Section 2 of MASTER_CONTEXT) against 12-hour demonstrability.

| REQ | Requirement | Demonstrable in 12h? | Reason |
|---|---|---|---|
| REQ-01 | Report an issue (photo, location, description) | **YES** | Core flow, fully FINAL/AGREED mechanism (in-app camera, GPS, text). |
| REQ-02 | Accept reports from mobile and web | **PARTIAL** | Frontend/PWA/camera/geolocation approach is PROPOSED, not finalised; realistically one responsive web app shown on both form factors rather than distinct native builds. |
| REQ-03 | Accept reports in local languages | **PARTIAL** | Sarvam AI voice-to-text is FINAL/AGREED as a concept, but exact languages demoed are unresolved (open question #39); likely only one or two languages shown. |
| REQ-04 | Capture reports offline, sync when connectivity returns | **PARTIAL** | Concept is FINAL/AGREED (DEC-25), but storage tech is PROPOSED only; basic local-queue-then-submit is feasible, robust sync/conflict handling is not. |
| REQ-05 | Automatically categorise issues from photo/text | **PARTIAL** | AI categorisation is FINAL/AGREED as a concept, but exact model/service (UNDECIDED-04) and final category list (PROPOSED-06) are unresolved; a working categoriser with a fixed category set is feasible, a fully validated one is not. |
| REQ-06 | Route each report to the responsible department | **PARTIAL** | Jurisdiction concept is FINAL/AGREED, but exact Chennai jurisdiction structure/data is UNDECIDED (UNDECIDED-05); feasible only against the team's own fixed demo dataset, not general accuracy. |
| REQ-07 | Detect and merge duplicate reports | **PARTIAL** | Concept is FINAL/AGREED (DEC-12), but exact thresholds are PROPOSED/UNDECIDED (PROPOSED-05); a simple fixed-radius/category match is feasible, a tuned algorithm is not. |
| REQ-08 | Filter spam, false, and malicious reports | **NO** (demo-level illustration only, if time permits) | Suspicious-pattern detection and Evidence Confidence are both PROPOSED, not finalised (PROPOSED-07, DEC-15); reliable filtering logic is not realistic within 12 hours and risks false positives in a live demo. |
| REQ-09 | Prioritise by severity, location, number of reporters | **PARTIAL** | Rule-based Risk/Priority concept and factor set are FINAL/AGREED (DEC-16, DEC-17), but exact weights are PROPOSED/UNDECIDED (PROPOSED-04); a working score with fixed demo weights is feasible, a validated/tuned score is not. |
| REQ-10 | Show live status to the reporter through to resolution | **YES** | Core status lifecycle is FINAL/AGREED as a concept and directly supports the demo scenario. |
| REQ-11 | Notify citizens at each stage | **PARTIAL** | Notification concept and stages are FINAL/AGREED (DEC-23), but SMS provider is UNDECIDED (DEC-24); a mock SMS fallback (PROPOSED-12) is the realistic path if no provider is integrated in time. |
| REQ-12 | Allow citizens to confirm or reopen a resolved issue | **YES** | Directly FINAL/AGREED (DEC-22, Principle 11) and core to the demo scenario. |
| REQ-13 | Provide staff a map and dashboard of open issues | **PARTIAL** | Dashboard and map/heatmap concept are FINAL/AGREED (DEC-18, DEC-19), but exact heatmap implementation is unresolved (PROPOSED-09); a basic map with markers plus a list dashboard is feasible, a full heatmap is not guaranteed. |
| REQ-14 | Track department response times and pending backlogs | **PARTIAL** | Basic backlog/pending counts are feasible; the fuller metric set discussed (acknowledgement time, resolution rate, reopen rate, etc.) is PROPOSED and not finalised (PROPOSED-10). |
| REQ-15 | Surface recurring problem locations | **PARTIAL** | Hotspot is a FINAL/AGREED concept, but the recurrence algorithm is PROPOSED/unresolved (PROPOSED-11); a simple count-per-location view is feasible, a true recurrence algorithm is not. |
| REQ-16 | Remain usable by citizens with limited digital familiarity | **PARTIAL** | Achievable at a basic level (simple flow, plain language, automatic jurisdiction per Principle 4) within the UI actually built in 12 hours, but no formal usability validation is feasible in the timeframe. |

---

## 16. Overall "Done" Statement

The 12-hour prototype is considered **done** when every item in Section 2 (Core End-to-End Workflow) MUST HAVE list is working, the demo in 10_DEMO_SCENARIO.md can be run start to finish without manual data manipulation beyond the documented pre-seeding, Section 14 (Prototype-Data Honesty) items are satisfied, and no OUT OF SCOPE or REJECTED item (per MASTER_CONTEXT Sections 3–11) has silently been treated as required. SHOULD HAVE and OPTIONAL items strengthen the demo but are explicitly not blockers, per the twelve-hour scope risk identified in R-14.
