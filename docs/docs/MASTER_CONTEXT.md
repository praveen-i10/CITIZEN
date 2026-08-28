# MASTER_CONTEXT.md

> **Purpose:** This file is the authoritative context record for the hackathon project. It preserves the official problem statement, decisions, constraints, research context, and unresolved ideas from the team's discussion. It is intended to be used as the source of truth when creating separate requirements, feature, user-flow, database, API, AI, GIS, UI, security, and demo documents.
>
> **Status labels:** `FINAL/AGREED`, `REQUIRED`, `PROPOSED`, `OPTIONAL`, `REJECTED`, `UNDECIDED`.
>
> **Important:** Brainstormed ideas are not automatically requirements. Where a decision was not clearly made, the item remains unresolved.

---

# 1. Project Identity

## Project Name
**STATUS: UNDECIDED**

No final project name was established in the conversation.

## One-Line Project Description
**STATUS: FINAL/AGREED**

A location-aware civic issue reporting and resolution platform that enables citizens to report civic problems with evidence, automatically determines the relevant jurisdiction, routes issues to responsible authorities, prioritises them, and supports evidence-based resolution tracking.

## Hackathon Problem Statement
**STATUS: REQUIRED**

**Problem Statement 5: Crowd Sourced Civic Issue Reporting and Resolution**

## Core Problem
**STATUS: REQUIRED**

Citizens encounter civic problems every day, including potholes, uncollected garbage, broken streetlights, overflowing drains, and damaged footpaths, but have no dependable way to report them.

Complaints may go through:
- helplines
- social media posts
- visits to municipal offices

where they may be:
- logged inconsistently
- routed to the wrong department
- lost entirely

Citizens may receive no confirmation that anything is happening, while municipal staff may lack a consolidated view of:
- what is broken
- where it is
- how urgent it is

## Core Solution Concept
**STATUS: FINAL/AGREED**

The team's current concept is a civic issue reporting and resolution system in which:

1. A citizen reports an issue using an in-app camera for physical complaints.
2. The application captures the device's location and timestamp.
3. Photo metadata can be cross-checked when available.
4. The citizen provides a text description or voice input.
5. Sarvam AI is intended for multilingual voice-to-text.
6. AI is intended to categorise the issue from photo/text.
7. The issue location is used to determine the relevant jurisdiction.
8. Jurisdiction and issue category are intended to determine the responsible department/officer.
9. Duplicate reports can be associated with the same underlying real-world Issue.
10. Community reports can provide corroborating evidence.
11. An Evidence Confidence concept can assess how strongly the report is supported.
12. A separate rule-based Risk/Priority Score is intended to determine urgency.
13. Officers manage issues through a jurisdiction-based dashboard.
14. Officers provide fresh geo-stamped resolution evidence.
15. Resolution evidence is cross-checked against the original complaint.
16. Citizens receive status SMS notifications.
17. Citizens can confirm a resolution or reopen the issue.
18. Citizens can view nearby unresolved aggregated Issues.

---

# 2. Official Problem Statement Context

## Official Problem Statement

**STATUS: REQUIRED**

Citizens encounter civic problems every day — potholes, uncollected garbage, broken streetlights, overflowing drains, damaged footpaths — but have no dependable way to report them.

Complaints go through helplines, social media posts, or visits to municipal offices, where they are logged inconsistently, routed to the wrong department, or lost entirely.

The citizen receives no confirmation that anything is happening, and municipal staff have no consolidated view of what is broken, where it is, and how urgent it is.

## Explicit Official Requirements

### REQ-01 — Report an Issue
**STATUS: REQUIRED**

Allow citizens to report an issue with:
- photo
- location
- short description

### REQ-02 — Mobile and Web
**STATUS: REQUIRED**

Accept reports from mobile and web.

### REQ-03 — Local Languages
**STATUS: REQUIRED**

Accept reports in local languages.

### REQ-04 — Offline Reporting
**STATUS: REQUIRED**

Capture reports offline and submit them when connectivity returns.

### REQ-05 — Automatic Categorisation
**STATUS: REQUIRED**

Automatically categorise issues by type from photo and text.

### REQ-06 — Responsible Department Routing
**STATUS: REQUIRED**

Route each report to the responsible department.

### REQ-07 — Duplicate Detection and Merging
**STATUS: REQUIRED**

Detect and merge duplicate reports of the same issue.

### REQ-08 — Spam / False / Malicious Filtering
**STATUS: REQUIRED**

Filter spam, false, and malicious reports.

### REQ-09 — Prioritisation
**STATUS: REQUIRED**

Prioritise issues based on:
- severity
- location
- number of reporters

### REQ-10 — Live Status
**STATUS: REQUIRED**

Show live status to the reporter through to resolution.

### REQ-11 — Stage Notifications
**STATUS: REQUIRED**

Notify citizens at each stage of the resolution process.

### REQ-12 — Citizen Confirmation / Reopening
**STATUS: REQUIRED**

Allow citizens to confirm or reopen an issue marked resolved.

### REQ-13 — Staff Map and Dashboard
**STATUS: REQUIRED**

Provide municipal staff a map and dashboard of open issues.

### REQ-14 — Department Response and Backlog Tracking
**STATUS: REQUIRED**

Track department response times and pending backlogs.

### REQ-15 — Recurring Problem Locations
**STATUS: REQUIRED**

Surface recurring problem locations for planning and maintenance.

### REQ-16 — Limited Digital Familiarity
**STATUS: REQUIRED**

Remain usable by citizens with limited digital familiarity.

> **Boundary:** This section contains only the official problem-statement requirements. Team-specific implementation choices are documented separately.

---

# 3. Problem Understanding

## Real-World Problem
**STATUS: FINAL/AGREED AS TEAM UNDERSTANDING**

The team understands the problem as a failure of the complete civic complaint lifecycle, not merely a lack of a complaint form.

The intended lifecycle is:

**Report → Identify → Route → Prioritise → Act → Resolve → Verify → Inform Citizen**

## Root Causes Discussed
**STATUS: FINAL/AGREED AS TEAM UNDERSTANDING**

The conversation identified:
- inconsistent complaint logging
- incorrect department routing
- complaints potentially being lost
- lack of consolidated municipal visibility
- lack of citizen status visibility
- difficulty verifying physical complaints
- difficulty verifying whether an officer actually resolved an issue
- multiple citizens reporting the same physical issue
- service complaints that cannot be verified through a photograph
- citizens potentially not knowing the correct jurisdiction

## Physical vs Service Complaints
**STATUS: FINAL/AGREED**

The team explicitly recognised two broad evidence situations.

### Physical Complaint

Examples:
- pothole
- garbage
- damaged road
- broken streetlight
- damaged footpath

These can potentially have:
- fresh photo
- GPS
- timestamp
- description
- community corroboration

### Service Complaint

Examples discussed include service-related problems such as lack of water supply.

These may not have meaningful photographic proof and therefore may need other evidence signals, including:
- location
- time
- independent reports
- geographic clustering
- duration

The exact service-complaint verification method remains to be specified later.

## Community Corroboration
**STATUS: PROPOSED**

The team discussed using independent reports from different citizens as supporting evidence that a civic issue may actually exist.

This concept is relevant to both physical and service complaints, but its exact implementation remains to be formally specified.

## Risk-Count Fairness Observation
**STATUS: FINAL/AGREED AS TEAM PRINCIPLE**

The team recognised that complaint count alone should not determine urgency.

For example, a small number of reports about a dangerous open manhole may deserve higher priority than many reports about a minor issue.

This motivated a multi-factor Risk/Priority Score.

---

# 4. Project Scope

## Geography
**STATUS: FINAL/AGREED**

The prototype demonstration is focused on **Chennai**.

The map will use:
- **OpenStreetMap**
- **Leaflet**

## Chennai Jurisdiction Data
**STATUS: FINAL/AGREED**

The team will provide its **own Chennai jurisdiction/demo data**.

This data is not being represented as an authoritative official Chennai government dataset.

The exact structure and values will be defined in later GIS/database documentation.

## Target Users
**STATUS: FINAL/AGREED**

Primary users:
- citizens
- municipal/admin users
- departments/officers

## Prototype Scope
**STATUS: FINAL/AGREED**

The project is a **12-hour hackathon prototype**.

The goal is to demonstrate the core citizen-to-officer-to-resolution workflow.

## Deployment
**STATUS: FINAL/AGREED**

Deployment is not required.

The prototype will be developed and demonstrated locally.

## Build Environment
**STATUS: FINAL/AGREED**

The team intends to use **Antigravity** to build the prototype.

## Nationwide Scope
**STATUS: NOT CURRENT PROTOTYPE SCOPE**

The prototype does not attempt to implement all Indian jurisdictions.

## Production Government Integration
**STATUS: UNDECIDED / NOT ESTABLISHED**

No production government integration was confirmed.

No government API, database, or service should be assumed to be available.

---

# 5. Product Vision and Core Concept

## Product Identity
**STATUS: FINAL/AGREED**

The project is an:

> **Evidence-backed, location-aware civic issue management platform.**

## Intended Transformation
**STATUS: FINAL/AGREED**

The platform is intended to turn an unstructured citizen complaint into a trackable civic Issue with:
- location
- category
- responsible jurisdiction/department
- supporting evidence
- community context
- priority
- resolution evidence
- citizen confirmation

## Core Workflow
**STATUS: FINAL/AGREED**

**Capture → Locate → Categorise → Verify → Merge → Prioritise → Route → Resolve → Geo-Verify → Notify → Citizen Confirm**

This is the team's high-level product concept, not a final technical architecture.

## Citizen Reporting
**STATUS: FINAL/AGREED**

The primary physical-issue flow is:

**In-App Camera → GPS + Timestamp → Description → Submit**

Voice can provide the description.

## Automatic Jurisdiction
**STATUS: FINAL/AGREED**

The citizen should not have to manually identify whether the area is:
- urban
- rural
- panchayat
- municipality
- corporation
- another administrative category

The intended approach is to derive the responsible jurisdiction from the issue's location.

## Complaint vs Issue
**STATUS: FINAL/AGREED**

A Complaint is an individual citizen submission.

An Issue represents the underlying real-world civic problem.

Example:

**10 citizens report the same pothole = 10 complaints potentially linked to 1 Issue.**

---

# 6. Stakeholders and Roles

## Citizen
**STATUS: FINAL/AGREED**

The citizen is intended to:
- report civic problems
- capture physical evidence
- provide text
- provide voice input
- view previous complaints
- view complaint statuses
- view nearby unresolved Issues
- receive SMS status notifications
- confirm a resolution
- reopen a resolved Issue

## Municipal / Admin User
**STATUS: FINAL/AGREED**

Municipal/admin users are intended to have consolidated visibility into civic issues.

Exact administrative permissions are not yet defined.

## Department
**STATUS: FINAL/AGREED**

A responsible department handles issues routed according to location and issue category.

## Officer
**STATUS: FINAL/AGREED**

An officer is intended to:
- view assigned issues
- acknowledge issues
- update status
- view evidence
- work on issues
- submit resolution evidence

## Other Actors
**STATUS: UNDECIDED**

No other confirmed user role was established.

---

# 7. Core Terminology

## Complaint / Report
**STATUS: FINAL/AGREED**

An individual citizen submission about a civic problem.

## Issue
**STATUS: FINAL/AGREED**

The underlying real-world civic problem that may have multiple associated complaints.

## Duplicate
**STATUS: FINAL/AGREED**

A report that appears to refer to an existing Issue rather than representing a separate real-world problem.

## Jurisdiction
**STATUS: FINAL/AGREED**

The geographic/administrative area used to determine responsibility for an issue.

The conceptual hierarchy discussed was:

**Location → State → District → Local Body → Ward/Panchayat → Department → Officer**

The exact hierarchy used in the Chennai demo remains to be formally specified.

## Department
**STATUS: FINAL/AGREED**

The responsible administrative/municipal unit for handling an issue.

## Evidence
**STATUS: FINAL/AGREED**

Information that supports a complaint or resolution.

Examples discussed:
- photo
- GPS
- timestamp
- description
- community corroboration

## Evidence Confidence
**STATUS: PROPOSED**

A measure of how strongly available evidence supports the existence of an issue.

It is deliberately distinguished from declaring a report "fake."

## Risk / Priority Score
**STATUS: FINAL/AGREED AS A CONCEPT**

A separate measure intended to represent how urgently an Issue should be addressed.

## Status
**STATUS: FINAL/AGREED AS A CONCEPT**

The conversation established the main lifecycle:

**Submitted → Acknowledged → Ongoing → Resolved**

Additional states discussed:
- Reopened
- Closed
- Needs Verification

Exact state transition rules remain undecided.

## Resolution
**STATUS: FINAL/AGREED**

An officer's claim that the issue has been addressed.

## Resolution Evidence / Resolution Proof
**STATUS: FINAL/AGREED**

Fresh evidence captured by the officer after work is completed, intended to contain location and timestamp and be cross-referenced with the original complaint.

## Hotspot
**STATUS: FINAL/AGREED AS A CONCEPT**

A geographic area associated with recurring or concentrated civic issues.

---

# 8. Existing Systems and Research Context

## Swachhata-MoHUA
**STATUS: DISCUSSED / REQUIRES EXTERNAL VERIFICATION**

The team discussed Swachhata-MoHUA as an existing civic issue reporting solution.

A location-related problem/limitation was identified by the team as a comparison point.

The conversation does not establish authoritative details about:
- current functionality
- exact location capabilities
- APIs
- datasets
- internal architecture
- current limitations

These must be externally verified before being stated as facts.

## CPGRAMS
**STATUS: DISCUSSED / REQUIRES EXTERNAL VERIFICATION**

CPGRAMS was discussed as an existing government grievance system.

The team's intended distinction concerns areas such as:
- evidence
- geospatial handling
- prioritisation
- resolution tracking

The conversation does not establish authoritative details about its current technical capabilities or APIs.

## GCC Civic Services
**STATUS: DISCUSSED / REQUIRES EXTERNAL VERIFICATION**

GCC civic services were discussed as a relevant Chennai municipal context.

The team considered differentiation through concepts such as:
- location-based routing
- issue aggregation
- evidence
- resolution verification

The conversation does not establish authoritative details about current GCC APIs, datasets, or capabilities.

## Research Rule
**STATUS: FINAL/AGREED**

Existing-system comparisons must clearly distinguish:
- verified facts
- team observations
- assumptions requiring verification

No unsupported government/API/dataset claim should be introduced.

---

# 9. Agreed Product Principles

## Principle 1 — Fresh In-App Physical Evidence
**STATUS: FINAL/AGREED**

Physical complaints should primarily use an in-app camera so the application can capture evidence at the time of reporting.

## Principle 2 — Capture Location at Reporting Time
**STATUS: FINAL/AGREED**

The application should capture device location associated with the report.

## Principle 3 — EXIF Is Additional Evidence
**STATUS: FINAL/AGREED**

Photo EXIF location may be cross-checked when available.

Missing EXIF should not by itself make a report invalid.

## Principle 4 — Citizen Should Not Need to Know Jurisdiction
**STATUS: FINAL/AGREED**

The system should use location to determine jurisdiction rather than requiring citizens to manually identify the responsible administrative structure.

## Principle 5 — Evidence Confidence Is Not a Fraud Verdict
**STATUS: FINAL/AGREED**

Evidence assessment should not automatically declare a citizen or report fraudulent.

## Principle 6 — Risk Is Separate From Evidence
**STATUS: FINAL/AGREED**

Evidence Confidence and Risk/Priority are separate concepts.

## Principle 7 — Independent Reporters Matter
**STATUS: FINAL/AGREED**

Community corroboration should distinguish independent citizens from repeated reports by the same person.

## Principle 8 — Do Not Delete Duplicate Citizen Reports
**STATUS: FINAL/AGREED**

Duplicate complaints should remain associated with their respective citizens while being linked to the same underlying Issue where appropriate.

## Principle 9 — Resolution Requires Fresh Evidence
**STATUS: FINAL/AGREED**

An officer claiming resolution should provide fresh evidence through the application.

## Principle 10 — Resolution Mismatch Requires Verification
**STATUS: FINAL/AGREED**

A mismatch between citizen evidence and officer evidence should trigger verification/manual review rather than automatically accusing the officer of fraud.

## Principle 11 — Citizen Can Challenge Resolution
**STATUS: FINAL/AGREED**

A citizen can confirm or reopen an issue after it is marked resolved.

## Principle 12 — Risk Should Not Be Complaint Count Alone
**STATUS: FINAL/AGREED**

Issue urgency should consider more than the raw number of reports.

---

# 10. Current Decisions

## DEC-01 — In-App Camera
**STATUS: FINAL/AGREED**

The citizen's physical complaint photo is captured through the application's in-app camera.

## DEC-02 — Device GPS
**STATUS: FINAL/AGREED**

Device GPS is used to capture the location of the complaint.

## DEC-03 — Photo Metadata Cross-Check
**STATUS: FINAL/AGREED**

Photo EXIF location may be cross-checked against device GPS when available.

## DEC-04 — Text Description
**STATUS: FINAL/AGREED**

Citizens can provide a text description of the problem.

## DEC-05 — Multilingual Voice Input
**STATUS: FINAL/AGREED**

Voice input is part of the intended citizen reporting experience.

## DEC-06 — Sarvam AI
**STATUS: FINAL/AGREED**

Sarvam AI is intended for multilingual voice-to-text.

## DEC-07 — AI Categorisation
**STATUS: FINAL/AGREED**

AI is intended to categorise issues using photo and text.

## DEC-08 — Automatic Jurisdiction
**STATUS: FINAL/AGREED**

Jurisdiction should be determined from location rather than asking citizens to manually select the administrative category.

## DEC-09 — Team-Provided Chennai Data
**STATUS: FINAL/AGREED**

The team will provide its own Chennai jurisdiction/demo data.

It must not be presented as an authoritative government dataset.

## DEC-10 — Chennai Map
**STATUS: FINAL/AGREED**

The demo map uses Chennai with OpenStreetMap and Leaflet.

## DEC-11 — Complaint and Issue Distinction
**STATUS: FINAL/AGREED**

Individual complaints and underlying Issues are separate concepts.

## DEC-12 — Duplicate Merging Concept
**STATUS: FINAL/AGREED**

Multiple reports of the same real-world problem can be associated with one Issue.

## DEC-13 — Community Issue View
**STATUS: FINAL/AGREED**

Citizens can view nearby unresolved aggregated Issues.

## DEC-14 — Privacy in Community View
**STATUS: FINAL/AGREED**

Other citizens' personal information should not be exposed in the community issue view.

## DEC-15 — Evidence Confidence
**STATUS: PROPOSED**

Evidence Confidence is a proposed component, not yet a fully finalised product requirement.

## DEC-16 — Rule-Based Risk Score
**STATUS: FINAL/AGREED**

Risk/Priority should use a deterministic rule-based approach rather than having AI independently decide urgency.

## DEC-17 — Risk Factors
**STATUS: FINAL/AGREED AS FACTOR SET**

The following factors were selected as the intended risk dimensions:
- severity
- public exposure
- vulnerable population impact
- critical infrastructure impact
- duration
- community corroboration
- recurrence
- evidence confidence

The exact numeric weights remain undecided.

## DEC-18 — Officer Dashboard
**STATUS: FINAL/AGREED**

Officers will have a dashboard for issues in their relevant jurisdiction.

## DEC-19 — Officer Map / Heatmap
**STATUS: FINAL/AGREED AS A CURRENT CONCEPT**

The officer dashboard includes a geographic view and heatmap concept for unresolved issues.

Exact implementation remains for later GIS/UI specification.

## DEC-20 — Officer Resolution Photo
**STATUS: FINAL/AGREED**

The officer should capture a fresh resolution photo through the application.

## DEC-21 — Resolution Geo/Time Cross-Check
**STATUS: FINAL/AGREED**

Officer resolution evidence is cross-referenced with the original complaint, including location/time concepts.

## DEC-22 — Citizen Confirm/Reopen
**STATUS: FINAL/AGREED**

Citizens can confirm a resolved issue or reopen it.

## DEC-23 — SMS Status Notifications
**STATUS: FINAL/AGREED**

SMS status notifications are part of the current prototype.

The intended lifecycle includes notifications for status changes such as:
- submitted
- acknowledged
- ongoing
- resolved
- reopened

## DEC-24 — SMS Provider
**STATUS: UNDECIDED**

No specific SMS provider has been selected.

## DEC-25 — Offline Reporting
**STATUS: FINAL/AGREED**

The prototype must support capturing a complaint offline and synchronising it when connectivity returns.

## DEC-26 — Local Prototype
**STATUS: FINAL/AGREED**

The project will be developed and demonstrated locally.

## DEC-27 — No Deployment
**STATUS: FINAL/AGREED**

Deployment is not required.

## DEC-28 — Antigravity
**STATUS: FINAL/AGREED**

Antigravity is the intended build environment.

## DEC-29 — 12-Hour Build Constraint
**STATUS: FINAL/AGREED**

The prototype must be achievable within approximately 12 hours.

---

# 11. Proposed / Unresolved Ideas

## PROPOSED-01 — Evidence Confidence as a Full Feature
**STATUS: PROPOSED**

The team discussed an Evidence Confidence Score to estimate how strongly a complaint is supported.

The concept is useful for:
- physical evidence
- service complaints
- community corroboration
- verification workflows

However, it was not explicitly confirmed as a final product requirement.

## PROPOSED-02 — Evidence Confidence Factors
**STATUS: PROPOSED**

Suggested factors included:
- fresh in-app photo
- valid device GPS
- valid timestamp
- photo/text consistency
- independent corroborating reports
- location consistency
- suspicious duplicate behavior
- location inconsistency

Exact weights were not final.

## PROPOSED-03 — Evidence Confidence Bands
**STATUS: PROPOSED**

A possible interpretation discussed was:
- high confidence
- needs verification
- low confidence

Exact numerical boundaries were not confirmed.

## PROPOSED-04 — Risk Score Weights
**STATUS: PROPOSED / UNDECIDED**

The following weights were suggested during brainstorming:

| Factor | Suggested Weight |
|---|---:|
| Severity | 20% |
| Public Exposure | 15% |
| Vulnerable Population Impact | 15% |
| Critical Infrastructure Impact | 10% |
| Duration | 10% |
| Community Corroboration | 10% |
| Recurrence | 10% |
| Evidence Confidence | 10% |

The factor set is agreed as the intended risk dimensions, but these exact weights are not final.

## PROPOSED-05 — Duplicate Detection Rules
**STATUS: PROPOSED**

Possible duplicate signals discussed:
- geographic distance
- category similarity
- text similarity
- time proximity

A simple geographic radius plus category relationship was considered for the prototype.

Exact thresholds remain undecided.

## PROPOSED-06 — Exact Issue Categories
**STATUS: PROPOSED**

Examples repeatedly discussed:
- pothole
- garbage
- drainage
- streetlight
- footpath
- road damage
- water supply
- other

The final category list must be confirmed in the later feature/AI specification.

## PROPOSED-07 — Suspicious Pattern Detection
**STATUS: PROPOSED**

Possible suspicious-report signals discussed:
- repeated identical submissions
- excessive submissions in a short period
- identical images
- inconsistent locations
- abnormal reporting patterns
- suspicious duplicate behavior

The team did not finalise the exact implementation.

## PROPOSED-08 — Resolution Verification Details
**STATUS: PROPOSED**

The concept of cross-checking:
- citizen GPS
- officer GPS
- citizen timestamp
- officer timestamp
- officer assignment
- before/after evidence

is agreed at a high level.

The exact verification algorithm remains to be defined.

## PROPOSED-09 — Heatmap Calculation
**STATUS: PROPOSED**

The team discussed showing unresolved issue density or weighted risk on a heatmap.

The exact calculation is not finalised.

## PROPOSED-10 — Department Performance Metrics
**STATUS: PROPOSED**

Beyond the official requirement to track response times and pending backlogs, additional metrics discussed included:
- acknowledgement time
- response time
- resolution time
- overdue cases
- reopen rate
- resolution rate

The complete metric set remains to be defined.

## PROPOSED-11 — Recurring Hotspot Algorithm
**STATUS: PROPOSED**

The team discussed grouping historical issues geographically and by category to surface recurring locations.

Exact recurrence rules remain unresolved.

## PROPOSED-12 — Mock SMS
**STATUS: PROPOSED**

A mock SMS mechanism was discussed as a possible fallback if real SMS credentials/API access becomes a blocker.

The team did not explicitly finalise whether this fallback will be used.

## OPTIONAL-01 — Advanced Government/Utility Integration
**STATUS: OPTIONAL**

The conversation considered possible integration with government or utility systems, particularly to strengthen service complaint verification.

No specific integration was confirmed.

## OPTIONAL-02 — Advanced AI Verification
**STATUS: OPTIONAL**

More advanced AI-based evidence verification was discussed but was not established as a current requirement.

## REJECTED-01 — Manual Jurisdiction Selection as Primary Flow
**STATUS: REJECTED**

The earlier idea of asking citizens to identify their area as urban/rural/panchayat/municipality/etc. was superseded.

The agreed direction is automatic location-based jurisdiction determination.

## REJECTED-02 — Treating Every Report as a Separate Real-World Issue
**STATUS: REJECTED**

The project explicitly distinguishes individual complaints from the underlying Issue.

## UNDECIDED-01 — Authentication
**STATUS: UNDECIDED**

No final authentication method was selected.

## UNDECIDED-02 — Exact Status State Machine
**STATUS: UNDECIDED**

The main statuses were discussed, but exact transition rules have not been decided.

## UNDECIDED-03 — Exact SMS Provider
**STATUS: UNDECIDED**

No provider was selected.

## UNDECIDED-04 — Exact AI Service/Model
**STATUS: UNDECIDED**

AI categorisation is agreed, but the exact model/service implementation was not formally locked in the conversation.

## UNDECIDED-05 — Exact Chennai Jurisdiction Structure
**STATUS: UNDECIDED**

The team will supply its own Chennai demo data, but the exact schema/hierarchy and values remain to be specified.

---

# 12. Technical Context Already Discussed

> This section records technologies discussed/selected. It does not make new technical recommendations.

## Frontend

### React + Vite
**STATUS: PROPOSED**

Discussed as the frontend framework/build setup.

### Tailwind CSS
**STATUS: PROPOSED**

Discussed for UI styling.

### PWA
**STATUS: PROPOSED**

Discussed to support offline-capable behavior.

### Dexie.js / IndexedDB
**STATUS: PROPOSED**

Discussed for storing pending offline reports locally.

### Leaflet
**STATUS: FINAL/AGREED**

Selected for the map.

### OpenStreetMap
**STATUS: FINAL/AGREED**

Selected as the map data/source for the Chennai demonstration.

### Recharts
**STATUS: PROPOSED**

Discussed for dashboard charts.

## Backend

### Node.js + Express
**STATUS: PROPOSED**

Discussed as the backend stack.

## Database

### SQLite
**STATUS: FINAL/AGREED**

Selected for the local hackathon prototype.

The motivation discussed was:
- no deployment required
- local prototype
- rapid setup
- sufficient for demo users and complaints

The prototype may contain multiple demo users, officers/admins, complaints, Issues, evidence, statuses, departments, and jurisdictions.

### PostgreSQL + PostGIS
**STATUS: PROPOSED EARLIER / NOT CURRENTLY AGREED**

Discussed earlier as an option, but the later 12-hour local-prototype direction selected SQLite.

## AI

### Gemini
**STATUS: PROPOSED**

Discussed for image/text issue categorisation.

### Sarvam AI
**STATUS: FINAL/AGREED**

Selected/discussed for multilingual voice-to-text.

## Camera

### Browser/device camera APIs
**STATUS: PROPOSED**

Discussed as the mechanism for in-app camera capture.

## Location

### Browser/device geolocation
**STATUS: PROPOSED**

Discussed as the mechanism for obtaining device location.

## SMS
**STATUS: FINAL/AGREED FEATURE / UNDECIDED PROVIDER**

SMS notifications are a current feature, but the specific provider is not selected.

## Deployment Platforms
**STATUS: REJECTED FOR CURRENT SCOPE**

Vercel, Render, and Railway were discussed earlier but are not required because the team decided not to deploy the prototype.

## Architecture Boundary

**STATUS: FINAL/AGREED CONTEXT**

The team intends to build a local prototype rather than a production distributed system.

No separate production AI infrastructure or cloud deployment has been established.

---

# 13. Constraints and Assumptions

## C-01 — Time
**STATUS: FINAL/AGREED**

Approximately **12 hours** are available to build the prototype.

## C-02 — Local Demonstration
**STATUS: FINAL/AGREED**

The system will be demonstrated locally.

## C-03 — No Deployment
**STATUS: FINAL/AGREED**

Deployment is unnecessary for the hackathon prototype.

## C-04 — Chennai Demo Geography
**STATUS: FINAL/AGREED**

The demonstration uses Chennai.

## C-05 — Team-Provided Jurisdiction Data
**STATUS: FINAL/AGREED**

The team will supply its own demo jurisdiction data.

It must not be presented as official government data.

## C-06 — OpenStreetMap + Leaflet
**STATUS: FINAL/AGREED**

These are the selected mapping technologies for the prototype.

## C-07 — Prototype Database
**STATUS: FINAL/AGREED**

SQLite is intended for the local prototype.

## C-08 — Government Integration
**STATUS: NOT ESTABLISHED**

No government API or integration should be assumed to be available.

## C-09 — Authentication
**STATUS: UNDECIDED**

Authentication has not been finalised.

## C-10 — Production Completeness
**STATUS: FINAL/AGREED**

The system is a hackathon prototype and is not being specified as a production-ready municipal platform.

---

# 14. Risks and Known Problems

## R-01 — Photo Does Not Prove Truth
**STATUS: IDENTIFIED**

A geo-stamped photo improves evidence but does not automatically prove that a complaint is genuine.

## R-02 — EXIF May Be Missing
**STATUS: IDENTIFIED**

Photo EXIF location may be unavailable.

Device GPS therefore remains important.

## R-03 — GPS Accuracy
**STATUS: IDENTIFIED**

Device GPS can be inaccurate.

No exact accuracy threshold was finalised.

## R-04 — Service Complaints Cannot Always Be Photographed
**STATUS: IDENTIFIED**

Some service complaints have no useful physical evidence.

A different evidence approach is needed.

## R-05 — Scam / False Report Subjectivity
**STATUS: IDENTIFIED**

It may be difficult to objectively determine whether a complaint is a scam or false.

The conversation therefore moved toward evidence/suspicion assessment rather than automatically declaring reports fraudulent.

## R-06 — Duplicate Detection
**STATUS: IDENTIFIED**

Different citizens may describe the same issue differently or capture slightly different coordinates.

Exact duplicate thresholds remain unresolved.

## R-07 — Complaint Count Bias
**STATUS: IDENTIFIED**

Raw complaint count can produce unfair prioritisation.

The team therefore agreed conceptually on a broader risk score.

## R-08 — Risk Score Weighting
**STATUS: IDENTIFIED**

The risk factors are agreed, but exact weights are not final.

## R-09 — Resolution Evidence Limitations
**STATUS: IDENTIFIED**

Officer GPS/time/photo evidence can strengthen resolution verification but may not prove every aspect of completed work.

## R-10 — Community Report Manipulation
**STATUS: IDENTIFIED**

Repeated or malicious reports can artificially increase apparent community support.

Independent reporter logic is therefore important.

## R-11 — Privacy
**STATUS: IDENTIFIED**

Community issue views must not expose other citizens' personal information.

## R-12 — Jurisdiction Data Accuracy
**STATUS: IDENTIFIED**

The prototype uses team-provided Chennai data rather than an authoritative government dataset.

Therefore, the demo dataset must not be represented as official.

## R-13 — Government API Availability
**STATUS: IDENTIFIED**

No government APIs or integrations were confirmed.

Any future integration requires verification.

## R-14 — Twelve-Hour Scope
**STATUS: IDENTIFIED**

Trying to implement every official requirement at production quality within 12 hours could compromise the main end-to-end demonstration.

---

# 15. Open Questions

## Product

1. What is the final project name?
2. What exact authentication method will be used?
3. What exact citizen/officer/admin permissions will be used?
4. What exact status transition rules will be used?
5. What exact issue categories will be included?
6. What happens when AI categorisation confidence is low?
7. Can the citizen always override the AI category?

## Evidence

8. Will Evidence Confidence remain a formal product score or only an internal prototype signal?
9. What exact Evidence Confidence formula will be used?
10. What exact weights will Evidence Confidence use?
11. What exact physical-complaint verification rules will be used?
12. What exact service-complaint verification rules will be used?
13. What evidence threshold requires manual verification?

## Risk

14. What exact numeric weights will the agreed risk factors use?
15. How exactly will each factor be scored?
16. How will public exposure be measured?
17. How will vulnerable-population impact be determined from location?
18. How will recurrence be calculated?
19. How will duration be calculated after reopening?

## Duplicate Detection

20. What geographic distance threshold constitutes a duplicate candidate?
21. What categories are considered related?
22. What text similarity method will be used?
23. How should conflicting categories at the same location be handled?
24. When should a possible duplicate be automatically merged versus sent for review?

## GIS

25. What exact structure will the team's Chennai jurisdiction dataset have?
26. Which Chennai areas/wards/zones will be included in the demo data?
27. How will points near a jurisdiction boundary be handled?
28. What radius defines a "nearby" community Issue?
29. How exactly will the heatmap be calculated?

## Resolution

30. What exact GPS tolerance will be used for officer resolution verification?
31. What exact checks must pass for automatic resolution verification?
32. What happens when officer location evidence is unavailable?
33. What happens when citizen GPS is unavailable?
34. Does citizen reopening automatically increase priority?

## SMS

35. Which SMS provider will be used?
36. Will a mock SMS fallback be used if the provider is unavailable?

## AI

37. What exact Gemini model/service will be used?
38. What exact categorisation prompt/output schema will be used?
39. What exact languages will be demonstrated through Sarvam AI?
40. What happens when Sarvam transcription fails?

## Existing Systems

41. What current Swachhata-MoHUA location capabilities can be verified?
42. What current CPGRAMS capabilities can be verified?
43. What current GCC capabilities can be verified?
44. What exact comparison claims can be supported with reliable evidence?

---

# 16. Future Documentation Dependencies

This master context is intended to feed the following later documents.

## 16.1 Requirements
Convert official requirements and agreed scope into precise functional/non-functional requirements without adding unsupported features.

## 16.2 User Flows
Define the exact:
- citizen reporting flow
- offline flow
- status flow
- community issue flow
- officer workflow
- resolution flow
- citizen confirmation/reopen flow

## 16.3 Feature Specification
Decide which `PROPOSED` items become actual prototype features and define their exact behavior.

## 16.4 Database
Define:
- tables/entities
- relationships
- fields
- statuses
- evidence
- complaints vs Issues
- users/officers/departments
- jurisdictions
- notifications

## 16.5 API Contract
Define:
- endpoints
- inputs
- outputs
- errors
- authentication
- status transitions
- file handling

## 16.6 AI Specification
Define:
- categorisation
- supported categories
- image/text input
- model/service
- output format
- confidence
- fallback
- Sarvam voice-to-text

## 16.7 GIS Specification
Define:
- device location
- Chennai demo data
- jurisdiction lookup
- geographic distance
- duplicate detection
- nearby Issues
- map
- heatmap

## 16.8 UI Design
Define:
- citizen screens
- officer screens
- report screen
- camera
- status history
- community map
- officer map
- dashboard
- resolution screen

## 16.9 Security
Define:
- authentication
- authorisation
- privacy
- evidence integrity
- location handling
- image access
- abuse prevention

## 16.10 Demo Scenario
Define the exact deterministic hackathon demonstration sequence.

## 16.11 Definition of Done
Define what must work for the prototype to be considered complete.

---

# 17. Final Context Summary

The project is being developed for **Hackathon Problem Statement 5: Crowd Sourced Civic Issue Reporting and Resolution**.

The official problem concerns citizens having unreliable ways to report civic problems such as potholes, garbage, broken streetlights, overflowing drains, and damaged footpaths. Existing complaint channels may result in inconsistent logging, incorrect routing, lost complaints, poor citizen visibility, and poor municipal visibility into issue location and urgency.

The team's product concept is a **location-aware, evidence-backed civic issue reporting and resolution platform**.

The primary physical complaint flow uses an **in-app camera**. When a citizen captures an image, the application records the device's **GPS location and timestamp**. Photo EXIF location may also be checked when available. The citizen provides a short text description or uses voice input. **Sarvam AI** is intended for multilingual voice-to-text, while AI categorisation is intended to analyse the photo/text and identify the issue category.

A major agreed concept is **automatic jurisdiction detection**. Citizens should not have to manually decide whether the area is a corporation, municipality, panchayat, rural/urban area, etc. The intended concept is to use the complaint location to determine the relevant jurisdiction and then route the issue to the responsible department/officer.

The prototype is specifically focused on **Chennai**. The map will use **OpenStreetMap and Leaflet**. The team will provide its **own Chennai jurisdiction/demo data**; this must not be represented as an authoritative government dataset.

The project distinguishes an individual **Complaint/Report** from an underlying real-world **Issue**. Multiple citizens can report the same pothole or other problem. Those individual complaints should be associated with one Issue when appropriate rather than being treated as separate real-world problems. Duplicate detection is intended to consider location and issue similarity, but exact thresholds remain unresolved.

The team also discussed **community corroboration**, where independent citizens reporting the same or similar issue can strengthen confidence. Repeated reports from one citizen should not be treated as equivalent to independent reporters.

The project distinguishes **Evidence Confidence** from **Risk/Priority**. Evidence Confidence is currently **PROPOSED** and represents how strongly the available information supports that an issue exists. It should not automatically declare a report or citizen fraudulent. Risk/Priority is a **FINAL/AGREED concept** and is intended to determine urgency using multiple factors rather than complaint count alone.

The agreed risk-factor set is:

- Severity
- Public Exposure
- Vulnerable Population Impact
- Critical Infrastructure Impact
- Duration
- Community Corroboration
- Recurrence
- Evidence Confidence

The exact weights and detailed scoring rules remain unresolved.

The team recognises that service complaints, such as lack of water supply, cannot always be verified through photographs. Such complaints may require location, time, independent reports, geographic clustering, duration, or other evidence. The exact service-verification process remains unresolved.

The officer side includes a **jurisdiction-based dashboard** showing relevant issues, their status, priority/severity, evidence, and geographic information. A map and heatmap are part of the current product concept, although their exact GIS implementation remains to be specified.

A major agreed differentiator is **resolution verification**. When an officer claims that an issue has been resolved, the officer should capture a fresh image using the application, together with location and timestamp. The system should cross-reference this resolution evidence with the original citizen complaint. A mismatch should result in a verification/manual-review condition rather than automatically accusing the officer of fraud.

Citizens should then be able to **confirm the resolution or reopen the issue**.

**SMS status notifications are a current prototype feature.** Citizens are intended to receive updates as their complaint moves through its lifecycle, including submission, acknowledgement, ongoing work, resolution, and reopening. The specific SMS provider remains undecided.

The official problem statement also requires offline reporting. The intended concept is that a citizen can capture a complaint without connectivity, store it locally, and submit/synchronise it when connectivity returns.

The current prototype is constrained to approximately **12 hours**, will be developed using **Antigravity**, will run locally, and does not need deployment.

The currently discussed technical context is:
- React + Vite — proposed frontend
- Tailwind CSS — proposed styling
- PWA — proposed offline-capable web application approach
- Dexie.js / IndexedDB — proposed offline storage
- Node.js + Express — proposed backend
- **SQLite — final/agreed prototype database**
- Leaflet — final/agreed map library
- OpenStreetMap — final/agreed map source
- Gemini — proposed AI categorisation service
- Sarvam AI — final/agreed voice-to-text service
- Browser/device camera APIs — proposed camera mechanism
- Browser/device geolocation — proposed location mechanism

No deployment is required.

The team discussed existing systems including **Swachhata-MoHUA, CPGRAMS, and GCC civic services**. These should be used carefully in later research/presentation documents. The conversation does not establish authoritative details about their current APIs, datasets, technical capabilities, or exact limitations. Such claims must be externally verified.

The project's core conceptual lifecycle is:

**Capture → Locate → Categorise → Verify → Merge → Prioritise → Route → Resolve → Geo-Verify → Notify → Citizen Confirm**

The most important unresolved areas are:
- authentication
- exact status transitions
- exact AI model/service
- final issue categories
- Evidence Confidence implementation
- exact Risk Score weights
- duplicate thresholds
- Chennai demo jurisdiction structure
- exact GIS thresholds
- exact resolution-verification rules
- SMS provider

This file should preserve those items as unresolved until the team deliberately decides them in later documentation.

