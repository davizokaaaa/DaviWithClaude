# Personal OS — design & product research

Research backing the `app/` module (Meridian, a Personal Operating System).
Sources are linked inline; conclusions are what actually drove implementation decisions.

## 1. What makes an interface read as "premium"

Distilled from Linear's design system, Apple HIG, Raycast, Arc, Things 3.

**Depth comes from surfaces, not shadows.** Linear's system has *no drop shadows* in
the product surface. Hierarchy is a ladder of background lifts (canvas → surface-1 →
surface-2 → surface-3) each separated by a 1px hairline border. Shadows are reserved
for genuinely floating layers (dialogs, popovers, the command palette).
→ We ship `--surface-0..3` + `--hairline`/`--hairline-strong` and use shadows on
overlays only.

**One accent, used scarcely.** Linear deploys `#5e6ad2` on the brand mark, focus
rings, and exactly one primary CTA per section. Everything else is neutral.
→ We use a single indigo accent; semantic colors (success/warn/danger) appear only
in status, never as decoration.

**Negative tracking on display type.** Linear's display sizes run −0.6px to −3px
letter-spacing; body sits at ~0. This single detail separates "designed" from
"default".
→ Our type scale encodes per-step letter-spacing.

**Tabular numerals everywhere numbers change.** Counters that jump width read cheap.

**Keyboard-first is the premium signal.** Raycast/Linear/Superhuman: every action
reachable without the mouse, shortcuts *shown* in menus and tooltips.
→ Command palette (⌘K), quick capture (⌘⇧N), single-key shortcuts on views,
and a shortcuts reference dialog (?).

Sources: [Linear design system extraction](https://github.com/voltagent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md),
[Linear craft](https://linear.app/now/craft),
[Linear UI refresh 2026](https://linear.app/changelog/2026-03-12-ui-refresh),
[Command palette pattern](https://uxpatterns.dev/patterns/advanced/command-palette).

## 2. Motion

2026 consensus: motion "earns its keep by guiding rather than flashing" — it should
communicate state, structure and system intent. Physics-based springs (momentum,
friction) make interfaces feel tactile; the best motion is *believable*, not slick.

Things 3 is the reference for delight-per-interaction: the Magic Plus button deforms
fluidly while dragged, buttons respond with subtle glow + scale, haptics fire on
pick-up.

→ Implementation rules we adopted:
- Springs for anything object-like (drag, layout, scale). Duration-based easing only
  for opacity/color.
- Nothing appears or disappears instantly — every mount/unmount has an exit.
- Stagger lists at 18–28ms per child; more than that reads slow.
- All motion collapses to opacity-only under `prefers-reduced-motion`.

Sources: [UI trends 2026](https://www.pixelmatters.com/insights/7-UI-design-trends-to-watch-in-2026),
[Motion interfaces become the standard](https://medium.com/design-bootcamp/ui-design-trend-2026-3-motion-interfaces-become-the-new-standard-47ee276bc157),
[Things 3 review — MacStories](https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/),
[Things 3 Magic Plus](https://curtismchale.ca/2020/10/26/magic-button-things-3/).

## 3. What makes people stay for years

**Sunsama: the ritual, not the features.** Daily planning (10–20 min) + an end-of-day
shutdown. Users consistently name the *shutdown* as the thing that improved their
life — it creates a clean mental break, so you are not lying awake wondering what you
forgot. Incomplete tasks are explicitly carried, rescheduled, or dropped.
→ We ship Daily Planning and Shutdown as first-class guided flows, plus weekly /
monthly / quarterly / annual reviews.

**Habits: loss aversion + immediate visible reward.** Habit loops (cue → action →
reward) plus streaks. The reward must be immediate and *visible* — a ring closing, a
counter incrementing. Behaviours take ~66 days to automate, so the system must sustain
engagement past two months; most drop-off happens in the first 72 hours.
→ Rings animate on completion, streaks are prominent — but we also ship **streak
freezes** so one missed day doesn't destroy months of progress (punitive streaks are
the documented failure mode of dark-pattern gamification).

Sources: [Sunsama daily planning & shutdown](https://www.sunsama.com/features/daily-planning-and-shutdown),
[Streaks & habit loops](https://medium.com/design-bootcamp/streaks-and-daily-rewards-as-habit-forming-systems-dab7f5a34539),
[Habit-forming retention](https://www.strivecloud.io/blog/habit-formation-user-retention).

## 4. What gets criticised — and what we did about it

| Complaint | Product | Our answer |
|---|---|---|
| Feature bloat, steep learning curve, pricing creep after becoming an "AI super app" | Motion | Modules are opt-in in Settings; the app is usable knowing only ⌘K. No feature exists in two places. |
| "Auto-scheduling feels opaque / random" | Motion | The scheduler **proposes**, never silently rewrites. Every suggestion states its reason and is one click to accept or dismiss. |
| Pseudo-productivity — "my pages are beautifully organised but I've created nothing" | Notion | The dashboard measures *output and follow-through* (completion rate, focus hours, goal movement), not how much structure exists. |
| Clunky UI unchanged for years; broken mobile | Motion | Responsive down to 360px, real touch targets, no desktop-only interactions. |
| Endless setup before value | Notion / ClickUp | Ships with a coherent seeded workspace; nothing is an empty shell. |

Sources: [Motion review 2026](https://www.saner.ai/blogs/motion-reviews),
[Akiflow vs Motion](https://www.morgen.so/blog-posts/akiflow-vs-motion),
[Quitting Notion](https://nicholasng.substack.com/p/quitting-notion).

## 5. Product principles that fell out of the research

1. **Rituals over dashboards.** Planning and shutdown are the retention engine.
2. **Propose, never impose.** Any automation is a suggestion with a stated reason.
3. **One home per concept.** A task lives in exactly one place; views are lenses.
4. **Capture must cost nothing.** ⌘⇧N from anywhere, parsed natural language.
5. **Forgiving by default.** Streak freezes, carry-over, no guilt-red overdue walls.
6. **Every surface answers "what now?"** — never just "here is your data".
