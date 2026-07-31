"""Integration test for the plan-act-review loop.

Skipped by default (makes real Claude calls) — run explicitly with:
    uv run pytest -m integration
"""

import asyncio

import pytest

from loops.plan_act_review import plan_act_review


@pytest.mark.integration
def test_loop_produces_at_least_one_step():
    result = asyncio.run(plan_act_review("Diga oi.", max_iterations=2))
    assert len(result) >= 1
    assert all(step.strip() for step in result)
