# CivicFix — Feature Addendum v2
### WhatsApp Bot · Non-Picturable Issue Verification · Location Alerts · Dashboard Backlog

This supplements PROJECT_BRIEF.md, HACKATHON_EXECUTION_PLAN.md, and TECHSTACK_FEATURES_FEASIBILITY.md — it does not replace them. Read this alongside the original feature matrix.

---

## 1. New/Changed Features — Feasibility Verdicts

| Feature | Verdict | Hackathon-scoped version | Complexity | Priority |
|---|---|---|---|---|
| WhatsApp reporting bot | ✅ Feasible | Menu-driven bot (numbered replies) via Twilio WhatsApp Sandbox, hits existing REST API | Medium | **Promoted to P0** (was P2) |
| Officer-initiated report for non-picturable issues (power cuts, water outage) | ✅ Feasible | New issue subtype, text/voice + area radius instead of pinpoint photo | Medium | P1 |
| Community/reporter verification of officer-marked resolution | ✅ Feasible | Verification request sent to original reporter + others who reported/upvoted same cluster | Medium | P1 |
| Location-based serious-issue alerts | ⚠️ Feasible only in simplified form | Foreground geofence check ("near an active alert"), not real-time travel/route tracking | Medium (simplified) / High (full) | P1 (simplified) |
| Dashboard: community issues viewing section | 📋 Backlog | Not built this cycle | — | Later |
| Dashboard: cluster/anomaly detection ("many issues = one root cause") | 📋 Backlog | Not built this cycle — natural extension of existing hotspot feature | — | Later |

---

## 2. WhatsApp Bot — Build Spec

**Why it's feasible fast:** it's not a new system, it's a new client for the API you already built. No new backend logic needed beyond a webhook adapter.

**Flow (menu-driven, like RBI/govt bots):**
```
User texts anything → Bot replies:
"Welcome to CivicFix. Reply with a number:
1. Report a new issue
2. Check status of a report
3. Confirm/reopen a resolved issue"

[1] → "Send a photo of the issue (or type 'skip' if not applicable)"
    → "Share your location" (WhatsApp native location-share button)
    → "Describe the issue in a few words (voice note or text OK)"
    → Bot confirms: "Report #1234 submitted. Category: Pothole. You'll be notified on status changes."

[2] → "Enter your report ID, or reply 'last' for your most recent report"
    → Bot returns current status

[3] → shows before/after photos, replies "Confirm" or "Reopen"
```

**Technical notes:**
- Twilio WhatsApp Sandbox for the demo — no business approval needed, judges/mentors can join the sandbox with a one-time code to test live
- Photo/voice media arrives as a Twilio media URL → download → feed into the same Gemini/Sarvam pipeline A and C already built
- Location arrives as a WhatsApp location pin → lat/lng directly, no geocoding needed
- This bot hits your existing `POST /api/reports`, `GET /api/reports/:id`, `POST /api/reports/:id/confirm` — **no new backend endpoints required**, only a webhook handler that translates WhatsApp messages into those same API calls

**Owner:** C (since it's mostly wiring existing AI pipeline + API to a new input channel), with B exposing a `/webhook/whatsapp` route.

---

## 3. Non-Picturable Issues + Community Verification — Build Spec

### 3.1 Issue subtype change
Add a flag on report creation: `requires_photo: boolean` (false for categories like power_outage, water_supply, gas_leak). When false, the report form/bot skips the photo step and instead asks for:
- Text/voice description
- An **area** rather than a pinpoint — either a radius around the GPS point, or a locality/landmark name (power cuts affect a zone, not a single spot)

### 3.2 Verification workflow
New status: `pending_verification` (inserted between `in_progress` and `resolved`).

```
Officer marks work complete
   → status becomes `pending_verification`
   → system sends a verification request to:
       (a) the original reporter, AND
       (b) anyone else who reported or upvoted the same issue cluster
   → each recipient can reply Confirm or Reopen (via app, or WhatsApp bot if that's how they engage)
   → if majority (or first-N) confirm → status auto-becomes `resolved`
   → if anyone reopens → status reverts to `in_progress`, officer notified with reopen reason
```

This is a meaningful trust upgrade over single-reporter confirmation — worth stating explicitly in your pitch: **"multi-party verification, not officer's word alone."**

### 3.3 Data model additions
```
Report (add fields)
- requires_photo: boolean
- affected_radius_m: integer (nullable, for area-type issues)

VerificationRequest
- id, report_id, recipient_user_id, response (pending|confirmed|reopened), responded_at
```

### 3.4 API additions
```
POST /api/reports/:id/mark-complete        → officer marks work done, triggers verification requests
POST /api/reports/:id/verify                → recipient responds {confirm|reopen, reason?}
GET  /api/reports/:id/verification-status   → see how many confirmed/reopened so far
```

**Owner:** B (workflow/status logic) + A (verification UI/notification handling) + C (identifying "nearby community members" via the same geo-cluster logic already built for duplicate detection — this reuses Section 3 of the feasibility doc, no new algorithm needed).

---

## 4. Location-Based Serious-Issue Alerts — Build Spec (Simplified)

### 4.1 What NOT to build
Real-time continuous location tracking with route/travel prediction — this needs background geolocation permissions that PWAs (especially iOS Safari) don't reliably support, plus meaningful battery/privacy engineering. Not a 24hr feature. Don't attempt it live.

### 4.2 What to build instead
**Foreground geofence check + opt-in alert zones:**
- User can save 1–2 "watch locations" (e.g., home, commute area) — simple lat/lng + label, entered manually
- On app open (or periodic check while app is in foreground), compare user's current or saved locations against active `severity=high` reports within a radius (e.g., 1km)
- If a match exists → push notification: *"⚠️ Active power line issue 600m from [your saved location]. Avoid the area if possible."*
- **Demo trick:** pre-seed one high-severity "electric line down, rainy day" report near a location you'll set as the demo device's current position, then open the app live in front of judges to trigger the alert — this sells the concept without needing real background tracking.

### 4.3 Data model additions
```
WatchLocation
- id, user_id, label, lat, lng, radius_m

Alert
- id, report_id, watch_location_id, user_id, message, sent_at, acknowledged (boolean)
```

### 4.4 API additions
```
POST /api/watch-locations          → user saves a location to monitor
GET  /api/watch-locations          → list user's saved locations
GET  /api/alerts/check             → (called by client on app open) returns any new nearby high-severity alerts
POST /api/alerts/:id/acknowledge   → user dismisses an alert
```

**Owner:** A (foreground check + push trigger UI) + C (severity threshold logic — reuses the severity-vector scoring already defined, just adds a proximity trigger on top).

**Framing for judges:** be upfront that this is a foreground/opt-in MVP of a feature that would use background geofencing in a full production build — that honesty reads better than overclaiming real-time tracking and getting caught in Q&A.

---

## 5. Dashboard — Backlog (not built this cycle, documented for the pitch roadmap slide)

| Feature | What it does | Why it matters |
|---|---|---|
| Community issues viewing section | Public-facing view of nearby open issues, separate from the internal staff dashboard | Transparency/accountability angle — citizens see their area's status without needing to file anything |
| Cluster/anomaly detection | If N reports of different categories cluster tightly in space+time (e.g., potholes + water pooling + cracked footpath, all in one 100m stretch), flag it as a **possible single root cause** (e.g., underground pipe leak) rather than N unrelated issues | Turns the platform from a complaint log into a planning tool — directly serves the "surface recurring problem locations for planning" requirement, but at a smarter, cross-category level |

Mention both explicitly in your pitch deck's "Roadmap" slide — judges respond well to teams that show they know what's next without having tried to cram it all into 24 hours.

---

## 6. Updated Ownership Summary (net effect of this addendum)

| Person | Original load | Added load |
|---|---|---|
| A | Citizen PWA, offline sync, status UI | Verification response UI, watch-location settings, foreground alert trigger |
| B | Backend, routing, notifications | `mark-complete`/`verify` endpoints, WhatsApp webhook route, watch-location/alert endpoints |
| C | Gemini/Sarvam pipeline, duplicate detection | WhatsApp bot conversation logic, community-member lookup (reuses cluster logic), alert severity threshold |
| D | Dashboard, pitch deck | Add roadmap slide (community view + anomaly detection) — no new build load |

**Net time impact:** this addendum adds real scope. If Phase 6 onward (per HACKATHON_EXECUTION_PLAN.md) is already tight, treat the WhatsApp bot and verification workflow as the priority adds, and the location-alert feature as the one to cut first if the overnight sprint runs behind — it's the most demo-fakeable of the three without losing pitch credibility.
