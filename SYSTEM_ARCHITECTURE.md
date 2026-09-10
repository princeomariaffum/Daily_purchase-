# Kuapa Kokoo Daily Purchase Platform - System Architecture & Implementation Guide

This document serves as the master blueprint and implementation guide for the entire Kuapa Kokoo Daily Purchase data collection platform.

---

## 1. High-Level Architecture

The system is composed of three decoupled applications communicating via RESTful APIs:
1. **Mobile Application (Field Officers):** React Native (Expo) app for offline-first data collection.
2. **Web Application (Managers/Admin):** Vite + React app for data visualization and management.
3. **Backend API (Server):** Python Django backend using Django REST Framework (DRF) and PostgreSQL.

---

## 2. Technology Stack

- **Backend:** Python 3, Django, Django REST Framework, SimpleJWT, PostgreSQL (SQLite for local dev).
- **Web App:** React 19, Vite, Tailwind CSS v4, React Router, Axios, Lucide React (Icons).
- **Mobile App:** React Native, Expo, AsyncStorage, Axios, UUID.

---

## 3. Database Schema

The database strictly mirrors the physical Kuapa Kokoo Daily Purchase Records book.

### 3.1 `PurchaseSession` (The Waybill Header)
Represents a single data collection session or a physical page/waybill.
- `id`: Primary Key
- `cocoa_season`: String (e.g., "2025-2026")
- `zone_name`: String
- `society_district_name`: String
- `zone_station`: String
- `waybill_no`: String
- `dprs_number`: String (Nullable)
- `created_at`: DateTime
- *Virtual Fields:* `total_kilos`, `total_bags` (kilos/62.5), `total_amount`

### 3.2 `PurchaseRecord` (The Farmer Rows)
Represents individual farmer entries under a specific Waybill.
- `id`: Primary Key
- `session`: ForeignKey -> `PurchaseSession`
- `date`: Date
- `farmer_name`: String
- `farmer_status`: Choice ("Existing", "New")
- `cocoa_card_id`: String
- `kk_id`: String (Nullable)
- `kilos`: Float
- `amount_ghc`: Float

---

## 4. Mobile App Implementation (Offline-First)

Because field officers operate in areas with poor or no network connectivity, the mobile app utilizes an **"Outbox Pattern"**.

### Flow:
1. **Authentication:** Officer logs in while they have internet. The JWT token is saved securely on the device.
2. **Data Entry:** Officer travels to a remote farm. They open the app and enter data into the repeating form (replicating Survey123/physical books).
3. **Local Storage:** When they click "Save", the app validates the data, generates a local UUID, and saves the JSON payload to the device's `AsyncStorage` (the Outbox). *No network requests are made.*
4. **Syncing:** When the officer returns to an area with internet access, they navigate to the "Outbox" tab and press "Sync". The app iterates through all locally saved payloads and `POST`s them to the Django `/api/sessions/` endpoint with the JWT attached. Successfully synced items are removed from local storage.

---

## 5. Web App Implementation

The Web App serves as a real-time dashboard for administrators.
- **Protected Routes:** All routes except `/login` check for a valid JWT in React Context/Local Storage.
- **Dashboard:** Fetches data from `/api/sessions/` and aggregates top-level statistics (Total Kilos, Total Bags, Total GHC).
- **Visuals:** Uses modern CSS frameworks (Tailwind) to present data in clean, sortable tables and eventual charts.

---

## 6. Implementation Roadmap

### Phase 1: Foundation & Architecture (Completed ✅)
- Initialized Django backend and mapped the physical Kuapa Kokoo schema to models.
- Bootstrapped the Vite React Web App and configured Tailwind CSS.
- Scaffolding the React Native mobile app with basic SQLite/AsyncStorage wrappers.

### Phase 2: Authentication & Security (In Progress 🚧)
- Securing the Django API with `djangorestframework-simplejwt`.
- Building Login screens for the Mobile App (storing tokens locally).
- Building Login screens for the Web App (implementing protected React routes).

### Phase 3: Core Features Refinement
- Adding robust form validations on the mobile app.
- Building out time-series charts on the Web Dashboard to visualize daily purchases.

### Phase 4: Advanced Features
- **Geolocation:** Capturing GPS coordinates when a mobile session is saved.
- **Exporting:** Adding CSV/Excel download buttons to the Web App for managers.

### Phase 5: Testing & Deployment
- E2E testing of the mobile offline sync logic.
- Deploying Django to Render/Heroku and PostgreSQL.
- Deploying Web App to Vercel.
- Packaging Mobile App into an Android APK.
