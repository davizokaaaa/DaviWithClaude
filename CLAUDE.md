# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This repository is for building autonomous systems on top of Claude: custom harnesses (Agent SDK loops), memory systems, loop/agentic prompting patterns, and tracking Claude Code's own feature changes over time. Stack decisions should prioritize how easily an LLM (not just a human) can read and reason about the code — Python is the default choice for harness/automation code.

## Repository state

- `README.md` — placeholder title only.
- `.claude/settings.json` — project permissions (safe defaults: read + read-only git allowed; destructive commands and secret files denied) and auto-memory/auto-compaction enabled.
- `notes/` — versioned, git-tracked knowledge base (Claude Code/Agent SDK changes, harness decisions, tested patterns). This is distinct from Claude's auto-memory, which is local to each machine under `~/.claude/projects/.../memory/` and never committed.
- `.claude/skills/` — pre-installed Claude Code skills (banner-design, brand, design, design-system, slides, ui-styling, ui-ux-pro-max) for visual/brand design workflows. Not project source code; ignore unless a request specifically calls for one of them.

There is no build system, package manager, linter, or test suite configured yet — nothing to build, lint, or run. The actual harness/project code (`/harness`, `/memory`, `/loops`, `/experiments`) has not been scaffolded yet.

## Working in this repo

- Once real project code exists (harness scripts, memory experiments, etc.), update this file with actual build/lint/test commands and architecture notes — don't leave stale placeholder instructions.
- When adding to `notes/`, prefer one file per topic over one file per date (see `notes/README.md`).
