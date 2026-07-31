# loops/

Loop-prompting patterns: scripts that drive the agent through repeated/iterative cycles (e.g. plan -> act -> review -> repeat).

## Current experiment: plan -> act -> review

`plan_act_review.py` — `plan_act_review(goal, max_iterations)` cycles through
three calls to `harness.basic_loop.run()` per iteration: plan the next step,
act on it, then review whether the goal is done. Stops early on a "DONE"
review, otherwise runs up to `max_iterations`. Run directly with:

```
uv run python -m loops.plan_act_review
```
