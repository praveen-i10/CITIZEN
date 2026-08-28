# 02_USER_FLOWS.md

> Derived from 01_REQUIREMENTS.md and MASTER_CONTEXT.md. Covers normal flows and required failure/edge cases only for `REQUIRED`/`FINAL AGREED` behavior. No new features introduced.

---

## Flow 1 — Citizen: Report a Physical Issue (Online)
**Traces:** FR-01, FR-03, FR-05, FR-06

**Normal Flow**
1. Citizen opens app → taps "Report Issue."
2. In-app camera opens → citizen takes photo (no gallery upload — Principle 1).
3. App captures device GPS + timestamp automatically.
4. App attempts EXIF read from photo; if present, compares to GPS silently (background evidence signal, not shown as a blocking step).
5. Citizen adds description via text OR taps mic for voice input.
6. If voice: audio sent to Sarvam AI → transcript returned → citizen sees transcript, can edit.
7. Citizen taps "Submit."
8. AI categorisation runs on photo+text → suggested category shown.
9. Citizen confirms category (or picks a different one from a short list).
10. System determines jurisdiction/department from location.
11. System runs duplicate check against existing open Issues nearby.
12. Confirmation screen: "Report submitted" + reference ID + initial status = Submitted.
13. SMS sent: "submitted" notification.

**Edge/Failure Cases**
- **E1 — GPS unavailable:** App blocks submission with a message asking to enable location (GPS is required per DEC-02); citizen may retry.
- **E2 — Camera permission denied:** App explains camera is required for physical reports and offers to open device settings.
- **E3 — Voice transcription fails (Sarvam AI error/timeout):** Citizen falls back to typing description manually; report is not blocked.
- **E4 — AI categorisation fails/times out:** Citizen manually selects category from list; report proceeds without AI suggestion.
- **E5 — Duplicate candidate found:** Citizen is shown "This may already be reported nearby" with a summary of the existing Issue; citizen can (a) confirm it's the same issue → their report links as a corroborating complaint, or (b) confirm it's different → new Issue created.
- **E6 — No jurisdiction match found for location (outside demo data coverage):** Report is still accepted and stored as "Unassigned — Needs Manual Routing," visible to admin.

---

## Flow 2 — Citizen: Report Offline
**Traces:** FR-04

**Normal Flow**
1. Citizen opens app with no connectivity.
2. App detects offline state, shows an offline indicator.
3. Citizen completes camera capture, GPS (last known/cached fix), description exactly as in Flow 1 steps 2–6.
4. On submit, report is saved locally on-device with status "Pending Sync."
5. Citizen can see it in "My Reports" marked as Pending Sync.
6. When connectivity returns, app automatically attempts sync.
7. On successful sync, report proceeds through Flow 1 steps 8–13 (categorisation, jurisdiction, duplicate check, SMS).

**Edge/Failure Cases**
- **E1 — GPS not available while offline:** App uses last cached device location if available and flags it as "approximate"; if none available at all, citizen is warned the report may need manual location correction after sync.
- **E2 — App closed/killed before sync:** Pending report persists locally and resumes sync attempt next time the app is opened with connectivity.
- **E3 — Sync fails repeatedly (server unreachable):** Report remains in "Pending Sync" indefinitely with a visible retry option; never silently dropped.

---

## Flow 3 — Citizen: Track Status of a Complaint
**Traces:** FR-10, FR-11

**Normal Flow**
1. Citizen opens "My Reports."
2. Selects a report → sees current status (Submitted → Acknowledged → Ongoing → Resolved) and a simple status history/timeline.
3. Citizen receives SMS automatically whenever status changes, independent of opening the app.

**Edge/Failure Cases**
- **E1 — Status changes but SMS fails to send (provider error):** In-app status still updates correctly; SMS failure is logged, not blocking, and does not retry indefinitely against the user's cost (silent log only for prototype).
- **E2 — Citizen has no reports yet:** Empty state with a prompt to submit their first report.

---

## Flow 4 — Citizen: Browse Nearby Community Issues
**Traces:** FR-19

**Normal Flow**
1. Citizen opens "Nearby Issues" / community map.
2. Sees aggregated, unresolved Issues near their location as map pins/list, each showing category, approximate status, and priority indicator — no reporter identity.
3. Citizen can tap an Issue to see aggregate details (e.g., "3 reports," category, status) but never individual complainants' info.

**Edge/Failure Cases**
- **E1 — No nearby issues:** Empty state ("No unresolved issues near you").
- **E2 — Location permission denied for browsing:** Falls back to a default city-center view of Chennai demo area; citizen can pan manually.

---

## Flow 5 — Citizen: Confirm or Reopen a Resolved Issue
**Traces:** FR-12

**Normal Flow**
1. Citizen receives "Resolved" SMS/notification for their complaint.
2. Opens report → sees resolution evidence summary (that the officer marked it resolved) and two actions: "Confirm Resolved" / "Reopen."
3a. Confirm → status becomes Closed; SMS sent confirming closure.
3b. Reopen → citizen may add a short note; status becomes Reopened; case is re-routed to the responsible officer/department; SMS sent confirming reopening.

**Edge/Failure Cases**
- **E1 — Citizen takes no action within the review window:** Exact auto-close timeout is **UNDECIDED** (Open Question 34-adjacent) — for the prototype, the Issue simply remains in "Resolved — Awaiting Confirmation" state until acted on; no auto-close is assumed.
- **E2 — Multiple citizens linked to the same Issue disagree (one confirms, one reopens):** Reopen takes precedence (any dissatisfied reporter reopens the case) — this is a prototype-level default rule, marked **ASSUMED, not in MASTER_CONTEXT** and should be validated with the team.

---

## Flow 6 — Officer: Manage Assigned Issues
**Traces:** FR-13, FR-17

**Normal Flow**
1. Officer logs in → sees jurisdiction-scoped dashboard: list + map/heatmap of open Issues, sorted by priority.
2. Officer selects an Issue → views details: category, evidence (photos/GPS/timestamps), linked complaints, priority score breakdown.
3. Officer taps "Acknowledge" → status becomes Acknowledged; SMS sent to citizen(s).
4. Officer taps "Start Work" (or similar) → status becomes Ongoing; SMS sent.
5. When work is done, officer taps "Mark Resolved" → prompted to capture a fresh photo via in-app camera; app captures officer's GPS + timestamp.
6. System runs cross-verification against original complaint evidence.
7a. Match within tolerance → status becomes Resolved; SMS sent to citizen(s); citizen enters Flow 5.
7b. Mismatch → status becomes "Needs Verification"; Issue flagged for admin review; officer sees a message explaining a manual check is required (not an accusation).

**Edge/Failure Cases**
- **E1 — Officer resolution photo capture fails (camera error):** Officer cannot mark Resolved until a valid photo is captured; status remains Ongoing.
- **E2 — Officer GPS unavailable at resolution time:** Resolution cannot auto-verify; system routes directly to "Needs Verification" (per Open Question 32, treated conservatively).
- **E3 — Officer tries to resolve an Issue outside their jurisdiction:** Action blocked; Issue must first be reassigned/escalated (reassignment mechanism is **UNDECIDED**, out of scope for this prototype beyond blocking the action).

---

## Flow 7 — Admin/Municipal User: Consolidated Oversight
**Traces:** FR-13, FR-14, FR-15

**Normal Flow**
1. Admin logs in → sees a city-wide (not jurisdiction-limited) dashboard: all open Issues, department backlogs, response-time metrics, and recurring hotspot locations.
2. Admin can drill into a department to see its queue and performance metrics.
3. Admin can view the hotspot map to identify recurring-problem locations for planning.

**Edge/Failure Cases**
- **E1 — No data yet in a fresh demo instance:** Dashboard shows empty/zero states rather than errors.
- **Exact admin permission boundaries beyond "view":** **UNDECIDED** (Section 6, MASTER_CONTEXT — "exact administrative permissions are not yet defined").

---

## Flow 8 — Duplicate / Suspicious Report Handling (System-Internal, Cross-Cutting)
**Traces:** FR-07, FR-08

**Normal Flow**
1. On every new submission, system checks candidate duplicates (location radius + category) against existing open Issues.
2. If matched, complaint is linked to the existing Issue as corroboration (independent-reporter check applied per Principle 7) rather than creating a new Issue.
3. In parallel, system checks basic suspicious-pattern heuristics (e.g., identical repeat submissions from same device/citizen in a short window).
4. If flagged suspicious, the complaint is still recorded but tagged for officer/admin review; it does not block the citizen from submitting and does not label them fraudulent.

**Edge/Failure Cases**
- **E1 — Two different real issues happen to be close together with the same category:** Best-effort geographic/category rule may incorrectly merge them; exact thresholds are **UNDECIDED** (PROPOSED-05) — treated as an accepted prototype limitation, not a blocking defect.

---

## Cross-Flow Notes

- All flows above assume the Complaint vs. Issue distinction (FR-20) is respected — screens referencing "your report" show the Complaint; screens referencing city-wide/officer views show the Issue with aggregated evidence.
- Authentication steps are intentionally omitted from these flows — **UNDECIDED** (NFR-08); flows assume a role is already established when a screen loads.
