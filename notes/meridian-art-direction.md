# Meridian — art direction: The Living Gallery

Identity milestone (feature freeze). Three sprints:

1. **Sprint 1 — visual system** (done): museum palette, serif voice, per-module ambience, paper grain. No functional changes.
2. **Sprint 2 — motion**: scroll reveals, shared-element transitions, checkbox drawing, chart draw-in, atmospheric backgrounds, time-of-day environment.
3. **Sprint 3 — per-screen refinement**: each module tuned to its room, remove anything template-like.

## The idea

Meridian is one building with many rooms: one architecture (surface ladder, hairlines, type scale), each module its own light. Implemented as `data-module="<view>"` on `.shell` driving exactly two knobs (`tokens.css`, Living Gallery block):

- `--module-tint` — a whisper-alpha radial wash at the top of `.main` canvas. Rule: *if you can point at it, it's too strong* (alphas 0.035–0.06).
- `--font-display` / `--fw-display` — display headings swap to the serif in editorial rooms only (Notes → Monet, Reviews → Art Deco).

Room map: Dashboard = Bauhaus (neutral), Calendar = Mondrian (ink navy), Goals = Kandinsky (violet), Focus = Japanese minimalism (near-nothing stone), Habits = terracotta, Finance = forest, Timeline = Constructivism (muted red). Principles extracted, never imitated — no artwork reproduction.

## Palette

Museum pigments, muted: ink navy `#4d6d99` (default accent), forest `#47775a`, aged brass `#a8873c`, terracotta `#b25f3d`, stone `#75726a`. Accent *keys* kept (`indigo`/`evergreen`/`amber`/`rose`/`graphite`) so stored settings survive; only values + Settings labels changed. Light theme is warm paper (canvas `#f4f1ea`, ivory surfaces); dark is warm charcoal (`#0d0c0b`), not blue-black.

## Materials

- Paper grain: procedural SVG `feTurbulence` tile (160px, data URI, zero assets) on `.shell::after`, opacity via `--grain-opacity` (0.02 dark / 0.045 light — paper shows grain in daylight).
- Typography: Instrument Serif latin woff2 self-hosted in `app/src/assets/fonts/` (~15 kB each). Artifact build inlines them via `assetsInlineLimit: 65536` (CSP forbids external fetches). Serif is 400-only — editorial rooms set `--fw-display: 400` and relax display tracking to ≈0.

## Gotchas learned

- `--t-*-ls` tracking vars are overridable per module because the type helpers read vars, not literals — that's why serif rooms can relax tracking without new classes.
- Gradient washes don't transition; the tint change on navigation is imperceptible at these alphas. Animate with a motion layer in Sprint 2 if wanted.
- `index.html` theme-color metas + favicon must track palette changes by hand.
