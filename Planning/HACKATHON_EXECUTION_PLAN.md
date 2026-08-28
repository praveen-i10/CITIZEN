# CivicFix — Live Execution Plan
### HackFusion 2026 · Starting point: 12:00 PM, Day 1 (Aug 27)

This is the working plan for the remaining ~24 hours of the hackathon, phase by phase, with a per-person checklist for each block. Check off phases as you go — if a phase's "Done When" isn't met, that's the signal to cut scope, not to run over time.

---

## 0. Snapshot

| | |
|---|---|
| Current time | 12:00 PM, Day 1 |
| Next hard checkpoint | **PPT Evaluation — 4:00 PM (4 hrs away)** |
| Real coding time left before hacking ends | ~16.5 hrs (across two days, split by sleep/meals) |
| Hacking hard-stops | 11:00 AM, Day 2 |

**Team**
- **A** — Citizen App (frontend/PWA) — builds in Google AI Studio
- **B** — Backend/API — builds in Antigravity
- **C** — AI Layer (Gemini + Sarvam, duplicate/spam/severity logic) — builds in Antigravity
- **D** — Municipal Dashboard + Pitch Deck + Demo Lead — builds in Google AI Studio + slides

---

## Phase 0 — Rapid Kickoff (12:00–12:30 PM) · 30 min

Everyone in one room, laptops closed. No coding yet.

- [ ] Confirm MVP feature list out loud (see PROJECT_BRIEF.md §3) — no new ideas allowed after this point
- [ ] Confirm API contract (§6 of brief) — B reads it aloud, A and C both say "yes I can build against this"
- [ ] A and C agree on Gemini prompt shape (what JSON C's categorizer returns, so A knows what fields to render)
- [ ] D confirms deck outline (see §5 below) and starts immediately — D does not wait for this meeting to end fully

**Done when:** all 4 people can state the MVP list and the API contract from memory, without looking it up.

---

## Phase 1 — Lunch (12:30–1:15 PM)

- [ ] D keeps building the deck through lunch if needed (deck > food today)
- [ ] A/B/C mentally review their first task so they can start instantly at 1:15

---

## Phase 2 — Sprint 1: Foundation (1:15–2:00 PM) · 45 min

| Who | Task |
|---|---|
| A | Scaffold PWA project, camera + GPS capture screen (UI only, no backend wiring yet) |
| B | DB schema created + migrated (Postgres + PostGIS), skeleton Express/FastAPI routes returning mock data |
| C | Standalone test: send one sample photo to Gemini, confirm you get back category+severity JSON |
| D | Deck: Problem, Existing Solutions Gap, Our Differentiator, Architecture slides drafted |

**Done when:** B's routes respond (even with fake data), C has one successful Gemini API call logged, A has a camera screen that captures a photo.

---

## Phase 3 — Mentoring Session (2:00–3:00 PM)

- [ ] Bring current state (even if rough) — show, don't just describe
- [ ] Specifically ask mentors: "Is our duplicate-detection + photo-proof-resolution angle strong enough to stand out?"
- [ ] Write down every piece of feedback — triage after, not during

---

## Phase 4 — Sprint 2 + PPT Finalize (3:00–4:00 PM) · 1 hr

| Who | Task |
|---|---|
| A | Wire report form to B's mock endpoint, confirm a submission round-trips |
| B | Add auth stub (simple phone/OTP mock is fine) + department routing table |
| C | Wire Gemini output into a `/api/ai/categorize` shape matching the contract |
| D | Finalize deck fully, rehearse once out loud (even to an empty room), export to slides format |

**Done when:** D has a complete, presentable deck. This phase's output IS the next checkpoint — do not enter Phase 5 without it.

---

## Phase 5 — 🔴 PPT EVALUATION (4:00–5:00 PM)

- [ ] D presents
- [ ] A/B/C stand by for technical questions from judges about feasibility
- [ ] Someone captures feedback in writing for the overnight triage

---

## Phase 6 — Sprint 3: Core Loop (5:00–6:30 PM) · 1.5 hrs

| Who | Task |
|---|---|
| A | Status timeline UI (Submitted → Acknowledged → In Progress → Resolved) |
| B | Real DB writes (replace mock data), notification stub triggered on status change |
| C | Connect real categorization output to B's report creation flow end-to-end |
| D | Start dashboard: Leaflet map + marker rendering from B's `/api/reports` endpoint |

**Done when:** a report submitted by A actually appears with a real AI-assigned category in B's database.

---

## Phase 7 — Sprint 4: Feature Build (6:30–8:15 PM) · 1.75 hrs

| Who | Task |
|---|---|
| A | Offline queue (IndexedDB) — capture while offline, auto-sync on reconnect |
| B | Duplicate-detection query (PostGIS geo-radius + time window) |
| C | Sarvam integration: voice input → text → into the same report flow |
| D | Backlog/SLA widgets on dashboard (pending count per department) |

**Done when:** you can turn off wifi on A's device, submit a report, turn wifi back on, and watch it sync.

---

## Phase 8 — Dinner (8:15–9:00 PM)

- [ ] Quick standup over food: what's working end-to-end right now, what's still broken
- [ ] Agree on the overnight priority order together (don't let 4 people silently diverge)

---

## Phase 9 — Sprint 5: Full Integration Pass (9:00 PM–12:00 AM) · 3 hrs

**All 4 people, one shared screen or same table.** This is the most important block of the whole hackathon.

- [ ] Walk the full path live: submit → categorize → route → appear on dashboard → status change → notify → confirm/reopen
- [ ] Fix every break as it's found, in order encountered — don't jump around
- [ ] Do not start new features until this full loop works at least once, ugly is fine

**Done when:** the 6-step Definition of Done in PROJECT_BRIEF.md §9 passes once, even roughly.

---

## Phase 10 — Sprint 6: Differentiators (12:00–3:00 AM) · 3 hrs

Only touch this phase if Phase 9 is genuinely done.

| Who | Task |
|---|---|
| A | Before/after photo confirm/reopen screen |
| B | Notification polish (push working reliably) |
| C | Spam/severity scoring heuristics, duplicate-merge UI hook |
| D | Recurring hotspot view on dashboard |

**🛑 Hard rule: freeze all new features at 12:00 AM sharp regardless of where each person is.** Anything unfinished at freeze time either ships as-is (hidden if broken) or gets cut from the demo script — it does not get "just 20 more minutes."

---

## Phase 11 — Buffer / Rest Rotation (3:00–5:00 AM) · 2 hrs

- [ ] Rotate: 2 people keep fixing bugs, 2 people rest — swap at the halfway point
- [ ] No new features, bug fixes only
- [ ] Seed realistic fake historical data now (for hotspot view + dashboard to look populated, not empty)

---

## Phase 12 — Sprint 7: Final Bugs + Demo Data (5:00–7:25 AM) · 2.4 hrs

- [ ] Full team back together
- [ ] Re-run the 6-step Definition of Done end to end, cleanly this time
- [ ] Prepare a backup: screen recording of the working demo, in case live wifi/API fails during evaluation

---

## Phase 13 — Breakfast (7:25–8:30 AM)

- [ ] Decide who demos which part in the mentor evaluation

---

## Phase 14 — 🔴 MENTOR EVALUATION (8:30–9:30 AM)

- [ ] Demo current state honestly — mentors give the last real feedback before final judging
- [ ] Write down anything flagged as broken or confusing

---

## Phase 15 — Final Polish (9:30–11:00 AM) · 1.5 hrs

- [ ] Fix **only** what mentors flagged as critical
- [ ] No new features, no refactors, no "while I'm in here" changes
- [ ] Rehearse the final demo script once, timed

---

## Phase 16 — 🔴 HACKING ENDS (11:00 AM) → Final Evaluation & Showcase (11:00–12:30 PM)

- [ ] Code is frozen the moment 11:00 hits
- [ ] D leads demo, A/B/C on standby for technical questions

---

## Phase 17 — Lunch (12:30–1:15 PM)

- [ ] If shortlisted for Top 5: rehearse the judge pitch, tighten to time limit

---

## Phase 18 — Top 5 Pitch to Judges (1:30–3:00 PM)

- [ ] D presents, team supports with technical depth on questions

---

## Phase 19 — Results (3:30–4:00 PM)

🎉

---

## Communication Protocol

- **Standup every 3 hours** (even a 2-minute one): what's done, what's blocked, what's next
- If anyone is blocked for more than 20 minutes, say so out loud immediately — don't quietly struggle
- Keep the API contract doc open on a shared screen/tab all day — it's the single source of truth when A/B/C disagree on a field name or shape

## Fallback Rules

- If a feature isn't integrated by the freeze time in its phase, it gets **demoed as a mock/screenshot**, not left half-broken in the live app
- Always have a recorded backup demo video by Phase 12 — wifi/API failures during live judging are common and shouldn't cost you the round
- Judges reward a smaller thing that works over a bigger thing that's flaky — when in doubt, cut scope, not stability
