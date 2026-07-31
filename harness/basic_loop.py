"""Minimal Agent SDK loop: send one prompt, print Claude's final answer.

This is the smallest possible harness — a starting point to build
multi-turn, memory-aware, or looped agents on top of.
"""

import asyncio

from claude_agent_sdk import AssistantMessage, ClaudeAgentOptions, ResultMessage, TextBlock, query


async def run(prompt: str) -> str:
    options = ClaudeAgentOptions(allowed_tools=[])
    final_text = ""

    async for message in query(prompt=prompt, options=options):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    final_text = block.text
        if isinstance(message, ResultMessage) and message.subtype != "success":
            raise RuntimeError(f"Agent run failed: {message.subtype}")

    return final_text


def main() -> None:
    answer = asyncio.run(run("Responda em uma frase: o que é um agent loop?"))
    print(answer)


if __name__ == "__main__":
    main()
