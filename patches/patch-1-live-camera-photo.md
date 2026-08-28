# Patch 1: Live Camera & Photo Capture Loopholes

## Overview
Address vulnerabilities and hardcoded behaviors in the camera and photo capture functionality of the application to ensure authentic and reliable user submissions.

## Issues to Address
1. **Preloaded Photo Defaulting**
   - **Current State:** `ReportIssueWizard.tsx` and `ResolutionCaptureModal.tsx` initialize state with hardcoded external Unsplash URLs (`SAMPLE_PHOTOS[0].url`). If live capture isn't used, the system accepts pre-baked images.
   - **Goal:** Ensure the system requires actual live camera capture or a validated user selection, removing the Unsplash defaults.

2. **Disconnected Device Geolocation**
   - **Current State:** Selecting a photo or starting the camera doesn't use `navigator.geolocation.getCurrentPosition`. GPS is statically tied to a demo preset (13.0015, 80.2575).
   - **Goal:** Live capture must dynamically bind real device coordinates or allow explicit, validated coordinate simulation on the device.

3. **Missing EXIF Parsing**
   - **Current State:** The client/server only checks if `photoExifLat` is in the JSON body, ignoring actual JPEG metadata (violating FR-01 and Principle 3).
   - **Goal:** Implement client- or server-side EXIF inspection to extract and validate metadata headers as supplementary evidence.

4. **Payload Mismatch on Upload**
   - **Current State:** `multer` is in `package.json`, but `routes.ts` relies on raw base64 data URLs or HTTP links inside JSON payloads over `express.json()`. This diverges from the `multipart/form-data` spec in `05_API_CONTRACT.md §2.2`.
   - **Goal:** Integrate `multer` middleware in `routes.ts` and refactor the frontend to submit actual files via `multipart/form-data`.
