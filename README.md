# 🩸 Saving Lives — BloodLink AI
### Real-Time Emergency Blood Availability & Intelligent Donor Response Platform

**Saving Lives (BloodLink AI)** is an emergency medical command center platform that bridges Blood Donors, Hospitals, and Central Blood Banks in real time to reduce critical delays in emergency blood procurement.

Built with a high-tech tactical emergency command center UI, real-time geofence tracking via OpenStreetMap & Leaflet, an intelligent 4-factor donor matching algorithm, and an automated multi-tier emergency escalation engine.

---

## 🌟 Key Capabilities

### 1. 🎯 Intelligent Donor Matching Engine
Automatically computes and ranks compatible donors based on:
$$\text{Match Score} = 40\% \text{ Compatibility} + 25\% \text{ Distance} + 20\% \text{ Availability} + 15\% \text{ Trust Score}$$
* **Live Radar & Geofence Proximity**: Haversine distance tracking from hospital trauma units.
* **Instant Siren & Pager Alerts**: Web Audio API synthetic alert tones and push alert dispatching.

### 2. 🚨 Automated Emergency Escalation Engine
If blood cannot be immediately sourced locally, the platform systematically escalates through perimeter tiers visualized as an animated timeline:
1. **Nearby Donors** (0 – 5 km)
2. **Expanded Radius Search** (25 km)
3. **Central Blood Banks** (50 km cold storage)
4. **Nearby Hospitals** (75 km trauma center reserves)
5. **District Alert** (150 km Red Cross & civil defense mobilization)
6. **State Alert** (300 km air / drone transport standby)
7. **Blood Secured** (Bedside delivery & transfusion)

### 3. 👥 Multi-Role Command Portals
* **Volunteer Donor Portal**:
  * Profile card with Trust Score, Lives Saved, and verified blood group.
  * 4-state Duty Toggle: 🟢 *Available Now*, 🟡 *Available Today*, 🟠 *Busy*, 🔴 *Unavailable*.
  * Real-time emergency request feed with 1-tap **Accept & Save Life** action.
  * Interactive GIS geofence map of nearby hospitals and active blood requisitions.
  * Achievement Badges (*First Donation*, *Life Saver*, *Hero Donor*, *Platinum Donor*).
  * Cryptographically verified digital certificates with printable / PDF commendation card.
* **Hospital Trauma Command Desk**:
  * Status KPIs (*Active Requests*, *Donors Contacted*, *Blood Secured*, *Fulfilled Cases*).
  * Emergency blood request creation with priority tagging (🔴 Critical, 🟡 Urgent, 🟢 Normal).
  * Dynamic ranked donor matching feed with instant dispatch sirens.
  * Direct manual and automated perimeter escalation controls.
* **Central Blood Bank Portal**:
  * Complete 8-blood group inventory management: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`.
  * Real-time available units, reserved units, expiry alerts, and low stock warnings.
  * Actions: **Add Units**, **Remove Units**, **Reserve / Hold Units**, and **Release Units**.
  * Cold storage capacity utilization monitor.
* **National System Admin Console**:
  * Real-time emergency demand telemetry and blood group matrices.
  * Donor field readiness distribution.
  * Entity accreditation and verification management for hospitals and blood banks.
  * Live system audit trail terminal.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, Lucide Icons, Leaflet / OpenStreetMap |
| **Aesthetics** | Military Medical Command Center Dark Mode (`#080C16`), Glassmorphism, Web Audio API Alerts |
| **Backend** | Node.js, Express.js, JWT, Nodemailer, Bcrypt |
| **Database** | MongoDB Atlas / Mongoose + Resilient Embedded JSON Storage Engine fallback |
| **APIs** | RESTful endpoints for Auth, Requests, Matching, Inventory, Donors, Admin |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* Node.js v18+ (tested on Node v25)
* npm v9+

### 2. Running Locally

Both the server and client can be launched effortlessly:

#### Option A: Run Server & Client Independently

**Terminal 1 (Backend API Server):**
```bash
cd server
npm install
npm start
```
*Backend runs on: `http://localhost:5000`*

**Terminal 2 (Frontend Client):**
```bash
cd client
npm install
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

---

## ⚡ Instant Demo Credentials

The platform includes a **1-Click Quick Demo Switcher** at the top of every screen. You can also sign in manually using these pre-seeded accounts:

| Role | Email | Password | Details |
|---|---|---|---|
| **Donor** | `donor@savinglives.org` | `password123` | Karthik S. (O+ Universal, Trust 98%) |
| **Hospital** | `hospital@psgims.org` | `password123` | PSG Institute of Medical Sciences & Research |
| **Blood Bank** | `bloodbank@rotary.org` | `password123` | Rotary Metro Blood Bank |
| **Admin** | `admin@savinglives.org` | `admin123` | Dr. Vikram Sarabhai (Superuser) |

*For SMS / Email OTP verification simulation during donor registration, you can use the displayed code or master code `777777`.*

---

## 📁 Repository Structure

```
d:/psgclg 3/
├── client/                     # React + Vite + Tailwind Frontend
│   ├── src/
│   │   ├── components/         # LiveMap, EscalationTimeline, MatchingCalculator, etc.
│   │   ├── context/            # AuthContext with 1-click role switcher
│   │   ├── pages/              # LandingPage, Donor, Hospital, BloodBank, Admin, Auth
│   │   ├── services/api.js     # Centralized API client
│   │   ├── utils/              # Web Audio API sound generator
│   │   ├── App.jsx             # Router and layout
│   │   └── main.jsx
│   ├── vite.config.js          # Reverse proxy to :5000
│   └── package.json
├── server/                     # Node.js + Express Backend
│   ├── config/db.js            # Dual MongoDB / Embedded JSON DB Connector
│   ├── controllers/            # auth, request, match, inventory, admin, donor
│   ├── middleware/             # authMiddleware (JWT & roles)
│   ├── models/                 # Mongoose schemas (User, Donor, Hospital, etc.)
│   ├── routes/                 # REST API endpoints
│   ├── seed/seedData.js        # Rich dataset (Coimbatore Medical Hub GPS coordinates)
│   ├── services/               # matchingEngine.js, escalationEngine.js, otpService.js
│   ├── server.js               # Express application entry
│   └── package.json
├── package.json                # Root automation scripts
└── README.md                   # Full platform documentation
```

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Health check & system status |
| `/api/auth/login` | `POST` | Authenticate any role and issue JWT |
| `/api/auth/register/donor` | `POST` | Register donor with Aadhaar and email OTP |
| `/api/auth/register/hospital` | `POST` | Register hospital with medical license |
| `/api/auth/register/bloodbank` | `POST` | Register blood bank with NACO accreditation |
| `/api/requests` | `GET`, `POST` | List and create emergency blood requests |
| `/api/requests/:id/escalate` | `POST` | Escalate request to next perimeter stage |
| `/api/requests/:id/respond` | `POST` | Donor accepts or declines emergency request |
| `/api/requests/:id/dispatch` | `POST` | Dispatch audible sirens & alerts to donors |
| `/api/match/calculate` | `POST` | 40/25/20/15 weighted donor matching calculation |
| `/api/inventory` | `GET` | Aggregate blood inventory across banks |
| `/api/inventory/:id/action` | `POST` | Add, remove, reserve, or release blood units |
| `/api/donors/:id/availability`| `PATCH` | Update donor duty availability status |
| `/api/admin/overview` | `GET` | System-wide analytics and demand matrix |
| `/api/admin/verify` | `POST` | Approve, verify, or suspend accounts |
