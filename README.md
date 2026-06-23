<div align="center">

<img src="https://raw.githubusercontent.com/snbinnovations005-coder/RouteOptimizer/main/assets/showcase.webp" alt="RouteOptimizer Showcase" width="100%" />

<h1>RouteOptimizer</h1>

<p><strong>Solve real-world multi-stop driving routes in one click — powered by Google Routes API v2 \& TSP optimization</strong></p>


[![Next.js](https://img.shields.io/badge/Next.js\_16-000000?style=for-the-badge\&logo=nextdotjs\&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React\_19-61DAFB?style=for-the-badge\&logo=react\&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript\_5-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind\_CSS\_v4-06B6D4?style=for-the-badge\&logo=tailwindcss\&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge\&logo=postgresql\&logoColor=white)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma\_6-2D3748?style=for-the-badge\&logo=prisma\&logoColor=white)](https://prisma.io)

[![Stars](https://img.shields.io/github/stars/snbinnovations005-coder/RouteOptimizer?style=for-the-badge\&color=FFD700)](https://github.com/snbinnovations005-coder/RouteOptimizer/stargazers)
[![Forks](https://img.shields.io/github/forks/snbinnovations005-coder/RouteOptimizer?style=for-the-badge\&color=4ECDC4)](https://github.com/snbinnovations005-coder/RouteOptimizer/network)
[![Issues](https://img.shields.io/github/issues/snbinnovations005-coder/RouteOptimizer?style=for-the-badge\&color=FF6B6B)](https://github.com/snbinnovations005-coder/RouteOptimizer/issues)
[![License](https://img.shields.io/github/license/snbinnovations005-coder/RouteOptimizer?style=for-the-badge)](LICENSE)

</div>

\---

## 📖 Overview

**RouteOptimizer** is a full-stack web application that solves the **Travelling Salesman Problem (TSP)** for real driving routes. Paste up to **10 Google Maps links**, click **⚡ Optimize Route**, and the system computes the shortest multi-stop driving path with live traffic awareness — rendered on an interactive map with distance and duration stats.

> \*\*Real-world use case:\*\* A delivery driver starts at a known location, visits multiple customer stops, and ends at a fixed shop. RouteOptimizer finds the fastest order through all intermediate stops automatically.

\---

## ✨ Features

* **⚡ TSP Optimization** — Solves multi-stop Travelling Salesman Problem via Google Routes API v2 with `optimizeWaypointOrder: true`
* **🗺️ Interactive Map** — Color-coded numbered markers (up to 10 stops), animated polyline, auto-fit bounds
* **🔗 Smart URL Parsing** — Accepts full Google Maps links, short `maps.app.goo.gl` links, place URLs, or plain `lat,lng`
* **💾 Route Caching** — MD5-keyed PostgreSQL cache prevents duplicate API calls for identical routes
* **🏷️ Domain Labels** — Driver 🚕 and Shop 🏪 InfoWindows pinned permanently on first and last stops
* **📊 Cost Dashboard** — Live Google Cloud API cost matrix with real-time USD → INR conversion
* **🧾 API Audit Logs** — Swagger-style split-pane `/logs` page showing every request + response payload
* **🚦 Traffic-Aware Routing** — `TRAFFIC\_AWARE` routing preference for real driving estimates

\---

## 🛠️ Tech Stack

|Layer|Technology|Version|Role|
|-|-|-|-|
|Framework|Next.js (App Router)|16.2.9|SSR, API routes, file-based routing|
|UI|React|19.2.4|Component rendering|
|Language|TypeScript|5.x|End-to-end type safety|
|Styling|Tailwind CSS|v4|Utility-first CSS|
|Maps SDK|@vis.gl/react-google-maps|1.8.3|Map rendering + geometry decode|
|ORM|Prisma|6.19.3|DB access + schema migrations|
|Database|PostgreSQL|any|Route cache + API audit logs|
|Routes API|Google Routes REST v2|v2|TSP computation + polyline|

\---

## 📱 Screenshots

<p align="center">
  <img src="https://github.com/snbinnovations005-coder/RouteOptimizer/blob/main/assets/screen_1.png" width="23%" alt="Input Panel" />
  \&nbsp;
  <img src="https://github.com/snbinnovations005-coder/RouteOptimizer/blob/main/assets/screen_2.png" width="23%" alt="Optimized Route Map" />
  \&nbsp;
  <img src="https://github.com/snbinnovations005-coder/RouteOptimizer/blob/main/assets/screen_3.png" width="23%" alt="Result Panel" />
  \&nbsp;
  <img src="https://github.com/snbinnovations005-coder/RouteOptimizer/blob/main/assets/screen_4.png" width="23%" alt="API Logs Dashboard" />
</p>

<p align="center">
  <sub>① Input Panel \&nbsp;\&nbsp;② Optimized Route \&nbsp;\&nbsp;③ Result Stats \&nbsp;\&nbsp;④ API Logs Dashboard</sub>
</p>

\---

## 🚀 Getting Started

### Prerequisites

* **Node.js** 20+
* **PostgreSQL** (local or remote)
* **Google Cloud** project with **Routes API** + **Maps JavaScript API** both enabled
* Two separate API keys (one server-side, one public — see [Environment Variables](#-environment-variables))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/snbinnovations005-coder/RouteOptimizer.git
cd RouteOptimizer

# 2. Install dependencies
npm install

# 3. Set up environment variables (see section below)
cp .env.example .env

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

\---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL connection string (Prisma reads this)
DATABASE\_URL="postgresql://USER:PASSWORD@localhost:5432/routeoptimizer"

# Server-side key — used by /api/route proxy, NEVER exposed to the browser
GOOGLE\_MAPS\_API\_KEY="AIza..."

# Public key — only for Maps JS SDK tile rendering (browser-safe)
NEXT\_PUBLIC\_GOOGLE\_MAPS\_API\_KEY="AIza..."
```

> \*\*Security:\*\* `GOOGLE\_MAPS\_API\_KEY` (no `NEXT\_PUBLIC\_` prefix) calls the Routes REST API server-side — it never reaches the client bundle. Restrict `NEXT\_PUBLIC\_GOOGLE\_MAPS\_API\_KEY` to HTTP referrers in Google Cloud Console.

\---

## 🗂️ Project Structure

```
RouteOptimizer/
├── prisma/
│   └── schema.prisma              ← Models: Location, Route, ApiLog
├── src/
│   ├── app/
│   │   ├── layout.tsx             ← Root shell (Geist font + metadata)
│   │   ├── page.tsx               ← Home — mounts MapComponent
│   │   └── api/
│   │       ├── route/route.ts     ← POST /api/route (Google Routes proxy + cache)
│   │       ├── expand/route.ts    ← POST /api/expand (short link resolver)
│   │       └── log/route.ts       ← POST /api/log (API audit logger)
│   └── components/
│       ├── MapComponent.tsx       ← TEMPLATE — top-level state manager
│       ├── types.ts               ← Shared TS interfaces (Location, RouteResult)
│       ├── ions/                  ← CSS tokens + JS constants (ION layer)
│       ├── atoms/                 ← ActionButton, NumberBadge, TextInput, StatusTag
│       ├── molecules/             ← LocationSlot, StatCard, StopListItem
│       ├── organisms/             ← InputPanel, ResultPanel, RouteLayer
│       └── utils/
│           └── parseGoogleMapsLink.ts  ← 5-format regex URL parser
├── .env                           ← (gitignored) API keys + DATABASE\_URL
└── package.json
```

\---

## 🏗️ Architecture — Atomic Design

The component system follows **Atomic Design** — each layer can only import from layers below it.

```
ION  ──▶  ATOM  ──▶  MOLECULE  ──▶  ORGANISM  ──▶  TEMPLATE
```

|Layer|Responsibility|Key Files|
|-|-|-|
|**ION**|CSS design tokens + JS constants|`tokens.css`, `constants.ts`|
|**ATOM**|Indivisible UI units|`ActionButton`, `NumberBadge`, `TextInput`|
|**MOLECULE**|2–3 atoms with local logic|`LocationSlot`, `StatCard`, `StopListItem`|
|**ORGANISM**|Full UI sections with effects|`InputPanel`, `ResultPanel`, `RouteLayer`|
|**TEMPLATE**|Global state manager|`MapComponent.tsx`|

\---

## 🔄 Data Flow

```
User pastes Maps links
        │
        ▼
\[InputPanel] → handleOptimize()
        │
        ├── Short link? → POST /api/expand → server-side redirect follow
        ├── parseGoogleMapsLink() → { lat, lng, name }
        └── setLocations() → triggers RouteLayer useEffect
                    │
                    ▼
            POST /api/route (server proxy)
                    │
                    ├── MD5 cache key → prisma.route.findUnique()
                    │     ├── HIT  → return cached result instantly
                    │     └── MISS → Google Routes API v2
                    │                  X-Goog-Api-Key (server-side only)
                    │                  optimizeWaypointOrder: true
                    │               → prisma.route.create (cache)
                    │               → prisma.apiLog.create (audit)
                    │
                    ▼
            RouteLayer receives response
                    │
                    ├── Decode encodedPolyline → draw Polyline
                    ├── Re-order stops by optimizedIntermediateWaypointIndex
                    ├── Drop color-coded Markers (ROUTE\_COLORS\[0..9])
                    ├── Pin 🚕 Driver + 🏪 Shop InfoWindows (headerDisabled: true)
                    └── fitBounds() → onResult(RouteResult)
                                │
                                ▼
                        \[ResultPanel] → StatCards + StopList
```

\---

## 📡 API Reference

|Endpoint|Method|Purpose|
|-|-|-|
|`/api/route`|`POST`|Main proxy — cache check → Google Routes API → DB save|
|`/api/expand`|`POST`|Expands `maps.app.goo.gl` short links server-side|
|`/api/log`|`POST`|Standalone API usage audit logger|

\---

## 🗄️ Database Schema

```prisma
model Route {
  id              String   @id @default(uuid())
  cacheKey        String   @unique   // MD5 of origin+dest+intermediates
  totalDistance   Float              // metres
  totalDuration   Float              // seconds
  encodedPolyline String   @db.Text
  orderedPath     Json               // optimizedIntermediateWaypointIndex\[]
  createdAt       DateTime @default(now())
}

model ApiLog {
  id        String   @id @default(uuid())
  apiName   String   // "Routes API"
  endpoint  String   // full URL called
  createdAt DateTime @default(now())
}
```

\---

## 📜 npm Scripts

```bash
npm run dev     # prisma generate + next dev
npm run build   # prisma generate + next build
npm run start   # prisma generate + next start
npm run lint    # eslint
```

> Every script runs `prisma generate` first — never skip this after a schema change.

\---


## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

\---

<div align="center">

Made with ❤️ SNB INNOVATIONS Copyrights Reserved @2026

</div>

