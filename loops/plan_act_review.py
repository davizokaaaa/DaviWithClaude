"""First loop-prompting experiment: plan -> act -> review -> repeat.

Each cycle: ask Claude to plan the next step for a goal, act on that step,
then review whether the goal is done. Stops when the review says "DONE"
or after max_iterations, whichever comes first.
"""

import asyncio

from harness.basic_loop import run

MAX_ITERATIONS = 5


async def plan_act_review(goal: str, max_iterations: int = MAX_ITERATIONS) -> list[str]:
    """Run the plan -> act -> review cycle for `goal`. Returns the list of act outputs."""
    history: list[str] = []

    for _ in range(max_iterations):
        progress = "\n".join(f"- {step}" for step in history) or "(nothing yet)"

        plan = await run(
            f"Goal: {goal}\nProgress so far:\n{progress}\n\n"
            "What is the single next concrete step? Answer in one short sentence, no preamble."
        )

        act_result = await run(f"Goal: {goal}\nNext step: {plan}\n\nDo this step. Report the result in one short sentence.")
        history.append(act_result)

        review = await run(
            f"Goal: {goal}\nSteps taken so far:\n" + "\n".join(f"- {s}" for s in history) + "\n\n"
            "Is the goal now fully done? Answer with exactly one word: DONE or CONTINUE."
        )
        if review.strip().upper().startswith("DONE"):
            break

    return history


def main() -> None:
    result = asyncio.run(plan_act_review("Explique o que é um agent loop em 3 frases curtas."))
    for i, step in enumerate(result, 1):
        print(f"{i}. {step}")


if __name__ == "__main__":
    main()
