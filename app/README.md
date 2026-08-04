# Meridian — Personal Operating System

A local-first personal operating system: daily planning and shutdown rituals,
projects with Kanban boards, week calendar with time-blocking, focus sessions,
habits with streak freezes, goals/OKRs, life areas, notes & knowledge base,
finance overview, reviews (weekly → annual), Eisenhower matrix, timeline, and
an executive dashboard — behind a ⌘K command palette and full keyboard model.

Design research and product principles: [`../notes/personal-os-research.md`](../notes/personal-os-research.md).

## Run

```bash
npm install
npm run dev        # dev server
npm run build      # typecheck + production build (dist/)
npm run preview    # serve the production build
```

Opens with a seeded demo workspace so every view demonstrates itself.
All data lives in `localStorage` — no server, no account, no telemetry.
Export or reset from Settings.

## Keyboard

| | |
|---|---|
| `⌘K` / `Ctrl K` | Command palette (navigation, actions, instant search) |
| `⌘⇧N` | Quick capture — parses `!high`, `today`/`tomorrow`, `45m`, `#tag`, `@project` |
| `G` then `T/I/U/C/P/F/H/G/N/D` | Go to view |
| `?` | Shortcuts reference |

## Architecture

- **`src/styles/`** — three-layer design tokens (primitives → semantic → component),
  dark/light themes, five accent palettes, comfortable/compact density.
  Depth comes from a surface ladder + 1px hairlines; shadows only on floating layers.
- **`src/lib/motion.ts`** — the motion language: springs for object-like movement,
  duration curves for opacity/colour, staggers, and shared interaction presets.
  Collapses to opacity-only under `prefers-reduced-motion`.
- **`src/core/`** — domain types, persisted zustand store (intent-named actions),
  seeded workspace, pure derived-data selectors (streaks, trends, Eisenhower, suggestions).
- **`src/ui/`** — component library: buttons, inputs, checkbox, segmented, switch,
  progress ring/bar, dialogs, drawers, menus, tooltips, toasts, command palette,
  quick capture, charts (animated counters, sparkline, bars, heatmap, distribution).
- **`src/modules/`** — 17 lazy-loaded views (1–6 kB chunks each), one folder per module.
- **`src/shell/`** — layout, sidebar, global hotkeys, shortcuts dialog.

Stack: React 19 + TypeScript (strict) + Vite + `motion` + `zustand` + `date-fns`.
