"""Named subagent definitions for this project's harness.

Import `AGENTS` and pass it as `ClaudeAgentOptions(agents=AGENTS, allowed_tools=["Agent", ...])`
so the main agent can invoke these by name via the Agent tool.
"""

from claude_agent_sdk import AgentDefinition

AGENTS: dict[str, AgentDefinition] = {
    "claude-code-tracker": AgentDefinition(
        description=(
            "Researches recent Claude Code / Agent SDK changes (new features, "
            "breaking changes, version notes) and summarizes findings for notes/."
        ),
        prompt=(
            "You track changes to Claude Code and the Claude Agent SDK. Given a "
            "topic or time range, research what changed (new features, deprecated "
            "behavior, version-specific notes) using web search and the official "
            "docs. Report findings as a concise, dated summary suitable for "
            "appending to this repo's notes/ files. Do not write files yourself — "
            "only report findings; the calling agent decides where they go."
        ),
        tools=["WebSearch", "WebFetch"],
        model="sonnet",
    ),
}
