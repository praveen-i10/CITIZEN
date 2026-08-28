# Patch 4: AI & GIS Engine Loopholes

## Overview
Fix hardcoded AI evaluations and GIS routing logic to make them dynamic and compliant with the system's specifications.

## Issues to Address
1. **GIS Manual Routing Bypass (07_MAP_GIS_SPEC.md §4)**
   - **Current State:** `lookupJurisdiction()` automatically assigns out-of-bounds coordinates to the closest zone within 12 km. FR-06 and `07_MAP_GIS_SPEC.md §4.4` mandate setting `needs_manual_routing = 1` and `jurisdiction_zone_id = NULL` for manual review.
   - **Goal:** Update the routing logic to properly flag out-of-bounds coordinates for manual routing instead of auto-assigning them.

2. **Deterministic Priority Formula Hardcoding (03_FEATURE_SPEC.md F-09)**
   - **Current State:** The 8-factor score uses fixed, static categories for public exposure and infrastructure impact instead of dynamically calculating based on duration (from `capturedAt`) and corroboration counts.
   - **Goal:** Implement the dynamic priority formula that incorporates elapsed time and corroboration counts to calculate a real-time score.

3. **Sarvam AI Audio Ingestion Contract (06_AI_SPEC.md §3)**
   - **Current State:** `ai.ts` returns static array indices for Tamil/Hindi transcripts. It lacks the network integration skeleton (`multipart/form-data` audio forwarding to Sarvam's API) and proper fallback timeouts (8s max).
   - **Goal:** Build the network integration to forward audio to Sarvam's API endpoints using `multipart/form-data` and implement the required 8-second timeout mechanism.
