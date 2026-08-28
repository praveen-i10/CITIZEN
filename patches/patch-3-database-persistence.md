# Patch 3: Database & Persistence Loopholes

## Overview
Migrate the application from volatile in-memory storage to a persistent relational SQLite database to ensure data integrity and persistence.

## Issues to Address
1. **In-Memory Volatility vs. SQLite Mandate (04_DATABASE.md NFR-07)**
   - **Current State:** `database.ts` uses volatile in-memory arrays (`this.issues`, `this.complaints`). All data is lost on server restart, despite the mandate for a local SQLite database with parameterized SQL queries.
   - **Goal:** Replace in-memory arrays with a local SQLite database setup and rewrite queries to use parameterized SQL.

2. **Missing Entity Tables**
   - **Current State:** Tables specified in `04_DATABASE.md` (`issue_evidence_signals` §3.9 and a persistent hotspots materialization table §3.10) are collapsed into ephemeral helper functions.
   - **Goal:** Model and create the missing tables (`issue_evidence_signals`, hotspots materialization) as proper relational tables in the SQLite schema.

3. **Cascade & Orphan Handling on Duplicate Merges**
   - **Current State:** When duplicate reports are merged (`resolveDuplicateDecision`), orphaned issues are manually sliced from arrays, lacking foreign key consistency.
   - **Goal:** Utilize SQLite foreign key constraints (e.g., `ON DELETE CASCADE` or standard relational linking) to handle orphaned records correctly when duplicates are merged.
