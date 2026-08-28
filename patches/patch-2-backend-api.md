# Patch 2: Backend & API Contract Loopholes

## Overview
Fortify the backend API against unauthorized access, enforce state transition rules, and implement required moderation features.

## Issues to Address
1. **Missing Authorization & Scoping Middleware (09_SECURITY.md §2)**
   - **Current State:** `getUserId(req)` extracts `X-Demo-User-Id`, but lacks centralized middleware for role protection (`403 FORBIDDEN_ROLE`), ownership validation (`403 NOT_YOUR_COMPLAINT`), or officer jurisdiction boundaries (`403 OUTSIDE_JURISDICTION`).
   - **Goal:** Implement and apply proper authorization middleware across all relevant endpoints to enforce these access controls.

2. **Unenforced Status Transitions (05_API_CONTRACT.md §6.1)**
   - **Current State:** State transitions in `database.ts` don't check the mandatory transition matrix. Clients can bypass the lifecycle (e.g., jumping from `submitted` straight to `closed`).
   - **Goal:** Enforce a strict state transition matrix to ensure issues follow the correct lifecycle (e.g., `submitted` -> `assigned` -> `resolved` -> `closed`).

3. **Missing Admin Flag Inspection Endpoint (05_API_CONTRACT.md §5.3)**
   - **Current State:** The `GET /admin/issues/:id/flags` endpoint, meant to audit suspicious reports and `needs_verification` states, is missing from `routes.ts`.
   - **Goal:** Implement the missing endpoint for admin auditing.

4. **Heuristic Spam Filter Enforcement (05_API_CONTRACT.md §6.2)**
   - **Current State:** The rule (flag if >= 3 identical photo hashes or >= 5 submissions in 10 minutes) is bypassed with a placeholder (`suspiciousFlag: false`) without hash calculation or frequency querying.
   - **Goal:** Implement actual file hashing and querying of submission frequency to accurately enforce the spam filter heuristic.
