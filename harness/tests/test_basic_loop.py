"""Integration test for the basic harness loop.

Skipped by default (makes a real Claude call) — run explicitly with:
    uv run pytest -m integration
"""

import pytest

from harness.basic_loop import run, run_with_memory


@pytest.mark.integration
def test_run_returns_nonempty_text():
    import asyncio

    result = asyncio.run(run("Responda apenas com a palavra: ok"))
    assert result.strip()


@pytest.mark.integration
def test_run_with_memory_returns_nonempty_text():
    import asyncio

    result = asyncio.run(run_with_memory("Responda apenas com a palavra: ok"))
    assert result.strip()
