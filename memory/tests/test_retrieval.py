from memory.retrieval import relevant_notes


def test_finds_note_matching_query_keywords():
    results = relevant_notes("integration testes pytest")
    assert any("integration" in text.lower() for text in results)


def test_returns_empty_when_no_keyword_overlap():
    results = relevant_notes("xyzzy_no_match_qwerty")
    assert results == []
