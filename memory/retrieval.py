"""Minimal keyword-based retrieval over notes/*.md.

First experiment in memory/: before reaching for embeddings or a vector store,
check whether plain keyword overlap is good enough to pull relevant notes
into a prompt. No extra dependencies, no network calls.
"""

from pathlib import Path

NOTES_DIR = Path(__file__).parent.parent / "notes"


def relevant_notes(query: str, notes_dir: Path = NOTES_DIR, top_k: int = 2) -> list[str]:
    """Return the top_k note file contents ranked by keyword overlap with query."""
    query_words = set(query.lower().split())
    scored = []
    for path in sorted(notes_dir.glob("*.md")):
        if path.name == "README.md":
            continue
        text = path.read_text()
        text_words = set(text.lower().split())
        score = len(query_words & text_words)
        if score > 0:
            scored.append((score, path, text))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [text for _, _, text in scored[:top_k]]
