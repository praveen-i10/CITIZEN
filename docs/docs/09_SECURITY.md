# 09_SECURITY.md

> Implements: security posture for 01_REQUIREMENTS.md (NFR-05, NFR-06, NFR-08), 02_USER_FLOWS.md (all flows), 03_FEATURE_SPEC.md (F-01–F-18).
> Depends on: 04_DATABASE.md (schema referenced throughout — no new tables/columns invented here beyond what §8 explicitly proposes as minimal additions), 05_API_CONTRACT.md (auth assumption in its §1, endpoints in §3–§6), 06_AI_SPEC.md (AI call handling), 07_MAP_GIS_SPEC.md (location handling).
> Scope discipline: this document secures the system that 01–07 already define. It does not add features, redesign flows, or pick UNDECIDED product items (auth mechanism, SMS provider, AI vendor) on the team's behalf — those remain UNDECIDED here too, with the prototype's actual stand-in stated explicitly.
> Style: for every control, **HACKATHON (build this)** vs **PRODUCTION (do not build, just document)** is called out separately.

---

## 1. Authentication (NFR-08 — UNDECIDED at product level)

**Status:** No authentication mechanism is finalized anywhere in 01–07. `05_API_CONTRACT.md §1` already states the prototype convenience: an `X-Demo-User-Id` header (or equivalent seeded token) identifies the acting `users` row.

**HACKATHON:**
- Implement exactly what §1 of the API contract describes: a header carrying a seeded `users.id`. No password, no OTP, no real login screen.
- A simple pre-demo "select your persona" screen (pick one of the seeded citizen/officer/admin users) is enough to set this header client-side. This is a UI convenience, not authentication.
- The server must still **validate** that the `X-Demo-User-Id` corresponds to an existing row in `users` — reject unknown IDs with `401 UNKNOWN_DEMO_USER` (new error code, consistent with 05_API_CONTRACT.md §2 error shape). An unvalidated header is worse than none because it looks secure.
- Do not build a JWT scheme, session cookies, or password hashing for the 12h build — that time is better spent on the demoable flows. This is a deliberate scope cut, not an oversight.

**PRODUCTION (document only, do not build):**
- Real citizen auth: phone-number OTP (natural fit since `users.phone_number` already exists and is used for SMS), or a proper identity provider.
- Officer/admin auth: government SSO or a proper username/password + MFA system, issued by the municipal IT department, not self-registered.
- Session tokens (JWT or opaque, server-side revocable) replacing the demo header entirely.
- Rate-limited login attempts, account lockout, password policy (if passwords are ever used) — none of this applies to citizen OTP flows but would apply to officer/admin.

**UNDECIDED, explicitly not guessed here:** exact production auth provider/technology. Not this team's call to make inside a 12h build.

---

## 2. Authorization & Role Separation (Citizen / Officer / Admin)

`04_DATABASE.md §3.1` fixes three roles via a `CHECK` constraint: `citizen`, `officer`, `admin`. `05_API_CONTRACT.md` already annotates every endpoint with an expected role. This section makes the enforcement explicit and buildable.

### 2.1 Role Check (HACKATHON — MUST BUILD)
- A single shared middleware/function, run on every request:
  1. Resolve `X-Demo-User-Id` → `users` row (§1).
  2. Compare `users.role` against the endpoint's declared required role (05_API_CONTRACT.md's per-endpoint `Role:` annotations). Mismatch → `403 FORBIDDEN_ROLE`.
- **Do this once, centrally.** Do not re-implement role checks per-route; a missed one is a real vulnerability even in a demo (e.g., a citizen calling an officer-only resolve endpoint).

### 2.2 Ownership / Scoping Check (HACKATHON — MUST BUILD)
Role alone is not enough — several endpoints need row-level scoping already implied by 05_API_CONTRACT.md:
- **Citizen endpoints** (`GET /complaints/mine`, `GET /complaints/{id}`, `POST /complaints/{id}/category-override`, `POST /complaints/{id}/duplicate-decision`, `POST /issues/{id}/confirm-resolution`, `POST /issues/{id}/reopen`): the acting citizen must be the `reporter_user_id` on the complaint (or a linked reporter on the issue for issue-level actions). Enforce with a `WHERE reporter_user_id = :caller_id` clause or an explicit ownership check before any mutation — never trust a client-supplied ID alone. Violation → `403 NOT_YOUR_COMPLAINT`.
- **Officer endpoints** (`GET /officer/dashboard`, `GET /officer/issues/{id}`, acknowledge/start-work/resolve): scope to the officer's own `department_id`/`jurisdiction_zone_id` (already specified in 05_API_CONTRACT.md §4.6 as `403 OUTSIDE_JURISDICTION`). Build this check — it is a named, expected error code in the contract, not optional.
- **Admin endpoints:** city-wide, no zone scoping — matches 05_API_CONTRACT.md §5 (admin is "view/oversight," per 03_FEATURE_SPEC.md Part C, no fine-grained admin permission model). Just require `role='admin'`; do not invent finer admin permission tiers (that would be adding scope, which this document must not do).

### 2.3 What Is Explicitly Not Built (PRODUCTION consideration only)
- Fine-grained admin permission levels — `03_FEATURE_SPEC.md` Part C already marks this **OUT OF SCOPE**; this document does not reopen it.
- Delegated/temporary role grants (e.g., an officer covering another zone) — reassignment mechanism is UNDECIDED per 05_API_CONTRACT.md §4.6; security cannot invent a mechanism the product spec doesn't have. Document as a production gap only.

---

## 3. API Security

### 3.1 Transport (HACKATHON)
- Local prototype (NFR-02: local-only operation) — HTTPS is not required for the local demo but **use `http://localhost` only, never bind to `0.0.0.0`/public interfaces** during the demo, to avoid accidentally exposing the unauthenticated-by-design API on a shared network (e.g., hackathon venue Wi-Fi).
- **PRODUCTION:** TLS everywhere (HTTPS/WSS), HSTS, no plaintext transport, ever.

### 3.2 Request Validation (HACKATHON — MUST BUILD)
- Every endpoint in 05_API_CONTRACT.md §3–§5 must validate its documented required fields server-side before touching the database — the contract already lists required/conditional fields per endpoint (e.g., §3.1's table). A client cannot be trusted to enforce "photo required" or "GPS required unless offline" — the server must re-check what 05_API_CONTRACT.md §3.1 steps 1–2 describe.
- Reject unknown/extra fields silently ignored is acceptable; do not reject the whole request for extra fields (keeps client iteration fast during the hackathon), but never trust extra fields for anything security-relevant (e.g., a client-supplied `role` or `reporter_user_id` in the body must be ignored — those come from the resolved session/header only, per §1–§2 above).
- Enum fields (`final_category`, `role`, status values) must be validated against the fixed lists in 04_DATABASE.md §5 server-side, not just client-side dropdowns — 06_AI_SPEC.md §2.5 already specifies this for AI-suggested category ("any unrecognized value is coerced to `other`"); apply the same discipline to every enum column.
- Status transitions: enforce the transition table in 05_API_CONTRACT.md §6.1 centrally (one function, not per-endpoint), returning `409 INVALID_STATUS_TRANSITION` as already specified. This is both a correctness and a security control — it prevents e.g. a compromised/buggy client forcing `submitted → resolved` directly.

### 3.3 Rate Limiting (HACKATHON — MINIMAL; PRODUCTION — FULL)
- **Hackathon:** not a priority given local-only, single-demo-audience use (NFR-02); skip general API rate limiting. The one exception is the suspicious-submission heuristic already required by F-07 (§6.2 below), which is a product feature, not infra-level rate limiting, and must still be built.
- **Production:** standard IP/user-based rate limiting on all public endpoints, especially `POST /complaints` and the AI-proxying endpoints (§6 below), to prevent both abuse and runaway AI API cost.

### 3.4 CORS (HACKATHON)
- Since the client is a single responsive web app served locally, a permissive local CORS policy (`localhost` origin only) is fine. Do not leave `*` origin enabled if the server could ever be reachable beyond localhost during the demo.

---

## 4. Input Validation & File Upload Security

`05_API_CONTRACT.md §2` already constrains uploads: `multipart/form-data`, max photo 8MB, types `image/jpeg`/`image/png`, max audio 60s. Security must enforce these, not just document them.

### 4.1 Photo Upload (HACKATHON — MUST BUILD)
- **Server-side** re-check of file size (≤8MB) and MIME type — do not rely on the client's `Content-Type` header alone; sniff actual file bytes (magic-number check) for `image/jpeg`/`image/png` before accepting. A mismatched/spoofed extension is a classic upload attack vector even in a prototype.
- Store uploaded photos **outside** any web-servable static root, or under a randomly generated filename (not the client-supplied filename) to prevent path traversal (`../../etc/passwd`-style names) and to avoid directory-listing exposure. `complaints.photo_path` / `resolution_evidence.photo_path` (04_DATABASE.md §3.5/§3.6) should store this generated path, not client input.
- Serve photos back only through an authenticated endpoint that re-checks ownership/role scoping (§2.2) — never a raw static file path exposed to the internet/LAN, since photos may appear in officer/admin evidence views containing citizen-linked content.
- Do **not** execute, parse, or transform uploaded files with any tool that interprets file content beyond basic image validation (no ImageMagick pipelines with untrusted transforms, no EXIF-parsing library with known CVEs left unpatched) — keep the EXIF read (06_AI_SPEC.md / 07_MAP_GIS_SPEC.md §3) to a well-maintained library.

### 4.2 Audio Upload (Voice Input, HACKATHON)
- Same size/type/magic-number discipline as photos, scoped to the 60s / `audio/webm`|`audio/wav` limits already in 06_AI_SPEC.md §3.3.
- Audio is forwarded to Sarvam AI (06_AI_SPEC.md §3) and, per that spec, is not stored beyond what's needed to obtain the transcript — do not persist raw audio files longer than necessary for the demo; only the resulting `description_text` / `voice_language_code` need to persist (04_DATABASE.md §3.5).

### 4.3 Text Fields (HACKATHON — MUST BUILD)
- `description_text`, reopen `note`, and any free-text field: enforce a reasonable max length server-side (e.g., a few thousand characters) to prevent trivial DB/storage abuse.
- Treat all text as untrusted when rendering in any admin/officer UI — standard output-encoding/escaping (XSS prevention) in whatever templating/React rendering is used. This is a "just don't dangerously-set-inner-HTML on user text" rule, cheap to follow, easy to forget under time pressure.
- Since 04_DATABASE.md specifies plain parameterized queries (no ORM) — **always use parameterized/prepared statements, never string-concatenated SQL**, for every query touching citizen input. This is the single highest-value, lowest-effort control in the entire document; SQL injection is fully preventable in a 12h SQLite build with zero feature cost.

### 4.4 What Is Not Built (PRODUCTION)
- Antivirus/malware scanning of uploaded images.
- Content-moderation (e.g., detecting offensive/irrelevant photos) — out of scope; not requested by any FR.

---

## 5. Location / GPS Data Privacy

Location is central to this system (FR-01, FR-06, FR-07, FR-19) and also the most sensitive personal-data field alongside identity.

### 5.1 Precision at Rest (HACKATHON)
- Store full-precision GPS as already specified (04_DATABASE.md §3.5 `device_gps_lat/lng`) — precision is needed for jurisdiction lookup and duplicate detection (07_MAP_GIS_SPEC.md §4–§5) and cannot be truncated without breaking those features. Do not add fuzzing here; it would silently break FR-06/FR-07 acceptance criteria, which this document must not do.

### 5.2 Precision in Citizen-Facing Aggregate Views (HACKATHON — MUST BUILD)
- `GET /issues/nearby` (05_API_CONTRACT.md §3.7) already returns per-Issue `lat/lng` at full precision for map pins — this is acceptable because it's an *aggregated Issue* location (a public civic problem's location, e.g. "this pothole is here"), not a citizen's home/identity. No change needed beyond what §7 of the API contract already enforces (no reporter identity fields in that response).
- Confirm at build time that no citizen's **own device location outside of an active report** (e.g., "browsing nearby" location) is ever persisted or logged beyond the request needed to compute distance. Use it in-memory for the query, do not write a `browse_location_log` table — none exists in 04_DATABASE.md and none should be added.

### 5.3 EXIF Handling (HACKATHON)
- EXIF GPS is read only for the supplementary cross-check already specified (07_MAP_GIS_SPEC.md §3–§4, 04_DATABASE.md §3.5 `photo_exif_lat/lng`, `exif_gps_match`) — never surfaced to any other citizen, and only used as a background signal, consistent with Principle 3. No additional EXIF metadata (device model, etc.) should be extracted or stored beyond lat/lng — avoid scope creep into a metadata-mining feature nobody asked for.

### 5.4 Production Considerations (document only)
- Geofencing/precision-reduction policy for any future public "explore the map" feature beyond the current aggregated Issue view.
- Retention limits on raw GPS trails (not applicable here — the system only ever stores point-in-time capture locations, no continuous tracking, per 07_MAP_GIS_SPEC.md §10 "No real-time officer location tracking").

---

## 6. Personal Data Protection

### 6.1 What Personal Data Exists
Per 04_DATABASE.md: `users.display_name`, `users.phone_number` (citizen and officer), complaint-level location/photo/description tied to a `reporter_user_id`.

### 6.2 Citizen-Facing Aggregate Views Must Exclude Personal Data (HACKATHON — MUST BUILD, NFR-06)
- `05_API_CONTRACT.md §3.7`/`§7` already specifies the exact fields that must **never** appear in `GET /issues/nearby` or any other citizen aggregate endpoint: `reporter_user_id`, reporter name/phone, individual `complaints` rows, citizen-tied `photo_path`. Implement this as an **explicit response allow-list** (only return the named fields: `issue_id, category, status, priority_band, lat, lng, complaint_count`), not a deny-list of "fields to strip." An allow-list is safer under time pressure — a forgotten new column added later to `issues` cannot leak through an allow-list, but could through a deny-list.
- Add a lightweight test (even a manual pre-demo checklist item, §11) that hits `GET /issues/nearby` and asserts none of the excluded fields are present in the raw JSON.

### 6.3 Officer/Admin Views (HACKATHON)
- Officer/admin endpoints *may* show complaint-level personal data (05_API_CONTRACT.md §7), but only within the officer's own jurisdiction (§2.2 above) and never across departments/zones.
- Do not add any feature exposing citizen contact info to other citizens (e.g., no citizen-to-citizen messaging) — none is specified, so none is built.

### 6.4 Data Minimization (HACKATHON)
- Seed only the minimum demo citizen users needed (04_DATABASE.md §6: 3–5 citizen users) with obviously fake phone numbers/names — do not use any real person's data in seed data, including team members' actual phone numbers, to avoid accidental real-SMS-attempt or accidental personal exposure during the demo/recording.

### 6.5 Production Considerations (document only)
- Data retention/deletion policy (citizen right to erasure) — not addressed by any FR; explicitly out of scope for a 12h prototype, flagged for a real deployment's legal/compliance review.
- Encryption at rest for the SQLite file containing personal data.
- A formal DPA/privacy-policy surface for a real citizen-facing government app.

---

## 7. API Keys & Environment Secrets

Two external services are in play per 06_AI_SPEC.md: the categorisation AI service (PROPOSED vendor, e.g. Gemini-class) and Sarvam AI (FINAL for voice-to-text).

### 7.1 HACKATHON — MUST BUILD
- All API keys (AI categorisation vendor, Sarvam AI, and a real SMS provider **only if** that OPTIONAL stretch goal per 03_FEATURE_SPEC.md is attempted) live in a local `.env` file, loaded via environment variables — **never hard-coded in source, never committed to git.**
- Add `.env` (and any `.env.local`) to `.gitignore` **before the first commit** that would otherwise include it. If the repo is public (e.g., pushed to GitHub for hackathon submission), a leaked key is a real, immediate cost/abuse risk even for a demo project.
- Provide a `.env.example` with placeholder keys/names only, so teammates know what to fill in without exposing real values.
- All AI/SMS calls happen **server-side only** (already implied by 05_API_CONTRACT.md §3.1 steps 3–4 being server-driven) — the browser client never holds or calls out with a raw API key directly. This is both a security control and consistent with the existing architecture; no change needed, just discipline to not accidentally inline a key in frontend code for a "quick fix" under time pressure.

### 7.2 PRODUCTION Considerations (document only)
- Secret manager (e.g., cloud KMS/secrets vault) instead of `.env` files.
- Key rotation policy, per-environment key separation (dev/staging/prod).
- Least-privilege scoped API keys where the vendor supports it.

---

## 8. AI / API Abuse Prevention

Directly extends 06_AI_SPEC.md, which already defines timeouts and non-blocking fallback behavior for both AI capabilities.

### 8.1 HACKATHON — MUST BUILD
- **Enforce the timeouts already specified**: 5s categorisation (06_AI_SPEC.md §2.6), 8s voice-to-text (§3.5). These exist for latency reasons in the spec but double as abuse/cost protection — a hung request should not tie up a server thread or run indefinitely against the AI vendor's meter.
- **Single attempt only, no retry loop** — already specified in 06_AI_SPEC.md §2.6 ("No retry loop inside the request path"). This is also a cost-control measure: no accidental retry storm against a paid API during the demo.
- File size/type limits from §4 above double as AI-abuse prevention (an 8MB cap prevents someone from submitting an oversized image purely to run up AI processing cost/time).
- If a demo audience member (or a teammate testing) submits many reports quickly, the suspicious-submission heuristic (F-07, 05_API_CONTRACT.md §6.2) will flag but not block — this is correct per NFR-05 and should not be "fixed" into a hard block; a hard block would contradict the already-agreed non-accusatory design.

### 8.2 Fallback / Stub Mode (HACKATHON)
- 06_AI_SPEC.md §2.7 and §3.6 already permit keyword-stub categorisation and pre-scripted voice fallback if live API access is unavailable. From a security standpoint this is actually the **safer** demo path (no external network dependency, no key exposure risk during a live demo) — if time or connectivity is tight, prefer the documented stub over live API calls for the actual presentation, and say so plainly in demo notes.

### 8.3 PRODUCTION Considerations (document only)
- Per-user/per-IP quota on AI-touching endpoints.
- Cost alerting on the AI vendor account.
- Abuse-pattern detection beyond the current simple heuristic (e.g., a real ML-based spam classifier) — explicitly out of scope per 03_FEATURE_SPEC.md Part C ("Full ML-based spam/fraud detection").

---

## 9. Spam / Malicious Reports, Duplicate & Report Manipulation

This section is security's read on features already specified in FR-07/FR-08 and F-06/F-07 — no new logic invented, only the integrity/abuse angle on existing logic.

### 9.1 Suspicious Submission Heuristic (HACKATHON — build exactly as specified)
- 05_API_CONTRACT.md §6.2's rule (≥3 identical photo-hash complaints, or ≥5 complaints in 10 minutes, from the same `reporter_user_id`) is the full hackathon scope. Compute a simple photo hash (e.g., SHA-256 of file bytes) server-side at upload time for the identical-photo check — cheap, deterministic, no new dependency.
- Flag is **internal only** (`complaints.suspicious_flag`), visible solely via `GET /admin/issues/{id}/flags` (05_API_CONTRACT.md §5.3) — never surfaced to the citizen, per NFR-05. Verify this at the API-response layer (§6.2 above's allow-list discipline applies here too: the citizen-facing complaint-detail response must not include `suspicious_flag`/`suspicious_flag_reason`).

### 9.2 Duplicate-Decision Integrity (HACKATHON)
- `POST /complaints/{id}/duplicate-decision` (05_API_CONTRACT.md §3.3) must enforce ownership (§2.2) — only the reporting citizen of that specific complaint may answer same/different for their own submission. This prevents one citizen from manipulating another citizen's duplicate-link outcome.
- The endpoint should be idempotent/one-shot per complaint: once `duplicate_link_decision` is set (not `NULL`), reject a second call with `409 ALREADY_DECIDED` (a small addition consistent with 04_DATABASE.md's existing `duplicate_link_decision` enum, not a new column) to prevent a citizen from flip-flopping the link after officer action has already begun.

### 9.3 Report Tampering (HACKATHON)
- Once `submitted_at` is set, a complaint's core evidence fields (`photo_path`, `device_gps_lat/lng`, `captured_at`, `description_text`) must be **immutable** via the API — no endpoint in 05_API_CONTRACT.md allows editing them post-submission, and none should be added. Only `final_category` (via the explicit override endpoint) and status/lifecycle fields change after submission. Enforce this by simply not building an "edit complaint" endpoint — the absence of a feature is itself the control here.

### 9.4 PRODUCTION Considerations (document only)
- Device/photo provenance attestation (e.g., signed camera capture, hardware attestation) to make "no gallery upload" (Principle 1) actually enforceable server-side — currently client-trusted only, explicitly noted as a limitation in 05_API_CONTRACT.md §3.1 ("client enforces... API cannot verify this, trusts client"). This is a real, known gap — see §12.

---

## 10. Evidence Integrity & Resolution-Proof Integrity

Covers FR-01 (citizen evidence), FR-17/FR-18 (officer resolution evidence), F-08/F-15, and the `resolution_evidence` table.

### 10.1 Citizen Evidence Integrity (HACKATHON)
- Photo + GPS + timestamp are captured together at submission (02_USER_FLOWS.md Flow 1 steps 2–3) and written once, immutably (§9.3). No security control beyond immutability + upload validation (§4) is buildable or needed in 12h — do not attempt cryptographic photo signing; no FR calls for it and there's no time budget.

### 10.2 Officer Resolution Evidence Integrity (HACKATHON — MUST BUILD)
- `POST /officer/issues/{id}/resolve` (05_API_CONTRACT.md §4.5) must, like citizen submission, require the photo to come from the in-app camera flow (client-enforced, same trust boundary as §9.4) and must **not** allow the officer to submit resolution evidence for an Issue outside their jurisdiction (§2.2/§4.6) — this doubles as an integrity control: only the assigned officer can produce a resolution record for their own Issues.
- Once a `resolution_evidence` row is created with `verification_result` set, it is immutable — no endpoint should allow editing a past resolution attempt's evidence after the fact. A reopened Issue that is resolved again creates a **new** `resolution_evidence` row (04_DATABASE.md §3.6 already models this as 1:N per Issue over time), preserving the full history rather than overwriting.
- The distance/verification computation (07_MAP_GIS_SPEC.md §9) must run **server-side only** — never trust a client-computed `verification_result`. The client sends raw `officer_gps_lat/lng`; the server computes distance and sets the result. This is already implied by 05_API_CONTRACT.md §4.5's behavior spec; security's job is to make sure no shortcut lets a client just POST `verification_result: "matched"` directly. Design the endpoint so `verification_result` is never an accepted input field, only a server-computed output.

### 10.3 Non-Accusatory Handling Stays Intact (HACKATHON)
- Both evidence-confidence (F-08) and resolution mismatch (F-15) outcomes must remain framed as review states (`needs_verification`), never as an automated fraud/guilt label, per NFR-05 — security review confirms no endpoint response ever includes language like "fraud," "fake," or "rejected as false" anywhere in citizen- or officer-facing copy. This is a copy/UX check as much as a technical one, but it's cheap to verify and easy to violate under time pressure with a careless error message.

### 10.4 PRODUCTION Considerations (document only)
- Cryptographic evidence chain-of-custody (signed captures, tamper-evident storage) for legal/audit-grade resolution proof.
- Independent human audit sampling of `needs_verification` cases.

---

## 11. Database Protection

### 11.1 HACKATHON — MUST BUILD
- **Parameterized queries only** (§4.3) — the single highest-leverage control given 04_DATABASE.md's "no ORM, simple parameterized queries" design choice.
- SQLite file permissions: keep the `.sqlite` file readable/writable only by the server process's OS user; do not place it under a web-servable static directory (same discipline as photo storage in §4.1).
- No direct database access exposed to the frontend at all — all access goes through the API layer's role/ownership checks (§2). This is already architecturally true (Node/Express API per 05_API_CONTRACT.md); just don't shortcut it by e.g. exposing a debug DB-browser endpoint during development and forgetting to remove it before the demo.
- Back up the SQLite file (a simple file copy) before the live demo, so a bad manual test doesn't destroy seed data (04_DATABASE.md §6) minutes before presenting.

### 11.2 PRODUCTION Considerations (document only)
- Migration to a production-grade DB engine with proper access control, encryption at rest, automated backups, and replication — SQLite is explicitly a prototype choice (NFR-07) and 04_DATABASE.md does not claim otherwise.
- Least-privilege DB users/roles at the engine level (not meaningful for single-file SQLite, but relevant the moment the engine changes).

---

## 12. Error Handling

### 12.1 HACKATHON — MUST BUILD
- Follow the error shape already fixed in 05_API_CONTRACT.md §2: `{ "error": { "code": "STRING_CODE", "message": "human readable" } }`. Consistency here is a security property too — predictable, generic error codes prevent accidentally leaking internals through ad hoc error strings written in a hurry.
- **Never return raw stack traces, SQL errors, or file-system paths** to the client, even in a hackathon build — wrap all unhandled exceptions in a generic `500 INTERNAL_ERROR` response, and log the real detail server-side only (§13).
- Auth/authorization failures (`401`, `403`) must use the generic codes already specified (e.g., `403 FORBIDDEN_ROLE`, `403 OUTSIDE_JURISDICTION`, `403 NOT_YOUR_COMPLAINT`) — do not reveal *why* in more detail than the code implies (e.g., don't say "no user with id 47 exists" — say `401 UNKNOWN_DEMO_USER`).

### 12.2 PRODUCTION Considerations (document only)
- Centralized error-tracking/alerting service (e.g., Sentry-equivalent) rather than local logs only.

---

## 13. Logging & Auditing

### 13.1 HACKATHON — MUST BUILD (minimal, buildable in the existing schema)
- `status_history` (04_DATABASE.md §3.7) already serves as the primary audit trail for lifecycle changes, including `changed_by_user_id` — nothing new needed; just make sure every status-changing endpoint writes a row here, not just the ones already called out in 05_API_CONTRACT.md (it lists this consistently, so this is a build-discipline note, not a new requirement).
- Server-side request logging (plain stdout/file log is fine): timestamp, route, acting `X-Demo-User-Id`, response status code. This is enough for the 12h build to debug demo issues and to have *something* to show if asked "how would you audit this." Do not log full request bodies containing photos (too large, not useful) or raw secrets (§7).
- Log (but do not surface to any user) suspicious-flag triggers and resolution `needs_verification` events, in addition to their DB rows — redundant logging is fine and cheap here, and useful for a live-demo debugging.

### 13.2 PRODUCTION Considerations (document only)
- Structured, centralized, tamper-evident audit logging (append-only log store, log integrity hashing) for a real government-facing deployment, especially for officer resolution actions and admin overrides.
- Log retention policy, log access controls (who can read audit logs), and separation of audit logs from application logs.

---

## 14. Notification / SMS Security

Directly extends 04_DATABASE.md §3.8 and 03_FEATURE_SPEC.md F-11 (mock SMS is the MUST-HAVE default; real provider is OPTIONAL).

### 14.1 HACKATHON — MUST BUILD
- Since mock SMS is the adopted default, there is no real provider credential to protect for the baseline build — `sms_outbox` (04_DATABASE.md §3.8) is just a DB table, viewable via `GET /admin/sms-outbox` (05_API_CONTRACT.md §5.4), which must be **admin-role-scoped only** (§2.1) since it contains citizen phone numbers and message content.
- `message_body` must never be built by unsanitized string interpolation of citizen-controlled fields beyond the reference ID/stage name already specified (e.g., "Your report CVC-2026-000123 has been acknowledged") — do not, for expediency, interpolate raw `description_text` into an SMS body; this both avoids message injection and matches the spec (04_DATABASE.md §3.8's example message contains only `reference_id` and stage, not free text).

### 14.2 If Real SMS Is Attempted (Stretch, per Feature Spec Part A)
- **HACKATHON, only if attempted:** provider API key handled per §7 (env var, never committed, server-side only). Validate/normalize `phone_number` format before sending to avoid wasted/erroring provider calls. Confirm the provider sandbox/test mode is used if available, to avoid accidentally SMS-ing real numbers during testing.
- **PRODUCTION:** delivery-status webhooks, opt-out/STOP handling (regulatory requirement for real SMS), phone number verification at registration.

---

## 15. Prototype Limitations (Explicit, Not Hidden)

Stated plainly so the team and any evaluator know exactly what is and is not protected in this 12h build. None of these are silently fixed by clever engineering under time pressure — they are named, accepted limitations, consistent with NFR-01's mandate to protect the core demo path over completeness.

1. **No real authentication** — `X-Demo-User-Id` is a convenience header, trivially spoofable by anyone with API access. Acceptable only because the system is local-only (NFR-02) and not deployed.
2. **"No gallery upload" (Principle 1) is client-enforced only** — the API trusts the client's claim that a photo came from the in-app camera; a modified client could bypass this. Already flagged in 05_API_CONTRACT.md §3.1's own field notes; production would need device attestation.
3. **No encryption at rest** for the SQLite file or uploaded photos.
4. **No rate limiting** beyond the one product-required suspicious-submission heuristic (F-07).
5. **GPS spoofing is not detected** — a citizen or officer with a modified client/device could submit fabricated coordinates; the system's duplicate/jurisdiction/resolution-tolerance logic (07_MAP_GIS_SPEC.md) all trusts client-reported GPS, consistent with 07_MAP_GIS_SPEC.md's own framing of these as simplified, non-production geometric rules.
6. **No formal penetration testing or dependency vulnerability scanning** is in scope for a 12h build.
7. **Auth mechanism, SMS provider, and AI vendor security postures remain UNDECIDED** at the product-decision level (matches 01/03/05/06's own UNDECIDED markers) — this document secures whatever stand-in is actually built, but does not pretend those choices are made.

---

## 16. Security Checklist / Definition of Done

Use this as a pre-demo gate. Every box should be checkable by actually looking at the running system, not by intent.

**Auth & Authorization**
- [ ] `X-Demo-User-Id` is validated against `users` table; unknown ID → `401`.
- [ ] Central role-check middleware runs on every endpoint; role mismatch → `403 FORBIDDEN_ROLE`.
- [ ] Citizen endpoints enforce ownership (`reporter_user_id = caller`) → `403 NOT_YOUR_COMPLAINT` on violation.
- [ ] Officer endpoints enforce jurisdiction/department scoping → `403 OUTSIDE_JURISDICTION` on violation.
- [ ] Admin endpoints require `role='admin'` only (no finer permission logic attempted).

**Input & Upload**
- [ ] All required fields per 05_API_CONTRACT.md re-validated server-side.
- [ ] Enum fields validated against 04_DATABASE.md §5 fixed lists server-side.
- [ ] Photo upload: size ≤8MB and MIME/magic-number checked server-side; stored under generated filenames outside any static web root.
- [ ] Audio upload: size/duration/type checked server-side.
- [ ] All SQL uses parameterized queries — zero string-concatenated SQL anywhere in the codebase.
- [ ] Status transitions enforced centrally against 05_API_CONTRACT.md §6.1's table.

**Privacy**
- [ ] `GET /issues/nearby` (and any other citizen aggregate view) response is built from an explicit field allow-list; manually verified to exclude `reporter_user_id`, reporter name/phone, individual complaint rows, citizen-tied photo paths.
- [ ] `suspicious_flag`/`suspicious_flag_reason` never appear in any citizen-facing response.
- [ ] No production/real personal data used in seed data.

**Secrets**
- [ ] All API keys in `.env`, not committed; `.gitignore` covers `.env*` before first commit.
- [ ] `.env.example` present with placeholders only.
- [ ] No AI/SMS provider key ever referenced in frontend code.

**Evidence Integrity**
- [ ] No endpoint allows editing `photo_path`/GPS/`captured_at`/`description_text` after submission.
- [ ] `verification_result` on `resolution_evidence` is server-computed only, never accepted as client input.
- [ ] Officer resolution blocked outside assigned jurisdiction (`403 OUTSIDE_JURISDICTION`).

**Error Handling & Logging**
- [ ] Unhandled exceptions return generic `500 INTERNAL_ERROR`; no stack traces/SQL errors reach the client.
- [ ] Every status change writes a `status_history` row including `changed_by_user_id`.
- [ ] Basic request logging (route, acting user, status code) is running during the demo.

**Notifications**
- [ ] `GET /admin/sms-outbox` is admin-role-scoped.
- [ ] SMS `message_body` built only from reference ID + stage name, not raw free text.

**Operational**
- [ ] Server bound to `localhost` only during the demo, not a public interface.
- [ ] SQLite file backed up before live demo begins.
- [ ] Team has read §15 (Prototype Limitations) and can state them plainly if asked during judging.

---

## 17. Consistency Cross-Check

- Every control above maps to an existing FR/NFR, endpoint, table, or flow in 01–07; no new feature, endpoint, table, or product decision is introduced.
- Auth mechanism, SMS provider, and AI vendor remain UNDECIDED here exactly as in 01_REQUIREMENTS.md (NFR-08), 03_FEATURE_SPEC.md (Part A), and 06_AI_SPEC.md (§2.2) — this document secures the stand-ins already specified (`X-Demo-User-Id` header, mock SMS, PROPOSED AI vendor) without resolving those UNDECIDED items.
- NFR-05 (non-accusatory evidence handling) and NFR-06 (privacy of community data) are directly enforced in §9.1, §10.3, and §6.2 respectively.
- 05_API_CONTRACT.md's own stated auth/upload assumptions (§1, §3.1's "API cannot verify this, trusts client" note) are carried forward here as explicit, named limitations (§15), not silently resolved.
