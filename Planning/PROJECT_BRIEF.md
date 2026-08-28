# CivicFix — Crowdsourced Civic Issue Reporting & Resolution
### HackFusion 2026 — Project Brief & Build Spec

> Feed this file to Antigravity as project context at the start of a session so it has the full architecture, scope, and contracts without re-explaining from scratch.

---

## 1. Problem Statement (short form)

Citizens have no dependable way to report civic issues (potholes, garbage, broken streetlights, drains, footpaths). Complaints get lost, misrouted, or go unconfirmed. Municipal staff have no consolidated view of what's broken, where, and how urgent.

## 2. Differentiator (the pitch angle)

Existing solutions (Swachhata, SeeClickFix, BBMP apps) each solve one slice but share a common failure: **no trust layer**. Citizens report a real, documented complaint pattern — issues marked "resolved" with unrelated or fake photos, no escalation when ignored. CivicFix's core differentiator is **AI-verified, voice/WhatsApp-accessible reporting with photo-proof closure**:

- Voice-first reporting in regional languages (Sarvam AI) — no typing required
- AI auto-categorization + duplicate merging (Gemini)
- Before/after photo verification before a report can be closed
- Works offline, syncs when connectivity returns

---

## 3. MVP Scope (build this — 24hr realistic)

**Must-have (core demo path):**
1. Citizen: submit report (photo + GPS + short text/voice description)
2. Offline capture → auto-sync when online
3. AI categorization of report (type + severity) from photo+text
4. Auto-routing to correct department
5. Status timeline visible to citizen (Submitted → Acknowledged → In Progress → Resolved)
6. Push/SMS notification on status change
7. Citizen confirms or reopens a "resolved" report (photo-proof shown)
8. Municipal dashboard: map of open issues + list view + basic filters

**Should-have (if time allows):**
9. Duplicate detection (geo + time window clustering)
10. Basic spam/malicious filtering (rate limit + confidence threshold)
11. Recurring hotspot view (frequency heatmap by location)
12. Department SLA/backlog tracking widget

**Stretch / demo-fake-if-needed:**
13. WhatsApp bot channel
14. Full multilingual UI (do 2 languages properly, not all)
15. Gamification / civic score

**Explicitly out of scope for 24hrs:** custom ML model training, native mobile apps (PWA only), production-grade auth (use simple OTP/mock auth), payment/billing anything.

---

## 4. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend (citizen app) | React + Vite + Tailwind, PWA (Service Worker + IndexedDB) | Built in Google AI Studio Build mode |
| Frontend (municipal dashboard) | React + Leaflet.js + Recharts | Built in Google AI Studio Build mode |
| Backend | Node.js + Express (or FastAPI if team prefers Python) | Built in Antigravity |
| Database | PostgreSQL + PostGIS extension | PostGIS gives free geo-radius queries for duplicate detection |
| AI — categorization | Gemini API (Flash/Flash-Lite) | Free tier, multimodal (image+text in one call) |
| AI — multilingual voice/text | Sarvam AI (Saaras STT, Bulbul TTS, translation) | Free ₹1,000 signup credit; handles code-mixed Indian languages |
| Notifications | Web Push (PWA native) + Twilio SMS (optional) | |
| Image similarity (dup detection) | pHash (perceptual hashing) library | No API needed, rule-based |
| Hosting/demo | Any free static host for frontend + a single backend instance | Keep it simple, avoid infra rabbit holes |

**Integration rule:** Frontend and backend are built with different tools — they must only ever talk over the REST/JSON contract below. No shared types, no monorepo coupling. This is what makes splitting tools safe.

---

## 5. Data Model (core entities)

```
User
- id, phone_number, name (optional), language_pref, civic_score

Report
- id, reporter_id, category (enum), subcategory
- description_text, description_lang
- photo_url, photo_hash (for dup detection)
- lat, lng, address_text
- severity_score (0-100)
- status (submitted | acknowledged | in_progress | resolved | reopened)
- department_id
- duplicate_of_report_id (nullable)
- confirmation_count (citizens confirming it's a real/duplicate issue)
- created_at, updated_at

StatusUpdate
- id, report_id, status, note, photo_url (for resolution proof), updated_by, created_at

Department
- id, name, category_mapping (which issue types route here)

Notification
- id, user_id, report_id, channel (push|sms), message, sent_at
```

---

## 6. API Contract (v1 — lock this before parallel build starts)

```
POST   /api/reports                → create report (multipart: photo, text, lat, lng, lang)
GET    /api/reports/:id            → get single report + status history
GET    /api/reports?status=&dept=&bbox=  → list/filter reports (for dashboard map)
PATCH  /api/reports/:id/status     → update status (department staff only)
POST   /api/reports/:id/confirm    → citizen confirms resolution
POST   /api/reports/:id/reopen     → citizen reopens with reason
GET    /api/reports/duplicates/:id → get candidate duplicates for a report
GET    /api/departments            → list departments + mapping
GET    /api/analytics/backlog      → per-department pending counts + avg response time
GET    /api/analytics/hotspots     → recurring problem locations (lat/lng clusters + counts)
POST   /api/ai/categorize          → internal: photo+text → {category, severity, confidence}
```

**Standard response shape:**
```json
{ "success": true, "data": { }, "error": null }
```

**Report status enum (shared constant — both frontend and backend must use exactly this):**
`submitted | acknowledged | in_progress | resolved | reopened`

---

## 7. Team Roles

| Person | Owns | Primary tool |
|---|---|---|
| A | Citizen PWA: report flow, offline queue/sync, camera+GPS, status timeline, multilingual UI | Google AI Studio |
| B | Backend: schema, all REST endpoints, auth, department routing, notifications | Antigravity |
| C | AI layer: Gemini categorization pipeline, Sarvam voice integration, duplicate detection logic, spam/severity scoring — exposed to B via internal function calls or the `/api/ai/categorize` endpoint | Antigravity + Gemini/Sarvam APIs |
| D | Municipal dashboard (map, filters, backlog/SLA widgets, hotspot view) + PPT deck + demo script | Google AI Studio + slides |

---

## 8. 24-Hour Timeline (aligned to HackFusion schedule)

**Day 1 (Aug 27)**
- 10:00–11:00 — Team kickoff: lock scope above, confirm API contract, no more scope debate after this
- 11:00–4:00 PM — Parallel build sprints (see role table); D also builds PPT deck in parallel
- **4:00–5:00 PM — PPT Evaluation**
- 5:00 PM–12:00 AM — Continue builds + first full integration pass after dinner
- 12:00–7:25 AM — Differentiator features (photo-proof resolution, spam scoring) + bug fixing + demo data seeding. **Freeze new features by midnight.**

**Day 2 (Aug 28)**
- 8:30–9:30 AM — Mentor Evaluation (demo current state)
- 9:30–11:00 AM — Fix only what mentors flagged. Code freeze at 11:00.
- 11:00 AM–12:30 PM — Final Evaluation & Showcase
- 1:30–3:00 PM — Top 5 pitch to judges (if shortlisted)

---

## 9. Definition of Done for the Demo

Before calling anything "done," it must survive this walkthrough live:
1. Submit a report offline → go online → see it sync
2. Report gets auto-categorized correctly on screen within a few seconds
3. Dashboard map shows the new pin appear
4. Staff (or mocked staff view) changes status → citizen gets a notification
5. Staff marks resolved with a photo → citizen sees before/after → confirms or reopens
6. At least one duplicate report gets flagged/merged live

If any of these six breaks under demo conditions, fix that before adding anything new.
