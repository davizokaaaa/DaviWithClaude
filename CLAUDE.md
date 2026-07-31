# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repository ("Davi's Workspace with Claude") currently contains no application code. It consists of:

- `README.md` — placeholder title only.
- `.claude/skills/` — a set of pre-installed Claude Code skills (banner-design, brand, design, design-system, slides, ui-styling, ui-ux-pro-max) covering visual/brand design workflows (logos, banners, design tokens, slide decks, UI styling). These are used via the Skill tool when relevant to a request; they are not project source code and don't need to be read or modified as part of normal development.

There is no build system, package manager, linter, or test suite configured yet — nothing to build, lint, or run.

## Working in this repo

Since there's no established codebase structure yet, when the user asks to add a new project or app here:
- Ask what kind of project it is before scaffolding, rather than assuming a stack.
- Once a real project exists, update this file with actual build/lint/test commands and architecture notes — don't leave stale placeholder instructions.
