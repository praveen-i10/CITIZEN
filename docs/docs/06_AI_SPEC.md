# 06_AI_SPEC.md

> Implements: FR-03 (Local Language Input), FR-05 (Automatic Categorisation), F-03, F-04, F-08 (Evidence Confidence, feeds off AI signals partially), F-09 (Risk Score, consumes Evidence Confidence).
> Depends on: 05_API_CONTRACT.md §3.1 (calls these interfaces during `POST /complaints`), 04_DATABASE.md §3.5 (`ai_suggested_category`, `ai_category_confidence`, `voice_language_code`).
> Feeds: 05_API_CONTRACT.md (categorisation/voice-to-text calls), 04_DATABASE.md (stored AI output fields).
> Two AI capabilities are actually selected for this prototype: **(1) multilingual voice-to-text via Sarvam AI (FINAL/AGREED)**, and **(2) photo+text issue categorisation via an AI service (service choice remains PROPOSED — Gemini was discussed, not upgraded to FINAL here)**. No other AI capability is built (Feature Spec: "Advanced AI evidence verification" is explicitly OUT OF SCOPE).

---

## 1. Scope and Non-Goals

**In scope:**
- Voice-to-text transcription (Sarvam AI) for local-language description input.
- Photo+text category suggestion (fixed 8-category list) with citizen override.

**Explicitly out of scope (per 03_FEATURE_SPEC.md Part C):**
- AI-based fraud/evidence verification beyond simple GPS/time tolerance (that check is deterministic, see 07_MAP_GIS_SPEC.md §5, not AI-based).
- AI-driven Evidence Confidence or Risk Score computation — both are rule-based per NFR-04; AI only supplies the `ai_category_confidence` value as one minor optional input where useful, never the deciding logic.
- Any AI model fine-tuning or custom training — only API calls to existing hosted models.

---

## 2. AI Categorisation

### 2.1 Purpose
FR-05: propose one of the 8 fixed categories from a citizen's photo + description text, shown to the citizen as an editable suggestion (never final without confirmation) — Principle: AI is not final-say.

### 2.2 Service
**STATUS: PROPOSED, not upgraded to FINAL.** MASTER_CONTEXT lists Gemini as the discussed candidate for image+text classification. For this prototype build, any multimodal model reachable via a simple HTTP call is acceptable as long as it accepts an image + text prompt and returns structured output; the exact model/version is left to build time (Open Question 37, UNDECIDED). This document defines the **contract**, not the vendor lock-in.

### 2.3 Input
```json
{
  "photo_base64_or_url": "...",
  "description_text": "Large pothole near the bus stop, cars swerving",
  "allowed_categories": ["pothole","garbage","streetlight","drainage","footpath","road_damage","water_supply","other"]
}
```

### 2.4 Prompt (interface-level, illustrative)
System instruction sent with the multimodal request:
> "You are classifying a civic issue report for a Chennai municipal system. Given the photo and description, choose exactly one category from this fixed list: pothole, garbage, streetlight, drainage, footpath, road_damage, water_supply, other. Respond with JSON only, no other text, matching this schema: `{\"category\": string, \"confidence\": number between 0 and 1, \"reasoning\": short string}`. If the photo does not clearly support any category, choose \"other\" with low confidence rather than guessing."

### 2.5 Output Contract
```json
{ "category": "pothole", "confidence": 0.87, "reasoning": "Visible road surface depression, matches description." }
```
- `category` must be validated server-side against the fixed enum (04_DATABASE.md §5.1); any unrecognized value is coerced to `other` with `confidence=0`.
- `confidence` is stored as `complaints.ai_category_confidence`; not currently used to auto-block submission (no confidence threshold gates submission — the citizen always gets a review/override step per FR-05).

### 2.6 Fallback Behavior (FR-05, Flow 1 E4)
- Timeout: **5 seconds** (matches 05_API_CONTRACT.md §3.1 step 4).
- On timeout or non-2xx response or malformed JSON: `ai_suggested_category=NULL`, `ai_category_confidence=NULL`, API response sets `category_source_required=manual`; citizen is shown the manual 8-item picker instead of a pre-filled suggestion. Submission is never blocked by an AI failure.
- No retry loop inside the request path (would blow the latency budget for a hackathon demo); a single attempt only.

### 2.7 What Is Simulated (if needed)
If no live API key/quota is available during the 12h build, this capability may be **simulated with a simple keyword-matching stub** (e.g., description contains "garbage"/"trash" → `garbage`; "light" → `streetlight`; "water" → `water_supply`; default → `other`) returning the same JSON contract as §2.5, clearly commented in code as a stand-in. This preserves FR-05's demonstrable behavior (category always gets set, with override) without depending on external API reliability during the demo.

---

## 3. Voice-to-Text (Sarvam AI)

### 3.1 Purpose
FR-03, F-03: let a citizen describe an issue by voice in a local language; transcript is shown editable before submit.

### 3.2 Service
**Sarvam AI — FINAL/AGREED** (DEC-06). Exact endpoint/model version within Sarvam's offering is left to build time; the contract below is what the API layer needs regardless of exact Sarvam model chosen.

### 3.3 Input
- Audio clip, max 60 seconds, recorded in-browser/in-app (`audio/webm` or `audio/wav`).
- Optional `language_hint` if the citizen pre-selects a language from a short list; otherwise Sarvam's auto-detect is used. Exact languages demoed = **UNDECIDED** (Open Question 39) — at minimum, one non-English Indian language should be demoed per F-03's acceptance criteria; Tamil is the natural default given the Chennai scope, but this document does not lock that choice.

### 3.4 Output Contract
```json
{
  "transcript": "பெரிய பள்ளம் பேருந்து நிறுத்தத்திற்கு அருகில் உள்ளது",
  "detected_language_code": "ta-IN",
  "confidence": 0.81
}
```
- `transcript` populates the description field, editable by the citizen before submit (never auto-submitted without review).
- `detected_language_code` is stored as `complaints.voice_language_code`.

### 3.5 Fallback Behavior (Flow 1 E3, F-03 edge case)
- Timeout: **8 seconds** (voice calls are allowed slightly more latency budget than categorisation since they're a distinct earlier user-driven step, not blocking final submit).
- On timeout/error: citizen falls back to typing manually; the report is never blocked. `complaints.description_source` is set to `typed` in this case, not `voice_transcript`.

### 3.6 What Is Simulated (if needed)
If Sarvam API access is unavailable during build/demo, transcription may fall back to a **pre-recorded/pre-scripted demo clip mapped to a known transcript** for the live demo walkthrough, with a clear code comment that this is a scripted fallback, not the production path. This is a demo-safety measure only — the real Sarvam integration is attempted first per DEC-06.

---

## 4. Confidence and Fallback Summary Table

| Capability | Model/Service | Timeout | On Failure | Blocks Submission? |
|---|---|---|---|---|
| Categorisation | Multimodal (Gemini-class, PROPOSED) or keyword stub | 5s | `ai_suggested_category=NULL`, manual picker shown | No |
| Voice-to-text | Sarvam AI (FINAL) | 8s | Fallback to manual typing | No |

Both capabilities follow NFR-04/Principle 5 by construction: **neither AI output is ever the sole basis for a rejection, fraud label, or blocking condition** — AI only proposes; a human (citizen or officer) or a separate deterministic rule (07_MAP_GIS_SPEC.md, 04_DATABASE.md priority logic) makes any consequential decision.

---

## 5. Consistency Cross-Check

- FR-03 → §3 (Sarvam). FR-05 → §2 (categorisation). Both map to concrete API calls in 05_API_CONTRACT.md §3.1 steps 3–4.
- No AI output is stored or used outside the fields defined in 04_DATABASE.md §3.5 (`ai_suggested_category`, `ai_category_confidence`, `voice_language_code`).
- Evidence Confidence (F-08) and Risk/Priority (F-09) remain fully rule-based per NFR-04 — this document does not introduce any AI dependency into either, consistent with 04_DATABASE.md's `issue_evidence_signals` table (no AI-derived columns there).
- Exact AI model/service (Open Question 37) and exact demo languages (Open Question 39) remain explicitly UNDECIDED here, not silently resolved.
