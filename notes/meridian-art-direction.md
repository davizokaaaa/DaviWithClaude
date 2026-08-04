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

## Sprint 2 (done) — motion & atmosphere

- **Dynamic environment**: `data-daypart` on `<html>` (morning/afternoon/evening/night, refreshed every 5 min by the shell). Drives `--daypart-tint` (a second ambient wash, bottom corner) and — evening/night only — one-step-slower `--dur-*` CSS transitions. The building quiets down at dusk.
- **Atmosphere drift**: both washes live on `.main::before` (z -1, `isolation: isolate`) and breathe on a 90s alternate transform animation — translate/scale only, zero repaint; global reduced-motion collapse kills it.
- **Checkbox completion burst**: accent ring blooms outward on user tick (keyed re-mount, guarded so it never fires on mount or untick).
- **Scroll reveal**: `reveal` spread in `lib/motion.ts` (`whileInView`, fires once, -48px margin). Applied to Dashboard's below-fold sections; roll out per-view in Sprint 3.
- **Button depth**: `.btn-primary` gets inset top light + breath of under-shadow — a key, not a rectangle.
- Already in place pre-sprint (don't redo): checkbox path draw, ProgressRing/Bars/Sparkline draw-in, AnimatedNumber springs, segmented sliding thumb, palette overshoot.

## Sprint 3 (done) — rooms

Per-module character as a `/* Rooms */` block at the end of `views.css` — surgical CSS overrides under `.shell[data-module=…]`, never redesigns:

- **Focus**: wider top margin, 310-weight clock, more gap — silence.
- **Calendar**: hairlines step up from soft → regular, blocks sharpen to `--r-xs` — Mondrian planes inside rules.
- **Notes**: serif 28px editor title, 1.75 body leading, full-ink body — a page, not a form.
- **Reviews**: brass top rule on panels (`color-mix` with `--amber-500`), serif panel titles, 1.6px eyebrow tracking — 1928 annual report.
- `.view-title` now reads `--font-display`/`--fw-display`, so page titles speak each room's voice automatically.

Identity milestone complete. Future work: apply `reveal` to more below-fold sections as views grow; consider a Kandinsky treatment for Goals' progress rings (connected circles) if it can stay quiet.

## Living Gallery v2 — generative atmospheres, empty seed, pt-BR

- **`shell/Atmosphere.tsx`**: one canvas per room behind content, painting the module's artistic influence as pure atmosphere (composition/rhythm/geometry extracted, never artwork). Stateless scenes = pure fns of time → resize-proof, no per-frame state. 30fps cap, DPR ≤1.5, halts on hidden tab, reduced-motion renders one still frame. Alphas ≤0.06. Scenes: Bauhaus (dashboard), Mondrian (calendar), Kandinsky orbits+connections (goals), Zen ripples (focus), Monet pools (notes), Deco brass fan (reviews), Constructivist diagonals (timeline), clay-dot kiln (habits), forest ledger-waves (finance), rising light (today).
- **Seed emptied** (`seed.ts` → all-empty; persist `version: 2` + `migrate` discards the old demo workspace on load). Because areas/goals/savings had no in-app creation, added store actions `addArea/updateArea/addGoal/deleteGoal/addKeyResult/addSavings/deleteSavings` + composer UIs in AreasView, GoalsView (dialog + inline KR composer), FinanceView (savings composer). "Reset to seed" now means "start from zero".
- **pt-BR everywhere**: all 17 views, shell, palette, capture (parser now accepts hoje/amanhã/próxima semana alongside English tokens), rituals, shortcuts, aria-labels, toasts, suggestion reasons. `lib/dates.ts` wraps date-fns `format` with `ptBR` locale (keys stay `yyyy-MM-dd` via formatBase). Finance switched to BRL. No i18n framework — single-locale in-place strings, revisit only if a second locale is ever needed.
