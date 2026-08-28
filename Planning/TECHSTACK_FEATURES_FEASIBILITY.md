# CivicFix — Tech Stack, Feature Matrix, Vector Strategy & Feasibility
### Reference Document — HackFusion 2026

> Note on scope: "vectors" is interpreted below in its technical sense — the embedding/similarity-vector techniques used for duplicate detection, severity scoring, and semantic matching (not marketing "growth vectors"). A short abuse-vector (spam/attack surface) section is also included since it's directly relevant to the "filter spam/malicious reports" requirement.

---

## 1. Full Tech Stack

### 1.1 Frontend

| Component | Choice | Why | Alternative if blocked |
|---|---|---|---|
| Citizen app framework | React + Vite + Tailwind (PWA) | Fast scaffold, installable without app store, camera/GPS via browser APIs | Plain HTML/JS if React setup stalls |
| Offline storage | IndexedDB (via `idb` library) + Service Worker | Native browser support, no backend dependency for queued reports | LocalStorage (simpler, smaller capacity, fine for demo) |
| Municipal dashboard | React + Leaflet.js + Recharts | Free maps with clustering, free charts, no API key needed for Leaflet+OSM tiles | Google Maps JS API (needs key + billing awareness) |
| Build/dev tool | Google AI Studio (Build mode) | Free full-stack vibe coding, exports React/Next, can deploy straight into Antigravity | Manus.ai or manual scaffolding |
| Push notifications | Web Push API (native PWA) | No extra service needed | Firebase Cloud Messaging |

### 1.2 Backend

| Component | Choice | Why |
|---|---|---|
| Runtime/framework | Node.js + Express (or FastAPI/Python) | Fastest to wire REST endpoints; pick whichever your backend dev is stronger in |
| Database | PostgreSQL + PostGIS extension | Free geospatial radius queries (`ST_DWithin`) — critical for duplicate detection and hotspot clustering without hand-rolled geo-math |
| Auth | Simple OTP/phone mock (JWT session) | Real OTP delivery isn't worth the setup time in 24h; mock it convincingly |
| File storage | Local disk / S3-compatible bucket (or base64 in DB for demo) | Keep it simple; don't build a CDN pipeline for a hackathon |
| Notification dispatch | Web Push + Twilio SMS (optional, stretch) | Twilio free trial credits cover a demo's worth of SMS |
| Build tool | Antigravity (agent-first IDE) | Full-stack capable, browser subagent can test endpoints live |

### 1.3 AI / Intelligence Layer

| Task | API | Why | Cost |
|---|---|---|---|
| Photo + text categorization | Gemini API (Flash / Flash-Lite) | Multimodal in one call, generous free tier, no card required | Free tier |
| Severity estimation | Same Gemini call, extended prompt | One request returns both category and severity | Free tier |
| Voice input (regional languages) | Sarvam AI — Saaras (STT) | Built for Indian languages, handles code-mixed speech | ₹1,000 free signup credit |
| Text-to-speech (status readback) | Sarvam AI — Bulbul (TTS) | Natural Indian-language voices, low latency | Same free credit pool |
| Translation (UI/content) | Sarvam AI translation, or Gemini as fallback | Sarvam more accurate for Indian-language nuance | Same free credit pool |
| Image similarity (duplicate detection) | pHash (perceptual hash) — local library, no API | Rule-based, instant, free | Free (compute only) |
| Text similarity (duplicate detection) | Sentence embeddings (Gemini embedding endpoint or open-source `sentence-transformers`) | Catches duplicates worded differently ("pothole" vs "road has a hole") | Free tier / free if local |
| High-value reasoning (dashboard insight, judge-facing "smart" feature) | Claude or GPT (use sparingly) | Best reasoning quality; no ongoing free tier so ration it | ~$5 one-time trial credit |

### 1.4 Infra / Glue

| Component | Choice |
|---|---|
| API contract format | REST + JSON, versioned under `/api/` |
| Cross-tool integration | Strict shared contract (see PROJECT_BRIEF.md §6) — no shared types between frontend/backend tools |
| Hosting for demo | Any free static host (frontend) + single backend instance (Render/Railway free tier or local + tunnel) |
| Version control | Git repo, shared, frequent small commits during integration sprints |

---

## 2. Feature Matrix

Scored for a 24-hour build. **Feasibility** = how realistically it ships working in this hackathon. **Impact** = how much it affects the demo's perceived quality/differentiation.

| # | Feature | Priority | Complexity | Feasibility (24h) | Impact | Owner | Depends on |
|---|---|---|---|---|---|---|---|
| 1 | Report with photo, location, text | P0 | Low | ✅ High | High | A + B | — |
| 2 | Mobile + web, local language input | P0 | Medium | ✅ High | High | A | Sarvam |
| 3 | Offline capture + auto-sync | P0 | Medium | ✅ High | High (differentiator) | A | — |
| 4 | Auto-categorize from photo+text | P0 | Medium | ✅ High | High | C | Gemini |
| 5 | Route to responsible department | P0 | Low | ✅ High | Medium | B | Feature 4 |
| 6 | Detect & merge duplicates | P1 | High | ⚠️ Medium | High (differentiator) | C + B | PostGIS + embeddings |
| 7 | Filter spam/false/malicious reports | P1 | Medium | ⚠️ Medium | Medium | C | Feature 4 + heuristics |
| 8 | Prioritize by severity/location/reporters | P1 | Medium | ✅ High | Medium | C + B | Feature 4 |
| 9 | Live status to reporter | P0 | Low | ✅ High | High | A + B | — |
| 10 | Notify citizens at each stage | P0 | Low | ✅ High | Medium | B | Feature 9 |
| 11 | Confirm/reopen resolved issue | P0 | Medium | ✅ High | High (differentiator) | A + B | Feature 9 |
| 12 | Municipal map + dashboard | P0 | Medium | ✅ High | High | D | Feature 5 |
| 13 | Track dept response times/backlog | P1 | Medium | ⚠️ Medium | Medium | D | Feature 5, 9 |
| 14 | Surface recurring problem locations | P1 | Medium | ⚠️ Medium | High (planning angle) | D + C | PostGIS clustering |
| 15 | Usable by low digital-familiarity citizens | P0 | Medium | ✅ High | High | A | Voice input (Sarvam) |
| 16 | Voice-first reporting (differentiator) | P1 | Medium | ⚠️ Medium | Very High | A + C | Sarvam STT |
| 17 | Before/after photo verification (differentiator) | P0 | Low-Medium | ✅ High | Very High | A + B | Feature 11 |
| 18 | WhatsApp reporting channel | P2 | High | ❌ Low (stretch only) | High (if it works) | — | Twilio WhatsApp sandbox |
| 19 | Civic score / gamification | P2 | Low | ✅ High (easy but skip if tight) | Low-Medium | A | — |

**Legend:** P0 = must ship, P1 = build if on schedule, P2 = only if hours remain / fake it in the deck.

**Read on this matrix:** Features 3, 11, 16, 17 are your differentiators — they're the ones judges won't have seen in Swachhata/SeeClickFix demos. If time runs short, protect these four over any P1 feature; a working offline-sync + photo-verified-resolution demo beats a half-built duplicate-merge engine.

---

## 3. Vector-Based Techniques Used in the System

### 3.1 Image similarity vectors (visual duplicate detection)
- Every uploaded photo is reduced to a **perceptual hash (pHash)** — a fixed-length bit vector representing the image's visual structure, robust to minor cropping/lighting differences.
- Two reports are flagged as visually similar if their pHash vectors have a **Hamming distance below a threshold** (commonly ≤10 bits out of 64).
- No API call needed — this runs locally, instantly, at zero marginal cost. Good for judges: shows you understand a real CV technique, not just "we called an AI API."

### 3.2 Text embedding vectors (semantic duplicate detection)
- Report descriptions are converted into **dense embedding vectors** (via Gemini's embedding endpoint, or a local `sentence-transformers` model if you want zero API dependency).
- Two reports are candidate duplicates if their **cosine similarity** exceeds a threshold (e.g., >0.85) — this catches cases pHash misses, like "pothole near bus stop" vs "road has a big hole outside the bus stand," which are worded differently but semantically identical.
- **Combined duplicate signal** = geo-proximity (PostGIS) AND (image vector match OR text vector match) AND within a time window. This three-signal combination is more defensible in a judge Q&A than any single check alone.

### 3.3 Severity scoring vector
Rather than a single opaque number, represent severity as a **weighted feature vector** combined into one score:

```
severity_score = w1*(photo_damage_estimate)
               + w2*(reporter_count, log-scaled)
               + w3*(proximity_to_sensitive_zone: school/hospital)
               + w4*(category_base_urgency)
```

- `photo_damage_estimate` comes straight from the Gemini categorization call (ask it to also return a 0–100 severity estimate in the same JSON response — no extra API call).
- `proximity_to_sensitive_zone` — even a small static list of school/hospital coordinates for the demo area, checked via PostGIS distance, is enough to show the concept working live.
- Exposing this as a transparent weighted vector (not a black box) is a good answer if judges ask "how do you decide priority?"

### 3.4 Abuse/spam vectors (attack surface + mitigations)

| Abuse vector | Mitigation |
|---|---|
| Fake/spam report flooding | Rate limit per device/session; require photo (raises effort bar) |
| GPS spoofing | Cross-check photo EXIF GPS (if present) against reported location; flag mismatches |
| Vision model can't identify a plausible civic issue | Low Gemini confidence score → auto-flag for manual review instead of auto-publishing |
| Fake "resolved" closure (the real complaint pattern seen in Swachhata reviews) | Require a resolution photo; before/after slider shown to citizen before they can confirm closure |
| Duplicate spam to inflate a report's priority | Confirmation/upvote counted once per unique device/account, not per submission |

---

## 4. Feasibility Assessment

### 4.1 Overall verdict
**Feasible for a 24-hour build**, provided scope discipline holds. The P0 row of the feature matrix (10 features) is achievable by a 4-person team with the tools/stack above — none of it requires training custom models, which is the single biggest time sink teams fall into at this kind of hackathon.

### 4.2 Feasibility by risk tier

| Tier | Features | Risk | Reasoning |
|---|---|---|---|
| **Low risk — will work** | Report submission, categorization, routing, status timeline, notifications, map/dashboard, before/after resolution | Straightforward CRUD + one API call per feature; no novel engineering | 
| **Medium risk — budget real time** | Offline sync, duplicate detection (geo+vector), severity scoring, voice input | Each is a real technical feature with edge cases (sync conflicts, threshold tuning, audio format handling) — allocate full sprint blocks, not "quick add-ons" |
| **High risk — treat as stretch/fake-if-needed** | WhatsApp bot, full multilingual coverage across all screens, recurring-hotspot predictive modeling | Each pulls in external service setup (Twilio approval delays) or needs more polish time than 24h affords for full quality — demo with 1-2 languages done well, or a static mock, rather than attempting full breadth |

### 4.3 Cost feasibility
Total API cost to run the entire hackathon demo: **effectively $0**, using:
- Gemini free tier (Flash/Flash-Lite) for all categorization/severity calls
- Sarvam AI's ₹1,000 free signup credit for all voice/translation calls
- Local pHash + embedding similarity (no API cost)
- Claude/GPT trial credit (~$5) reserved only for 1–2 "showcase" reasoning calls, if used at all

### 4.4 Biggest real risk (not technical)
The tightest constraint isn't the tech — it's **time-boxing scope creep during the overnight block**. Every feature in the medium/high-risk tiers above is individually buildable; the failure mode is trying to build all of them simultaneously instead of finishing the low-risk tier completely first. Follow the freeze rules in HACKATHON_EXECUTION_PLAN.md — they exist specifically to prevent this.
