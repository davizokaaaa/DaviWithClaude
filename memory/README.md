# memory/

Experiments with memory strategies for long-running agents (beyond CLAUDE.md and auto-memory): custom retrieval, summarization, persistence layers.

## Current experiment: keyword retrieval over notes/

`retrieval.py` — `relevant_notes(query)` scores `notes/*.md` files by keyword
overlap with the query and returns the top matches. No embeddings, no
dependencies, no network calls — the simplest thing that could work, to
check whether it's good enough before reaching for a vector store.

`harness/basic_loop.py`'s `run_with_memory()` prepends the matched notes as
context before calling `run()`. If keyword overlap turns out too weak
(false positives/negatives on real queries), the next step is embeddings —
not before.
