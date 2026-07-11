# Capability Atlas

A modular Enterprise Business Architecture (EBA) app for a GoC national statistical agency. Teaches TOGAF/ArchiMate concepts just-in-time while delivering immediate value (overlap detection, AI transition planning) under budget constraints.

## Stack

Vite + React 19 + TypeScript, Tailwind CSS v4 (`@tailwindcss/vite` plugin, no config file — utility classes only, design tokens live as JS hex constants), lucide-react for icons. IBM Plex Sans (UI) + IBM Plex Mono (data/IDs), loaded via Google Fonts `@import` inside the component.

The working prototype lives in [src/CapabilityAtlas.jsx](src/CapabilityAtlas.jsx) — kept as `.jsx` (untyped) intentionally, wrapped by [src/App.tsx](src/App.tsx). `tsconfig.app.json` has `allowJs: true` so `tsc -b` doesn't choke on the import.

## Run

```
npm install
npm run dev
```

## Core design decisions

**Meta-model** — 7 lean core entities: Service, Capability, Value Stream, Business Process, Org Unit, Information Object, Application. Capability vs. Process is the load-bearing distinction (what vs. how) — overlap detection runs on Capability × Org Unit.

**Overlay pattern for extensibility** — modules never touch the core; each is `(attributes + rules + views)` keyed to core entity IDs, like dimension tables joined to a fact table by foreign key. The Modules tab demonstrates this live.

**Progressive disclosure / unlock economy** — plain-language workbook entries silently map to formal entities; a just-in-time tooltip fires the first time each concept is created and gets saved to the Glossary tab. Heatmap + Roadmap views stay locked until the user has entered enough data (2 services, 3 capabilities) — a network-effect loop where one manager's quick win recruits other units to enter data.

**Overlap detection, 3 passes (all built):**
- Pass 1 — structural: any Capability with Processes in ≥2 Org Units, score = `(units−1) × totalFTE`
- Pass 2 — semantic near-duplicates via text-embedding similarity, surfaced as confirm-to-merge candidates, never auto-merged
- Pass 3 — data-effort duplication via shared Information Objects (`INFO_OBJECTS`/`INFO_LINKS` in [src/CapabilityAtlas.jsx](src/CapabilityAtlas.jsx)): traces processes that maintain/consume the same underlying data across units even when their capabilities differ, so it catches duplication Pass 1/2 miss. Flag-for-review, not auto-merge, matching Pass 2's confirm pattern.

**Transition Roadmap engine** — work packages → dependency DAG → Kahn topological sort → greedy benefit-per-dollar packing into fiscal-year envelopes (`YEARS = FY27-28...FY30-31`). Retirement packages auto-pair with automation packages; their savings (`+freed`) compound into later envelopes — a self-funding narrative for TB submissions. Deferred packages report why. Users can propose their own work packages (name, cost, benefit, dependencies picked from currently active packages, optional PII flag) via the Roadmap tab — `customWPs` state flows into `activeWPs()`/`planRoadmap()` alongside `BASE_WPS`, so proposals go through the identical sort/pack/PIA-gating logic, not a separate code path.

**Implemented overlay modules:**
- Cost & Effort — dollarizes FTE/O&M ($130K/FTE assumption), turns heatmap scores into $ savings
- AI-Readiness Scoring — 0–100 score per capability, new column on heatmap
- PIA Triggers — pure rule-set, injects a WP-PIA package as a dependency ahead of AI packages touching personal info
- Change-Readiness — per-unit readiness meter, injects a WP-CM runway package for units below threshold

**Design tokens** — ink navy `#16233A`, warm paper `#F4F2EC`, archival gold `#D99A2B`, heat crimson `#8E2540`, teal `#2F6F6A`, violet `#5A4A8A` (AI/overlay elements). Signature element: the heatmap-driven insight-unlock rail.

## Not yet built (good next steps)

- Value-stream lane view for Module 1's current-state sketching
- Export to a TB-submission-style document (docx/pdf)
- Persistence (storage API, or a real backend)

## Rules

- Mobile-first; must work well at 375px wide (currently unaudited past viewport meta + `100dvh` — run the `mobile-ready` skill before shipping).
- Keep the overlay pattern intact: new modules add attributes/rules/views keyed to core IDs, never mutate the 7 core entities directly.
