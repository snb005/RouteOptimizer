# Project Structure & Architecture — RouteOptimizer

This document outlines the codebase architecture, file layout, and component boundaries of the RouteOptimizer application.

---

## 🗂️ Directory Layout

```
RouteOptimizer/
├── prisma/
│   ├── migrations/                # Database migrations history
│   ├── schema.prisma              # Database schema for Route, ApiLog, and Location
│   └── seed.ts                    # Seed script for initial/mock data
├── public/                        # Static assets (images, icons, showcase)
├── src/
│   ├── app/                       # Next.js App Router root
│   │   ├── api/                   # API routes / backend proxy handlers
│   │   │   ├── expand/            # POST /api/expand - Short link resolver
│   │   │   ├── log/               # POST /api/log - Places & Maps API billing auditor
│   │   │   └── route/             # POST /api/route - Google Routes API proxy with DB caching
│   │   ├── logs/                  # Interactive audit logs dashboard (/logs)
│   │   ├── globals.css            # Global CSS importing tailwind and tokens.css
│   │   ├── layout.tsx             # Main HTML layout, imports Geist font
│   │   └── page.tsx               # Entry point mounting MapComponent.tsx
│   └── components/                # Modular front-end components
│       ├── MapComponent.tsx       # TEMPLATE — Top-level state coordinator
│       ├── types.ts               # Shared TypeScript schemas and types
│       ├── ions/                  # ION layer (styles, theme tokens, constants)
│       │   ├── tokens.css         # Styling variables, pseudo-classes, and depth layers
│       │   ├── constants.ts       # Global config constants (colors, layout)
│       │   └── index.ts
│       ├── atoms/                 # ATOM layer (indivisible pure UI units)
│       │   ├── ActionButton.tsx   # Lift/press action button atom
│       │   ├── NumberBadge.tsx    # Small sequence indicator circle
│       │   ├── TextInput.tsx      # Token-synced styled textbox input
│       │   ├── StatusTag.tsx      # Pill-shaped label badge (Driver, Shop)
│       │   ├── MapSearchBox.tsx   # Google Places autocomplete wrapper
│       │   ├── RemarkModal.tsx    # Modal overlay for adding remarks
│       │   └── index.ts
│       ├── molecules/             # MOLECULE layer (combined atoms with local hooks)
│       │   ├── LocationSlot.tsx   # Location input card slot with targeting, lock, and remark controls
│       │   ├── StatCard.tsx       # Key-value stat dashboard indicator
│       │   ├── StopListItem.tsx   # Simple line element for sequence routes
│       │   └── index.ts
│       ├── organisms/             # ORGANISM layer (complex UI sections with layout effects)
│       │   ├── InputPanel.tsx     # Stop configuration panel (Add, CSV import, Lock All)
│       │   ├── ResultPanel.tsx    # Stats readout panel and action buttons
│       │   ├── RouteLayer.tsx     # Google Map route rendering, markers, and InfoWindows
│       │   ├── RoutePdf.tsx       # PDF export builder module
│       │   └── index.ts
│       └── utils/                 # Utility files
│           ├── parseGoogleMapsLink.ts  # Multiformat Google Maps link regex parser
│           └── index.ts
├── .env                           # Local environment config (DATABASE_URL, API keys)
├── package.json                   # Scripts and project dependencies
├── prisma.config.ts               # Prisma ORM configuration overrides
├── tailwind.config.js             # Tailwind CSS framework settings
└── tsconfig.json                  # TypeScript compiler settings
```

---

## 🏗️ Architecture — Atomic Design Component Hierarchy

The components folder uses an **Atomic Design** pattern. A component at a higher layer is permitted to import components from layers *below* it, but must never import from layers *above* or *parallel* to it.

```
ION (tokens, constants)
 └── ATOM (buttons, inputs, badge, searchbox, modal)
      └── MOLECULE (LocationSlot, StatCard, StopListItem)
           └── ORGANISM (InputPanel, ResultPanel, RouteLayer, RoutePdf)
                └── TEMPLATE (MapComponent)
```

| Component Layer | Responsibility | Imports From |
| :--- | :--- | :--- |
| **ION** | Design system tokens, style guides, and JS constants. | None |
| **ATOM** | Indivisible, modular UI elements styled with ion tokens. | ION |
| **MOLECULE** | Compact clusters of atoms providing minor contextual actions. | ION, ATOM |
| **ORGANISM** | Full segments of the screen coordinating actions and layout states. | ION, ATOM, MOLECULE |
| **TEMPLATE** | The top-level state manager linking organisms and coordinating data flows. | ION, ATOM, MOLECULE, ORGANISM |

---

## 🗄️ Database Models (`schema.prisma`)

We use **Prisma ORM** with a PostgreSQL database to manage state caching and API audit logs.

```prisma
model Route {
  id              String   @id @default(uuid())
  cacheKey        String   @unique   // MD5 hash of origin + destination + intermediates
  totalDistance   Float              // route distance in meters
  totalDuration   Float              // route duration in seconds
  encodedPolyline String   @db.Text  // compressed coordinate path for map polyline
  orderedPath     Json               // sequence index map: optimizedIntermediateWaypointIndex[]
  createdAt       DateTime @default(now())
}

model ApiLog {
  id        String   @id @default(uuid())
  apiName   String   // Target (e.g. "Routes API", "Places Autocomplete API")
  endpoint  String   // Endpoint path accessed for billing audit
  createdAt DateTime @default(now())
}
```
