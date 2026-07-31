# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This repository is for building autonomous systems on top of Claude: custom harnesses (Agent SDK loops), memory systems, loop/agentic prompting patterns, and tracking Claude Code's own feature changes over time. Stack decisions should prioritize how easily an LLM (not just a human) can read and reason about the code — Python is the default choice for harness/automation code.

## Repository state

- `README.md` — placeholder title only.
- `.claude/settings.json` — project permissions (safe defaults: read + read-only git allowed; destructive commands and secret files denied) and auto-memory/auto-compaction enabled.
- `notes/` — versioned, git-tracked knowledge base (Claude Code/Agent SDK changes, harness decisions, tested patterns). This is distinct from Claude's auto-memory, which is local to each machine under `~/.claude/projects/.../memory/` and never committed.
- `.claude/skills/` — pre-installed Claude Code skills (banner-design, brand, design, design-system, slides, ui-styling, ui-ux-pro-max) for visual/brand design workflows. Not project source code; ignore unless a request specifically calls for one of them.

## Stack

- Python >=3.12, managed with `uv` (`pyproject.toml` + `uv.lock`).
- `claude-agent-sdk` is the core dependency for harness code.
- `pytest` for tests (dev dependency).

## Commands

- Install/sync dependencies: `uv sync`
- Add a dependency: `uv add <package>` (or `uv add --dev <package>` for dev-only)
- Run a script: `uv run python <path>`
- Run tests (excludes integration tests that call the real API): `uv run pytest`
- Run integration tests too: `uv run pytest -m integration`
- Run a single test: `uv run pytest path/to/test_file.py::test_name`

## Project layout

- `harness/` — custom agent-loop code built on `claude-agent-sdk`.
  - `basic_loop.py` — minimal single-prompt `query()` loop; starting point for more complex harnesses.
  - `agents.py` — named `AgentDefinition`s (subagents) for this project, e.g. `claude-code-tracker` for researching Claude Code/Agent SDK changes.
  - `tests/` — pytest tests; real-API tests are marked `@pytest.mark.integration` and excluded by default.
- `memory/` — experiments with memory strategies beyond CLAUDE.md/auto-memory (custom retrieval, summarization, persistence).
- `loops/` — loop-prompting patterns: scripts driving repeated/iterative agent cycles (plan → act → review → repeat).
- `experiments/` — one-off scripts, graduate into the folders above once proven.
- `notes/` — versioned knowledge base (see `notes/README.md`); `notes/agent-sdk.md` has SDK-specific gotchas learned so far (e.g. auth, trust dialog behavior when running headless).

## Working in this repo

- When adding a real feature, update this file's Commands/Layout sections if they change — don't leave stale instructions.
- When adding to `notes/`, prefer one file per topic over one file per date (see `notes/README.md`).
