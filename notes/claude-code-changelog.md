# Claude Code / Agent SDK — changelog tracking

Findings from the `claude-code-tracker` subagent (`harness/agents.py`), researched via WebSearch/WebFetch. Append new entries below as the subagent is re-run; keep entries dated.

## 2026-07-31

- **Nested subagents & concurrency limits (v2.1.198-2.1.219):** subagents run in the background by default and can spawn nested subagents up to depth 3 (configurable). Per-session caps: 200 total spawns/session, 20 concurrent subagents.
- **Structured outputs & fallback models in the Python SDK:** `claude-agent-sdk` supports agents returning validated JSON against a caller-supplied schema, plus automatic `fallbackModel` chains. Claude Code is now bundled by default with the Python SDK package. `ClaudeAgentOptions` gained a `betas` option for API beta features.
- **New model line — Claude Opus 5 and Sonnet 5 (July 24, 2026, v2.1.219):** Opus 5 (`claude-opus-5`) is now the default Opus model, 1M-token context, fast-mode pricing $10/$50 per Mtok. Sonnet 5 (introduced earlier at v2.1.197) is the new default with native 1M-token context.
- **Hooks/headless additions:** new `DirectoryAdded` hook (fires when a working directory is registered mid-session via `/add-dir` or `register_repo_root`); `mcp_server_errors` added to headless `stream-json init` event; `--forward-subagent-text` flag forwards nested-subagent text/thinking into stream-json output; `set_model` control requests now apply mid-turn.
- **Sandbox/permissions tightening:** `sandbox.network.strictAllowlist` now hard-denies non-allowlisted hosts (no prompt); `sandbox.credentials` blocks sandboxed commands from reading credential files/secret env vars; several permission-rule bypass bugs fixed. Since June 15, 2026, headless/SDK usage draws from a separate weekly token pool on Pro/Max plans rather than sharing the interactive pool.
