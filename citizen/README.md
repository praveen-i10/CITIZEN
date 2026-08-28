<div align="center">
  <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: linear-gradient(to top right, #2563eb, #06b6d4); border-radius: 16px; margin-bottom: 16px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.5);">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
  </div>
  <h1>CITIZEN Platform</h1>
  <p>Evidence-Backed Civic Issue Resolution · Hackfusion CIT</p>
</div>

---

## Overview

**CITIZEN** is an AI-powered, closed-loop civic issue resolution platform. It bridges the gap between citizens reporting infrastructure issues (like potholes, broken streetlights, or sanitation hazards) and municipal officers tasked with resolving them. 

The platform leverages AI for automated categorization and validation, GIS mapping for real-time hotspot detection, and a role-based architecture to streamline municipal operations from report to resolution.

---

## Tech Stack & Architecture

The project is built on a modern, monolithic React/Node architecture optimized for rapid development and high performance.

### 🎨 Frontend
* **React 18 & TypeScript**: Core UI framework ensuring strict type safety and component reusability.
* **Vite**: Ultra-fast build tool and development server, acting as a proxy to the local backend during development.
* **Tailwind CSS v4**: Utility-first CSS framework used for rapid, responsive, and beautiful glassmorphic UI design.
* **Framer Motion**: Animation library powering fluid page transitions, modal popups, and micro-interactions.
* **Lucide React**: Clean, consistent vector iconography.
* **Recharts**: Composable charting library used in the Admin Dashboard to visualize resolution metrics.
* **Leaflet**: Open-source interactive mapping library used for the Citizen Nearby Issues map, Officer Dashboard, and Admin Hotspot tracking.

### ⚙️ Backend & Storage
* **Node.js & Express**: Lightweight backend server handling API routes, authentication, and file processing.
* **better-sqlite3**: Extremely fast, synchronous SQLite3 library for Node.js, used for local database persistence without requiring a separate DB server.
* **Bcrypt.js**: Security library used for hashing and verifying user passwords during authentication.
* **Multer**: Middleware for handling `multipart/form-data`, primarily used for processing image and audio uploads.

### 🧠 AI & Specialized Engines
* **Google Gemini (GenAI SDK)**: Powers the `gemini-1.5-flash` model which analyzes uploaded images to automatically detect the issue category (pothole, garbage, etc.), assess severity, and instantly reject false positives (e.g., selfies).
* **Sarvam AI API**: Multilingual Speech-to-Text engine used to transcribe voice reports spoken in regional languages (Tamil) and English directly into text.
* **Exifr**: Specialized parser used to extract raw GPS coordinates (Latitude/Longitude) directly from photo EXIF data to prevent manual location spoofing.

---

## Core Features

1. **AI-Validated Reporting**: Citizens capture photos and record voice descriptions. AI automatically rejects invalid photos, categorizes the issue, assigns a priority score, and parses the voice to text.
2. **Anti-Spoofing & Geolocation**: Uses real device GPS (`navigator.geolocation`) and EXIF data extraction to accurately pin issues on the map, preventing fraudulent reports.
3. **Role-Based Workflows**: 
   - **Citizens**: Report issues and view nearby problems.
   - **Officers**: View their assigned queue, navigate to sites, and upload resolution proof.
   - **Admins**: View city-wide metrics, GIS hotspot clusters, and automated SMS dispatch logs.
4. **Offline Resilience**: Reports created without network connectivity are queued in `localStorage` and automatically synced to the server once the connection is restored.
5. **Secure Authentication**: Password-protected accounts with role-based access control and persistent session management.

---

## Getting Started

### Prerequisites
* Node.js (v18+ recommended)
* API Keys for Google Gemini and Sarvam AI

### Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy the example environment file and add your actual API keys.
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to include your `GEMINI_API_KEY` and `SARVAM_API_KEY`.*

3. **Start the Platform**
   ```bash
   npm run dev
   ```
   *This command starts both the Vite frontend server and the Node/Express backend concurrently.*

4. **Access the App**
   Open your browser to `http://localhost:5173`. You can log in using one of the pre-seeded demo accounts (e.g., `priya123`, `officer123`, `admin123`).
