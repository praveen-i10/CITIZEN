# 10_DEMO_SCENARIO.md

> Source of truth: MASTER_CONTEXT.md. This document defines one deterministic, 3–5 minute demo scenario for the 12-hour prototype. It follows the core workflow: **Report → Categorise → Route → Prioritise → Resolve → Verify → Confirm.**
>
> Status labels (`FINAL/AGREED`, `REQUIRED`, `PROPOSED`, `OPTIONAL`, `REJECTED`, `UNDECIDED`) are preserved from MASTER_CONTEXT wherever a specific mechanism is referenced. Where MASTER_CONTEXT leaves something unresolved (exact weights, thresholds, categories, SMS provider, AI model), this scenario uses a **fixed demo value** so the walkthrough is repeatable — these fixed values are demo choices, not new product decisions, and remain UNDECIDED at the product level.

---

## 1. Demo Premise

A single, strong end-to-end story rather than a feature tour: **one pothole, reported by two independent citizens, routed automatically to the correct Chennai department, prioritised above a lower-severity issue, resolved by an officer with fresh evidence, and confirmed by the original citizen.**

This directly demonstrates the FINAL/AGREED core workflow:
**Capture → Locate → Categorise → Verify → Merge → Prioritise → Route → Resolve → Geo-Verify → Notify → Citizen Confirm.**

Total runtime target: **4 minutes** (range 3–5 minutes), with a presenter script.

---

## 2. Actors

| Actor | Role | Demo Device/Window |
|---|---|---|
| **Citizen A ("Priya")** | Reports the pothole first | Browser window 1 (citizen view) |
| **Citizen B ("Karthik")** | Reports the same pothole independently ~10–15 minutes later (simulated via seeded data/time-shift, not real-time wait) | Browser window 2 (citizen view) |
| **Officer ("Officer Ramesh")** | Assigned to the routed department; resolves the issue | Browser window 3 (officer dashboard) |
| **Presenter** | Narrates, drives the demo, plays all actors | — |

> Only citizen, officer, and municipal/admin roles are FINAL/AGREED (Section 6 of MASTER_CONTEXT). No other actor is introduced.

---

## 3. Demo Setup (Pre-Demo, Not Timed Into the 3–5 Minutes)

- SQLite prototype database pre-seeded with:
  - Team-provided Chennai jurisdiction/demo data (DEC-09, UNDECIDED-05 — clearly labeled in-app as **non-official demo data**, per DEC-09 / R-12).
  - One department ("Roads & Infrastructure – Zone Demo") and one officer account ("Officer Ramesh") pre-mapped to the demo location's jurisdiction.
  - A second, pre-existing lower-priority Issue already in the system (e.g., a minor footpath report with a single reporter) to visually contrast priority ordering on the officer dashboard. This second issue is **not** acted upon during the demo — it exists only to show relative prioritisation.
- One in-app camera-captured demo photo of a pothole prepared in advance (Principle 1 / DEC-01), at a known Chennai demo coordinate.
- Local Wi-Fi/network confirmed working; a manual "airplane mode toggle" step is rehearsed for the offline segment (REQ-04, DEC-25).
- Mock SMS panel (PROPOSED-12) open in a visible window/console, since no SMS provider is selected (DEC-24, UNDECIDED-03) — this is used **only if** a live SMS provider is not wired in; if a real provider is connected, that is shown instead. Which path is used is decided before the demo starts, not improvised live.
- Officer and citizen browser windows arranged so the presenter can move between them without navigation delay.

---

## 4. Step-by-Step Script

### Step 1 — Report (Citizen A) — ~45 seconds
**Action:** Citizen A opens the app, taps "Report Issue," uses the in-app camera to capture the pothole photo (or selects the pre-prepared photo if live camera capture is unreliable on demo hardware), allows device GPS, and adds a short text description ("Large pothole near junction, cars swerving").

**Expected system behavior:**
- Device GPS + timestamp captured and attached (DEC-02, Principle 2).
- Photo EXIF checked when available as a secondary signal only — absence of EXIF does not block submission (Principle 3, R-02).
- Report is created as a **Complaint**, status **Submitted** (Section 7, Status concept).

**Talking point:** "Priya doesn't have to know which department handles potholes, or whether this area is under the Corporation or a panchayat — the app will work that out from her location."

**Fallback:** If live camera/GPS is unreliable on demo hardware, use the pre-prepared photo and a fixed demo coordinate; state clearly to the audience that this is the fallback path, not a claim about production reliability.

---

### Step 2 — Categorise (AI) — ~20 seconds
**Action:** Presenter narrates while the system processes the submission.

**Expected system behavior:**
- AI categorisation assigns a category (e.g., "Pothole") from photo/text (DEC-07, REQ-05). Exact model/service is UNDECIDED at the product level (UNDECIDED-04); demo uses whichever service the team wired in.
- If categorisation confidence is low or the service is unavailable, the system falls back to a manual/default category selection rather than blocking submission — this fallback path should be rehearsed once before the live demo.

**Talking point:** "The AI reads both the photo and the description to work out this is a pothole — no dropdown menus for Priya to fill in."

---

### Step 3 — Route (Jurisdiction) — ~20 seconds
**Action:** No user action; system determines jurisdiction automatically.

**Expected system behavior:**
- Location is matched against the team's Chennai demo jurisdiction data (DEC-09) to resolve the responsible department (DEC-08, Principle 4).
- Complaint is assigned to "Roads & Infrastructure – Zone Demo" and appears on the officer's dashboard.

**Talking point:** "This is one of our key differentiators — manual jurisdiction selection was explicitly rejected [REJECTED-01] in favor of automatic, location-based routing."

---

### Step 4 — Second Independent Report / Merge (Citizen B) — ~40 seconds
**Action:** Switch to Citizen B's window. Citizen B reports the same pothole independently (own photo/description, GPS within the same demo radius).

**Expected system behavior:**
- The system detects the second report as a likely duplicate of the same real-world problem based on location and category proximity (DEC-12, PROPOSED-05 — exact thresholds are UNDECIDED, so the demo uses a fixed radius chosen for reliability).
- Both Complaints are linked to a single **Issue**, preserving each citizen's individual Complaint record (Principle 8, DEC-11).
- The Issue view shows "2 independent reporters," distinguishing this from one citizen reporting twice (Principle 7, R-10).

**Talking point:** "Karthik reports the same pothole without knowing Priya already did. The system links these as one real-world Issue, not two separate problems — that's the Complaint-vs-Issue distinction the team agreed on early."

**Fallback:** If live duplicate-matching is not wired in for the demo, pre-seed Citizen B's report as already merged and simply show the resulting Issue with two linked Complaints, narrating the same logic.

---

### Step 5 — Prioritise (Risk/Priority Score) — ~30 seconds
**Action:** Switch to the officer dashboard.

**Expected system behavior:**
- The Issue appears above the pre-seeded lower-priority footpath Issue, reflecting a rule-based Risk/Priority Score using the agreed factor set: severity, public exposure, vulnerable population impact, critical infrastructure impact, duration, community corroboration, recurrence, evidence confidence (DEC-17). Exact weights are PROPOSED/UNDECIDED (PROPOSED-04); the demo uses the team's own fixed demo weighting, clearly not presented as final.
- Dashboard is filtered to the officer's jurisdiction (DEC-18).

**Talking point:** "Notice this issue outranks the other one even though it has fewer total reports than some other prototype scenario might — priority isn't just a report count, by design [R-07, Principle 12]."

---

### Step 6 — Resolve (Officer) — ~45 seconds
**Action:** Officer Ramesh opens the Issue, reviews evidence (photo, location, description), acknowledges it, marks work in progress, then captures a fresh "after" photo via the in-app camera with location/timestamp to mark it Resolved.

**Expected system behavior:**
- Status transitions Submitted → Acknowledged → Ongoing → Resolved are reflected on both officer and citizen views (Section 7 Status concept; exact transition rules UNDECIDED-02, demo uses this fixed sequence).
- Resolution evidence (photo + GPS + timestamp) is attached to the Issue (DEC-20, Principle 9).

**Talking point:** "The officer can't just tap 'Resolved' — the app requires fresh photo evidence with location and time, just like the citizen had to provide up front."

---

### Step 7 — Verify (Geo/Evidence Cross-Check) — ~20 seconds
**Action:** No user action; system runs the cross-check.

**Expected system behavior:**
- Officer's resolution evidence (location/time) is compared against the original complaint's location/time (DEC-21, PROPOSED-08). Exact algorithm is UNDECIDED; demo uses a simple fixed distance/time check chosen for reliability.
- On match, the Issue is marked "Resolved — Verified." (If a mismatch is deliberately demonstrated as a secondary beat, it should route to a "Needs Verification" state rather than an automatic fraud accusation — Principle 10.)

**Talking point:** "This is the other differentiator: we don't just trust an officer's word that it's fixed — we cross-check fresh evidence against the original report."

---

### Step 8 — Notify (SMS) — ~15 seconds
**Action:** Presenter shows the mock/live SMS panel.

**Expected system behavior:**
- Citizen A receives a status notification at this stage (and, ideally, at prior stages if time allows a quick recap) — Submitted/Acknowledged/Ongoing/Resolved/Reopened lifecycle (DEC-23). Provider is UNDECIDED (DEC-24); mock SMS fallback used if no live provider is connected (PROPOSED-12).

**Talking point:** "Priya gets an SMS the moment it's marked resolved — she never has to check back manually."

---

### Step 9 — Confirm (Citizen) — ~25 seconds
**Action:** Switch to Citizen A's window. Citizen A sees the Resolved status and taps "Confirm Resolution."

**Expected system behavior:**
- Issue status updates to reflect citizen confirmation (Principle 11, DEC-22, REQ-12).
- (Optional closing beat, only if time remains) Briefly show the "reopen" button exists, without actually reopening, to indicate the capability without extending runtime.

**Talking point:** "And the loop closes with Priya, not with the officer — she has the final say that this is actually fixed."

---

### Step 10 — (Optional, time-permitting) Community View — ~15 seconds
**Action:** Show Citizen A or B's "nearby issues" map view.

**Expected system behavior:**
- Nearby unresolved aggregated Issues are shown without exposing other citizens' personal information (DEC-13, DEC-14).

**Talking point:** "And any citizen nearby can see this and other open issues on the map — without seeing who reported them."

---

## 5. Timing Summary

| Step | Duration | Cumulative |
|---|---|---|
| 1. Report (Citizen A) | 45s | 0:45 |
| 2. Categorise | 20s | 1:05 |
| 3. Route | 20s | 1:25 |
| 4. Second report / Merge | 40s | 2:05 |
| 5. Prioritise | 30s | 2:35 |
| 6. Resolve | 45s | 3:20 |
| 7. Verify | 20s | 3:40 |
| 8. Notify | 15s | 3:55 |
| 9. Confirm | 25s | 4:20 |
| 10. Community view (optional) | 15s | 4:35 |

Core script (Steps 1–9) fits in **~4:20**; Step 10 is a trim-first option to stay within a strict 4-minute limit, and Steps 2/3/7 (system-only steps) are the next candidates to compress into presenter narration over a single screen if time is tight.

---

## 6. Demo Data / Mock Elements

- **Chennai jurisdiction/demo data:** team-provided, explicitly labeled in the UI or presenter narration as non-official demo data (DEC-09, R-12) — never described as an authoritative government dataset.
- **Fixed demo coordinates:** one pothole location and one pre-seeded lower-priority Issue location, chosen in advance for reliable jurisdiction/duplicate matching.
- **Fixed demo weighting/thresholds:** duplicate-radius, risk-score weights, and resolution-verification tolerance are all UNDECIDED at the product level (PROPOSED-04, PROPOSED-05, PROPOSED-08) — the demo uses one fixed value for each, chosen by the team for a reliable run, not presented as final product values.
- **Mock SMS panel:** used only if no live SMS provider is integrated (PROPOSED-12); the choice between mock and live SMS is locked in before the demo, not decided live.
- **Pre-prepared photo assets:** used only as a fallback if live in-app camera capture is unreliable on demo hardware/network.

---

## 7. Fallback Handling

| Risk Point | Fallback |
|---|---|
| Live camera/GPS capture fails or is slow | Use pre-prepared photo + fixed demo coordinate; state this is the fallback path |
| AI categorisation service unavailable / low confidence | Fall back to a manual/default category so the flow continues (does not block submission) |
| Duplicate-detection/merge logic not reliable live | Pre-seed Citizen B's report as already merged; narrate the same logic over the resulting Issue |
| Risk/priority ordering doesn't visibly differ from seed data | Use the pre-seeded lower-priority Issue specifically chosen to rank below the demo Issue |
| Resolution geo/time cross-check unreliable live | Use fixed, rehearsed coordinates/timestamps for the officer's resolution evidence |
| SMS provider not integrated or fails live | Use the mock SMS panel instead, decided before the demo starts |
| Network/connectivity issue during the live demo | Fall back to the offline-capture path (if built) or a pre-recorded short clip of that one step, clearly announced as a recording |
| Any step exceeds its time budget | Drop Step 10 first, then compress presenter narration over Steps 2/3/7 into a single screen |

---

## 8. Explicitly Not Demonstrated

To protect the core end-to-end story from scope creep, this scenario does **not** attempt to demonstrate: multilingual voice input in multiple languages (only the FINAL/AGREED concept, not an exhaustive language sweep — open question #39 is unresolved), full offline-to-online sync under real network loss (shown only as a fallback/backup beat if built), spam/malicious filtering (PROPOSED-level, not finalized), heatmap/recurring-hotspot analytics (PROPOSED, exact calculation unresolved), or department performance metrics beyond what's directly visible on the officer dashboard during this walkthrough. These are intentionally out of the demo's critical path even where they exist in the build.
