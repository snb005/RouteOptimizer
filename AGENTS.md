<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 🤖 Agent Coding Guidelines & Project Rules

This document specifies behavior rules, design constraints, and implementation guidelines for any AI coding agent working in this repository.

---

## 🎨 1. Styling & Design Token Rules (`tokens.css`)

All components must adhere strictly to the **ION layer design system** defined in [tokens.css](file:///d:/New%20folder/gmapalgo/src/components/ions/tokens.css). Do not use arbitrary tailwind classes or hardcoded color codes (such as `bg-white`, `bg-gray-100`, or `border-blue-500`) directly. Always prefer the predefined CSS variables:

### Depth Layers
- **`--ion-depth-0`** (`#ffffff`): Page body base.
- **`--ion-depth-1`** (`#f9fafb`): Panel / Card background. Use via `.ion-depth-card` class.
- **`--ion-depth-2`** (`#f3f4f6`): Sunken container or input base. Use via `.ion-depth-inset` class.
- **`--ion-depth-3`** (`#e5e7eb`): Focus shadow offsets / active button states.

### Semantic Remark Tokens
- For remark elements, use variables: `--ion-remark-bg`, `--ion-remark-border`, `--ion-remark-text`, and `--ion-remark-icon` (`#f59e0b`).

### Interactive Pseudo-Classes
Always use the custom interaction transition classes:
- **`.ion-hover-lift`**: Elevates card items/buttons on hover.
- **`.ion-hover-brighten`**: Gently brightens tag items/badges.
- **`.ion-hover-tint`**: Highlights lists/rows with a neutral background tint.
- **`.ion-active-press`**: Adds a visual compression click effect (`scale(0.97)`) on click/mousedown.
- **`.ion-focus-ring`**: Applies a custom accessibility focus outline using `--ion-ring-color` and `--ion-ring-width`.

---

## 🏗️ 2. Component Boundaries (Atomic Design)

Keep the component boundaries strict. A component at a given layer can only import from layers below it. Parallel or upper layer imports are strictly forbidden.

1. **ION Layer** (`src/components/ions/`): Predefined constants and tokens.css. Imports: *None*.
2. **ATOM Layer** (`src/components/atoms/`): Small, pure presentation UI items. Imports: *ION*.
3. **MOLECULE Layer** (`src/components/molecules/`): Local hooks and grouped atoms. Imports: *ION*, *ATOM*.
4. **ORGANISM Layer** (`src/components/organisms/`): Renders complete layout sections. Imports: *ION*, *ATOM*, *MOLECULE*.
5. **TEMPLATE Layer** (`src/components/MapComponent.tsx`): The top-level state orchestrator. Imports: *ION*, *ATOM*, *MOLECULE*, *ORGANISM*.

---

## 🔄 3. State & State Flow Rules

- **Locked Slots**: State resides in `MapComponent.tsx` (`lockedSlots`). Changes are bubbled up via `onToggleLock` and `onToggleAllLocks`.
- **Target Slot**: Synchronizes map clicks and autocomplete queries with a chosen input index. The target slot is reset to `null` automatically after a coordinate string is assigned.
- **Cache Management**: The backend `/api/route` first checks the PostgreSQL cache (`prisma.route`) via a unique MD5 hash of the route stops. Only query the Google Cloud REST API on cache misses, saving new results to the DB.
