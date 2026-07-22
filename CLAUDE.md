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

**Persistence** — `usePersistentState(key, initial)` hook mirrors workbook/roadmap state into `localStorage` under `capability-atlas:v1` (services, processes, learned concepts, fired tooltips, base envelope, installed mods, merged/flagged candidates, custom packages, label mode). Transient UI (active tab, toast, form drafts, selection) is deliberately *not* persisted. Header has a two-click inline Reset (not `window.confirm` — that blocks the renderer and clashes with the design) that clears the store and restores seed data. Storage failures (private mode/quota) fall back to in-memory silently.

**Business Case export** — the "Business Case" tab (unlocks with the roadmap) assembles a Treasury Board–style submission live from state: letterhead, investment-summary tiles, executive summary with inline figures, a duplication-evidence table (from `ranked` + `biz` aggregates), shared-data findings (Pass 3), fiscal-year sequencing (from `plan.waves`), deferred items, and a basis-of-estimate note. Export is client-side print-to-PDF: a `@media print` block hides everything marked `.no-print` (header, rail, toast, export toolbar) and `window.print()` prints just the `.print-report` article. No PDF/docx library or backend — works offline. Print is intentionally the mechanism rather than a native dialog for confirm-style flows (those block the renderer).

**Value stream / Production Flow view** — the "Value Stream" tab (unlocks with the heatmap) renders the statistical-production line as horizontal stages (`VALUE_STREAM`: Frame→Collect→Process→Estimate→Protect→Disseminate, each mapped to a core capability), with one lane per org unit built from `grid.cells[capId+unitId]`. Stages active in ≥2 lanes get a "N× duplicated" tag — the heatmap's finding placed in flow context. Cross-cutting capabilities (`SUPPORTING_CAPS` = c7 Stakeholder Engagement, c8 Metadata) render as a separate supporting band below, since they span every stage. CSS-grid layout with a shared `gridTemplateColumns` so lanes align under stage headers; horizontally scrollable.

## Deployment

GitHub Pages via Actions: [.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds `dist/` and publishes on every push to `main`. Live URL: https://p3ji.github.io/ebatool/. The Vite `base` is `/ebatool/` **for builds only** (`command === 'build'` conditional in [vite.config.ts](vite.config.ts)) — an unconditional base broke local dev by redirecting root to `/ebatool/`, don't regress that. **Pending manual step:** repo Settings → Pages → Source must be flipped to "GitHub Actions" (currently "Deploy from a branch", which serves the raw unbuilt index.html whose `/src/main.tsx` reference 404s — the exact symptom of the site "not loading"). Only the repo owner can flip it; no `gh` CLI/token in this environment.

## Direction — v2 reframing (agreed 2026-07, NOT yet built)

Domain-expert feedback (user, 2026-07-13) surfaced real design flaws in the v1 framing. Anchor references: the GC **Service and Digital Target Enterprise Architecture** white paper (canada.ca; key phrase: reduce "**unnecessary** redundancy" via reusable components implementing business capabilities, Strangler-Fig incremental transition) and the agency's **official capability model** preserved in [docs/target-capability-model.md](docs/target-capability-model.md).

1. **Multi-unit ≠ redundancy.** The Pass 1 score flags any capability in ≥2 units, but duplication is only waste when the work is *undifferentiated*. Domain-differentiated work (estimation for labour vs. immigration) is legitimately distributed; commodity/platform work (collection platforms, metadata pipelines) is the real candidate. Planned: a commodity ↔ domain-differentiated attribute per capability; cross-domain hits on differentiated capabilities stop being flagged as overlap.
2. **Deviation-from-owner beats raw duplication.** The official model already names a Proposed Business Owner and product family per capability — so the useful finding is "actual work diverges from intended owner," framed as *migration candidates onto the product family* + aggregated demand signal, not "cuts."
3. **"Pass 1/2/3" is jargon leak.** Rename in UI: "Same capability, several units" / "Similar work, different words" / "Same data, separate pipelines."
4. **FTE is not 1:1 cuttable.** People are fractional across capabilities; freed effort is *capacity, not headcount*. Planned: fractional/range effort capture, savings re-labelled "redeployable capacity," 35% haircut visible and adjustable.
5. **Anti-shelfware rule.** The tool must import the official taxonomy (two-level: official L2/L3 → tangible workbook processes), pay the data-enterer first (their own service map/business case), and feed *existing* governance (ARB reviews, product-family scoping, investment planning) — never become a parallel inventory or new reporting obligation.

Overall repositioning: less "redundancy detector," more **demand-aggregation and migration-sequencing tool for the product families already defined**. First implementation step when green-lit: swap `TAXONOMY` seed for the official model in docs/.

## Not yet built (good next steps)

- v2 reframing above (waiting on user green-light — "not yet" as of 2026-07-13)
- Real backend persistence (currently localStorage only — no cross-device/multi-user sync)
- Native .docx export (current export is browser print-to-PDF; a true .docx would need a client-side lib or backend)
- Second value stream (currently one hardcoded production line; the meta-model supports multiple)

## Rules

- Mobile-first; must work well at 375px wide (currently unaudited past viewport meta + `100dvh` — run the `mobile-ready` skill before shipping).
- Keep the overlay pattern intact: new modules add attributes/rules/views keyed to core IDs, never mutate the 7 core entities directly.
