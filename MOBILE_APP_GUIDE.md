# 📱 CITIZEN Mobile App — Complete Step-by-Step Guide

This guide walks you through converting the CITIZEN web app into a native **Android APK** (and optionally iOS IPA) using **Capacitor** by Ionic. No code rewrite needed — your existing React + Vite app gets wrapped in a native shell with full access to the device camera, GPS, and more.

---

## Architecture Overview

```
┌──────────────────────────────────────────────┐
│            Native Android / iOS Shell        │
│  ┌────────────────────────────────────────┐  │
│  │        Capacitor WebView               │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │   Your React + Vite App (dist/)  │  │  │
│  │  │   (Exact same code as web)       │  │  │
│  │  └──────────────────────────────────┘  │  │
│  │            ↕ Capacitor Bridge          │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │  Native Plugins (Camera, GPS)    │  │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│   Connects to → your backend server         │
│   (Express API at your deployed URL or LAN) │
└──────────────────────────────────────────────┘
```

**Key insight**: The mobile app is a thin native wrapper. Your React code runs inside it identically to how it runs in a browser. The backend (Express + SQLite) stays on a server — the app talks to it over HTTP.

---

## Prerequisites

| Tool | Purpose | Install |
|---|---|---|
| **Node.js** v18+ | Already installed | — |
| **Android Studio** | Build the APK | [Download](https://developer.android.com/studio) |
| **Java JDK 17** | Required by Android Studio | Usually bundled with Android Studio |
| **Xcode** *(Mac only)* | Build for iOS | Mac App Store |

> [!IMPORTANT]
> **Android Studio setup**: After installing, open it once and go to **SDK Manager → SDK Tools** and make sure **Android SDK Build-Tools**, **Android SDK Command-line Tools**, and **Android SDK Platform-Tools** are all checked and installed.

---

## Step 1: Build the Production Web App

Your Vite app needs to be compiled into static files first.

```bash
cd c:\Users\RajaSN\Desktop\Hackfusion_CIT\Round-2\citizen

# Build the frontend into the dist/ folder
npm run build
```

This creates a `dist/` folder with your entire compiled React app (HTML, JS, CSS, assets).

> [!NOTE]
> The `dist/` folder is what Capacitor will bundle inside the native app. The backend (Express server) is NOT included — it runs separately on a server.

---

## Step 2: Install Capacitor

```bash
# Install Capacitor core + CLI
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor (interactive prompts)
npx cap init
```

When prompted:
| Prompt | Value |
|---|---|
| App name | `CITIZEN` |
| App Package ID | `com.citizen.app` |
| Web asset directory | `dist` |

This creates a `capacitor.config.ts` file. Verify it looks like this:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.citizen.app',
  appName: 'CITIZEN',
  webDir: 'dist',
  server: {
    // IMPORTANT: Point to your deployed backend or local network IP
    // For local dev with phone on same WiFi:
    // url: 'http://192.168.x.x:3000',
    // cleartext: true,
    
    // For production, remove this block entirely —
    // the app will use relative URLs which resolve to
    // wherever you host your backend.
  }
};

export default config;
```

---

## Step 3: Add Android Platform

```bash
# Install the Android platform package
npm install @capacitor/android

# Generate the Android project
npx cap add android
```

This creates an `android/` folder inside your project containing a full Android Studio project.

---

## Step 4: Install Native Plugins (Camera, GPS, Haptics)

These give your app native-quality access to device hardware instead of relying on browser APIs:

```bash
npm install @capacitor/camera @capacitor/geolocation @capacitor/haptics @capacitor/status-bar
```

### Configure Android Permissions

Open `android/app/src/main/AndroidManifest.xml` and add these permissions inside the `<manifest>` tag (before `<application>`):

```xml
<!-- Camera -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />

<!-- GPS -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Microphone (for voice input) -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- Network (to reach your backend) -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## Step 5: Connect the App to Your Backend

The mobile app needs to know WHERE your Express backend is running. You have two options:

### Option A: Local Development (Phone + PC on same WiFi)

1. Find your PC's local IP address:
   ```bash
   # PowerShell
   ipconfig | findstr /i "IPv4"
   ```
   Example output: `IPv4 Address: 192.168.1.42`

2. Update `capacitor.config.ts`:
   ```typescript
   server: {
     url: 'http://192.168.1.42:3000',
     cleartext: true,  // Allow HTTP (not HTTPS)
   }
   ```

3. Make sure your Express server is running on your PC (`npm run dev`).

### Option B: Deployed Backend (Production)

If you deploy your backend to a cloud service (Render, Railway, etc.), just set:
```typescript
server: {
  url: 'https://your-citizen-backend.onrender.com',
}
```

> [!WARNING]
> If using Option A (local dev), your phone and PC **must** be on the same WiFi network. Also ensure Windows Firewall isn't blocking port 3000.

---

## Step 6: Sync & Build

```bash
# Rebuild the web app
npm run build

# Copy the dist/ folder into the Android project
npx cap sync
```

> [!TIP]
> Run `npx cap sync` every time you change your React code. It copies the latest `dist/` into the native project.

---

## Step 7: Open in Android Studio & Run

```bash
npx cap open android
```

This opens the project in Android Studio. Then:

1. **Wait** for Gradle to finish syncing (progress bar at bottom).
2. **Connect** your Android phone via USB (enable **Developer Options → USB Debugging**).
3. Select your device from the dropdown at the top.
4. Click the **▶ Run** button (green play icon).
5. The CITIZEN app installs and launches on your phone!

### To generate a signed APK for distribution:

1. In Android Studio: **Build → Generate Signed Bundle / APK**
2. Choose **APK**
3. Create a new keystore (or use existing)
4. Select **release** build variant
5. Click **Create** — your APK will be in `android/app/release/`

---

## Step 8: Live Reload During Development (Optional)

For rapid iteration without rebuilding the APK every time:

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Set your `capacitor.config.ts`:
   ```typescript
   server: {
     url: 'http://192.168.1.42:3000',  // Your PC's LAN IP
     cleartext: true,
   }
   ```

3. Run:
   ```bash
   npx cap sync
   npx cap run android
   ```

Now every code change you make on your PC appears instantly on the phone!

---

## Quick Reference — Command Cheat Sheet

| Action | Command |
|---|---|
| Build web app | `npm run build` |
| Sync to Android | `npx cap sync` |
| Open Android Studio | `npx cap open android` |
| Run on connected device | `npx cap run android` |
| Add iOS (Mac only) | `npx cap add ios` |
| Open Xcode (Mac only) | `npx cap open ios` |

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Blank white screen on phone | Check `capacitor.config.ts` → `webDir` is set to `dist` and you ran `npm run build` |
| "Cannot connect to server" | Ensure `server.url` points to correct IP, phone is on same WiFi, firewall allows port 3000 |
| Camera doesn't open | Ensure `android.permission.CAMERA` is in `AndroidManifest.xml` and you accepted the permission prompt |
| GPS returns null | Ensure location permissions are granted in phone Settings, and `ACCESS_FINE_LOCATION` is in manifest |
| Gradle sync fails | In Android Studio: File → Invalidate Caches → Restart |
