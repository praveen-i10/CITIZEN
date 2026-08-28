# 03_FEATURE_SPEC.md

> This document (a) makes the explicit MUST/SHOULD/OPTIONAL/OUT-OF-SCOPE call on every `PROPOSED`/`OPTIONAL` idea in MASTER_CONTEXT, with rationale, and (b) specifies every selected feature: purpose, actor, trigger, inputs, outputs, behavior, states, edge cases, acceptance criteria.

---

## Part A — Scope Decisions for PROPOSED / OPTIONAL Items

Decision criteria used: **hackathon value** (does it strengthen the demo story), **feasibility** (buildable with confidence in the time left), **dependencies** (does it block or get blocked by MUST-HAVE items), **demo importance** (is it visible/explainable in a 3–5 min demo).

| Item | MASTER_CONTEXT Status | Decision | Rationale |
|---|---|---|---|
| Evidence Confidence (score + bands) | PROPOSED | **SHOULD HAVE** (simplified) | Directly feeds Risk Score (an agreed factor) and differentiates the product story ("evidence-backed"); implement as a simple additive rule, not a full ML model. |
| Evidence Confidence exact weights/bands | PROPOSED | **OUT OF SCOPE** (use fixed simple defaults) | Exact tuning is not demo-critical; a defensible default is enough. |
| Risk/Priority Score (concept) | FINAL/AGREED | **MUST HAVE** | Explicitly required (REQ-09) and a core differentiator vs. count-based systems. |
| Risk Score exact weights (20/15/15/10/10/10/10/10) | PROPOSED | **MUST HAVE (as prototype default)** | A concrete number is needed to compute anything; adopt the discussed weights as the prototype's working default, clearly labeled as provisional, not final product decision. |
| Duplicate detection (radius + category) | PROPOSED | **MUST HAVE (simplified rule)** | REQ-07 is official; a simple fixed-radius + same-category rule is feasible in scope. |
| Exact issue category list | PROPOSED | **MUST HAVE (fixed demo list)** | Needed to run categorisation/routing at all. Fixed list for prototype: pothole, garbage, streetlight, drainage, footpath, road damage, water supply, other. |
| Suspicious pattern detection | PROPOSED | **SHOULD HAVE (minimal heuristic)** | REQ-08 is official; implement only "identical repeat submission" + "too many submissions in short window" checks. Full pattern ML is infeasible in 12h. |
| Resolution verification (GPS/time cross-check) | PROPOSED (detail) / FINAL (concept) | **MUST HAVE (simplified tolerance rule)** | Core to the "evidence-backed" differentiator and explicitly agreed at concept level (DEC-21). |
| Heatmap calculation | PROPOSED | **SHOULD HAVE (simple density-by-count)** | Visually strong for demo; use simple point-density, not weighted-risk heatmap (too complex for 12h). |
| Department performance metrics (beyond response time/backlog) | PROPOSED | **OPTIONAL** | REQ-14's minimum (response time + backlog) is MUST HAVE; extra metrics (reopen rate etc.) are nice-to-have if time remains. |
| Recurring hotspot algorithm | PROPOSED | **SHOULD HAVE (simple clustering: count of Issues per fixed-size grid cell/area)** | REQ-15 is official; simplest possible implementation preserves the requirement. |
| Mock SMS fallback | PROPOSED | **MUST HAVE (as the default, not a fallback)** | Given SMS provider is UNDECIDED and time is short, mock SMS (in-app simulated log) is adopted as the prototype's primary implementation to guarantee REQ-11 is demoable without depending on external account setup. Real provider becomes OPTIONAL if time allows. |
| Advanced government/utility integration | OPTIONAL | **OUT OF SCOPE** | No integration was confirmed feasible; explicitly excluded from a 12h build. |
| Advanced AI evidence verification | OPTIONAL | **OUT OF SCOPE** | Beyond categorisation + simple cross-check, no advanced verification is attempted. |
| Manual jurisdiction selection (citizen-facing) | REJECTED | **OUT OF SCOPE (confirmed rejected)** | Superseded by automatic jurisdiction determination; not revisited. |
| Treating every report as separate real-world issue | REJECTED | **OUT OF SCOPE (confirmed rejected)** | Superseded by Complaint/Issue distinction. |

**Not re-decided (still UNDECIDED, deliberately not guessed):** authentication method, exact status transition edge rules beyond what's specified in Section 02, SMS provider identity, exact AI model/service, exact Chennai jurisdiction schema/values (only that demo data will exist), exact GIS thresholds beyond the simplified rules adopted above for prototype purposes.

---

## Part B — Feature Specifications

Format per feature: Purpose · Actor · Trigger · Inputs · Outputs · Behavior · States · Edge Cases · Acceptance Criteria.

### F-01 Citizen Issue Reporting (MUST HAVE)
- **Purpose:** Capture a verifiable physical civic complaint quickly.
- **Actor:** Citizen.
- **Trigger:** Taps "Report Issue."
- **Inputs:** In-app photo, device GPS, timestamp, text or voice description.
- **Outputs:** New Complaint record with status = Submitted; reference ID shown to citizen.
- **Behavior:** Camera-first capture; GPS auto-attached; EXIF cross-check attempted silently; description accepted as text or transcribed voice.
- **States:** Draft (in progress) → Submitted.
- **Edge Cases:** GPS denied (blocked, retry prompt); camera denied (blocked, retry prompt); voice transcription failure (fallback to text).
- **Acceptance Criteria:** A citizen with photo + GPS + description can produce a Submitted complaint with a visible reference ID in under 60 seconds of interaction time.

### F-02 Offline Report Capture & Sync (MUST HAVE)
- **Purpose:** Guarantee reporting works without connectivity (REQ-04).
- **Actor:** Citizen.
- **Trigger:** Citizen submits while device is offline.
- **Inputs:** Same as F-01.
- **Outputs:** Locally stored Pending-Sync report; later, a Submitted complaint once synced.
- **Behavior:** Local storage on device; automatic background sync attempt on reconnect.
- **States:** Pending Sync → Submitted (post-sync) or remains Pending Sync (sync failure, with manual retry).
- **Edge Cases:** No cached GPS at all (flag as approximate/missing); app closed before sync (resumes on reopen); repeated sync failure (never silently dropped).
- **Acceptance Criteria:** A report created with network disabled is visible locally immediately and appears server-side within one sync cycle after connectivity is restored.

### F-03 Voice Input (Sarvam AI) (SHOULD HAVE)
- **Purpose:** Support local-language description input (REQ-03).
- **Actor:** Citizen.
- **Trigger:** Taps microphone icon during report creation.
- **Inputs:** Recorded audio.
- **Outputs:** Editable text transcript inserted into description field.
- **Behavior:** Audio sent to Sarvam AI; transcript returned and shown for citizen review/edit before submit.
- **States:** Recording → Transcribing → Transcript Ready/Editable.
- **Edge Cases:** Transcription failure/timeout → citizen types manually; report not blocked.
- **Acceptance Criteria:** At least one non-English language demoed end-to-end with a visibly correct or near-correct transcript.

### F-04 AI Categorisation (MUST HAVE)
- **Purpose:** Automatically classify the issue type (REQ-05).
- **Actor:** System (triggered by citizen submission).
- **Trigger:** Citizen taps Submit.
- **Inputs:** Photo, text description.
- **Outputs:** Suggested category from the fixed demo list; citizen-confirmable/overridable.
- **Behavior:** AI call proposes a category; UI shows it pre-selected with an easy override control.
- **States:** Pending Categorisation → Categorised (AI) → Confirmed (citizen) or Overridden (citizen).
- **Edge Cases:** AI call fails/slow → manual category picker shown, submission not blocked.
- **Acceptance Criteria:** Every submitted complaint has a final category, whether AI-confirmed or citizen-overridden.

### F-05 Jurisdiction Determination & Routing (MUST HAVE)
- **Purpose:** Route each complaint to the right department without asking the citizen (REQ-06).
- **Actor:** System.
- **Trigger:** Complaint has location + category set.
- **Inputs:** GPS coordinates, category, team-provided Chennai jurisdiction demo dataset.
- **Outputs:** Assigned department/officer jurisdiction.
- **Behavior:** Point-in-area lookup against demo jurisdiction polygons/zones; category maps to a department type within that jurisdiction.
- **States:** Unassigned → Assigned or Unassigned–Needs Manual Routing (no match).
- **Edge Cases:** Location outside covered demo area → flagged for manual admin routing, never dropped.
- **Acceptance Criteria:** Any point within the demo-covered Chennai area resolves to exactly one department; points outside are clearly flagged, not silently lost.

### F-06 Duplicate Detection & Linking (MUST HAVE)
- **Purpose:** Prevent the same real-world problem from being tracked as N unrelated Issues (REQ-07).
- **Actor:** System.
- **Trigger:** New complaint submitted.
- **Inputs:** Location, category of new complaint vs. existing open Issues.
- **Outputs:** Either a new Issue, or the complaint linked to an existing Issue as corroboration.
- **Behavior:** Fixed-radius geographic match + same/related category → candidate match shown to citizen for confirm/deny (see Flow 1, E5); confirmed match links complaint to Issue.
- **States:** Candidate Match Found → Linked or Not-a-match (creates new Issue).
- **Edge Cases:** Two distinct nearby issues, same category → possible incorrect link (accepted prototype limitation, logged as known risk).
- **Acceptance Criteria:** Submitting two complaints for the same photographed pothole within the demo radius results in one Issue with two linked complaints, both retained.

### F-07 Suspicious Submission Flagging (SHOULD HAVE)
- **Purpose:** Basic spam/abuse resistance (REQ-08) without accusing citizens.
- **Actor:** System.
- **Trigger:** New complaint submitted.
- **Inputs:** Recent submission history for the same citizen/device.
- **Outputs:** Internal "flagged for review" tag on the complaint (not visible to the citizen as an accusation).
- **Behavior:** Rule: N identical/near-identical submissions within a short time window → flag.
- **States:** Normal / Flagged-for-Review.
- **Edge Cases:** Legitimate repeat reporter (different real issues) → should not be flagged; keep the rule narrow (identical content/photo hash) to minimize false positives.
- **Acceptance Criteria:** A scripted burst of identical repeat submissions is visibly flagged in the officer/admin view; a normal single submission is not.

### F-08 Evidence Confidence (SHOULD HAVE, simplified)
- **Purpose:** Represent how strongly evidence supports an Issue, feeding Risk Score.
- **Actor:** System.
- **Trigger:** Complaint/Issue evidence changes (new corroborating report, etc.).
- **Inputs:** Presence of fresh in-app photo, valid GPS, valid timestamp, corroborating independent reports.
- **Outputs:** A simple confidence value/band (High / Needs Verification / Low) used only as one Risk Score input — never shown as a fraud verdict.
- **Behavior:** Additive rule over present/absent evidence signals with fixed prototype weights.
- **States:** N/A (recomputed value, not a lifecycle state).
- **Edge Cases:** Service complaints with no useful photo → confidence relies on location/duration/independent reports only.
- **Acceptance Criteria:** Confidence value changes visibly when a second independent citizen corroborates the same Issue.

### F-09 Risk / Priority Score (MUST HAVE)
- **Purpose:** Determine urgency using multiple factors, not complaint count alone (REQ-09).
- **Actor:** System.
- **Trigger:** Issue created or its inputs change (new corroboration, time elapsed, reopened).
- **Inputs:** Severity, public exposure, vulnerable-population impact, critical-infrastructure impact, duration, community corroboration, recurrence, evidence confidence (F-08).
- **Outputs:** A numeric/banded priority score visible to officers/admins, used for dashboard sort order.
- **Behavior:** Weighted sum using the adopted prototype default weights (20/15/15/10/10/10/10/10 — see Part A).
- **States:** Recomputed value, not a lifecycle state.
- **Edge Cases:** Missing inputs (e.g., no way to measure "public exposure" precisely) → use a simple proxy (e.g., road type/category-based default) rather than blocking the score.
- **Acceptance Criteria:** A manhole-type Issue with fewer reports but high severity/exposure ranks above a minor Issue with many reports, demonstrating R-07/Principle 12.

### F-10 Live Status & Timeline (MUST HAVE)
- **Purpose:** Give citizens visibility (REQ-10).
- **Actor:** Citizen.
- **Trigger:** Opens a complaint from "My Reports."
- **Inputs:** Complaint's current status + history.
- **Outputs:** Status label + simple timeline.
- **Behavior:** Read-only view reflecting the underlying Issue/Complaint state.
- **States:** Submitted → Acknowledged → Ongoing → Resolved → (Closed | Reopened) → Needs Verification (side-branch).
- **Edge Cases:** No history yet (just submitted) → shows single "Submitted" entry only.
- **Acceptance Criteria:** Every status change made by an officer is reflected in the citizen's view without requiring app restart.

### F-11 SMS Stage Notifications (MUST HAVE, mock implementation)
- **Purpose:** Keep citizens informed passively (REQ-11).
- **Actor:** System.
- **Trigger:** Any status change: submitted, acknowledged, ongoing, resolved, reopened.
- **Inputs:** Citizen contact (demo phone number), status change event.
- **Outputs:** A simulated SMS record (mock) shown in an admin/demo "SMS Outbox" view, standing in for a real provider send.
- **Behavior:** Mock adopted as MUST HAVE default per Part A; real provider integration is OPTIONAL if time allows.
- **States:** N/A (event-driven send).
- **Edge Cases:** Send "failure" (simulated) does not block status change from persisting.
- **Acceptance Criteria:** Every lifecycle transition produces exactly one visible mock SMS entry referencing the correct complaint and stage.

### F-12 Citizen Confirm / Reopen (MUST HAVE)
- **Purpose:** Let citizens challenge a claimed resolution (REQ-12).
- **Actor:** Citizen.
- **Trigger:** Complaint status = Resolved.
- **Inputs:** Citizen's confirm/reopen decision, optional reopen note.
- **Outputs:** Status → Closed or Reopened.
- **Behavior:** Two-button decision on the complaint detail screen.
- **States:** Resolved–Awaiting Confirmation → Closed | Reopened.
- **Edge Cases:** Multiple linked citizens disagree → Reopen takes precedence (assumed prototype default, flagged for team confirmation).
- **Acceptance Criteria:** Reopening a Resolved Issue returns it to the officer's active dashboard with status Reopened and triggers an SMS.

### F-13 Officer Dashboard & Map/Heatmap (MUST HAVE, simplified heatmap = SHOULD HAVE)
- **Purpose:** Give officers a jurisdiction-scoped operating view (REQ-13).
- **Actor:** Officer.
- **Trigger:** Officer logs in / opens dashboard.
- **Inputs:** Issues within officer's jurisdiction.
- **Outputs:** Sortable list (by priority) + Leaflet/OSM map with pins; optional simple density heatmap.
- **Behavior:** List and map stay in sync; selecting a pin opens the Issue detail.
- **States:** N/A (view).
- **Edge Cases:** Empty jurisdiction (no open Issues) → empty state.
- **Acceptance Criteria:** Officer can see and select any open Issue in their jurisdiction from both list and map.

### F-14 Officer Acknowledge / Update / Resolve Workflow (MUST HAVE)
- **Purpose:** Move an Issue through its lifecycle (REQ-13/14, DEC-20/21).
- **Actor:** Officer.
- **Trigger:** Officer opens an assigned Issue.
- **Inputs:** Officer actions (Acknowledge, Start Work, Mark Resolved + fresh photo/GPS/timestamp).
- **Outputs:** Updated Issue status; resolution evidence record when resolved.
- **Behavior:** See Flow 6.
- **States:** Submitted → Acknowledged → Ongoing → Resolved | Needs Verification.
- **Edge Cases:** Resolution photo/GPS capture failure blocks the Resolved transition (see Flow 6 E1/E2).
- **Acceptance Criteria:** An officer can take a demo Issue from Submitted to Resolved (or to Needs Verification on a deliberately mismatched demo case) within the officer UI alone.

### F-15 Resolution Cross-Verification (MUST HAVE, simplified)
- **Purpose:** Validate resolution claims against original evidence (Principle 10, DEC-21).
- **Actor:** System.
- **Trigger:** Officer submits resolution evidence.
- **Inputs:** Officer GPS/timestamp/photo vs. citizen's original GPS/timestamp/photo.
- **Outputs:** Resolved (match) or Needs Verification (mismatch).
- **Behavior:** Fixed-distance tolerance check between officer and original complaint location (exact tolerance = prototype default, not final — Open Question 30 remains UNDECIDED at the product-decision level).
- **States:** As above.
- **Edge Cases:** Officer GPS unavailable → routes directly to Needs Verification (conservative default, Flow 6 E2).
- **Acceptance Criteria:** A resolution submitted far from the original location is demonstrably routed to Needs Verification rather than auto-closing.

### F-16 Community Nearby-Issues View (MUST HAVE)
- **Purpose:** Let citizens see aggregated unresolved issues near them (DEC-13/14).
- **Actor:** Citizen.
- **Trigger:** Opens "Nearby Issues."
- **Inputs:** Citizen's current location (or default Chennai view).
- **Outputs:** List/map of nearby unresolved Issues (aggregate info only).
- **Behavior:** No reporter identity ever rendered in this view.
- **States:** N/A (view).
- **Edge Cases:** No nearby issues → empty state.
- **Acceptance Criteria:** The nearby-issues view never renders any citizen name/contact info, verified by manual review of the view's data source.

### F-17 Department Backlog / Response-Time Tracking (MUST HAVE, minimum metrics)
- **Purpose:** REQ-14 minimum compliance.
- **Actor:** Admin/Officer.
- **Trigger:** Dashboard load.
- **Inputs:** Issue timestamps per stage, per department.
- **Outputs:** Backlog count + average response time per department.
- **Behavior:** Simple aggregation query, no ML.
- **States:** N/A.
- **Edge Cases:** No resolved Issues yet → response time shows "no data."
- **Acceptance Criteria:** Admin dashboard shows at least backlog count and one time-based metric per department with real demo data.

### F-18 Recurring Hotspot Surfacing (SHOULD HAVE, simplified)
- **Purpose:** REQ-15 compliance.
- **Actor:** Admin.
- **Trigger:** Admin opens hotspot/heatmap view.
- **Inputs:** Historical Issue locations + categories.
- **Outputs:** Highlighted areas with repeated/concentrated Issues.
- **Behavior:** Simple grid/cluster count, not a formal spatial statistics model.
- **States:** N/A.
- **Edge Cases:** Sparse demo data → hotspot view may show few/no clusters; acceptable for prototype.
- **Acceptance Criteria:** Seeding 3+ demo Issues in the same small area visibly produces one highlighted hotspot.

---

## Part C — Out of Scope for the Prototype (explicit, do not build)

- Advanced government/utility system integration (OPTIONAL-01).
- Advanced AI-based evidence verification beyond simple GPS/time tolerance (OPTIONAL-02).
- Manual citizen jurisdiction selection (REJECTED-01).
- Full ML-based spam/fraud detection.
- Real SMS provider integration unless explicitly completed as stretch time allows (default is mock).
- Full offline-first PWA robustness beyond basic local-store-and-sync.
- Fine-grained admin permission model (only "view/oversight" assumed).
