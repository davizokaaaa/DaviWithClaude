"""Parser genérico das tabelas HTML devolvidas pela Central de Dados.

Células com `data-valor-export` são valores (inteiros crus, sem formatação pt-BR);
as demais são rótulos (período, empresa, marca...).
"""
from __future__ import annotations

import pandas as pd
from bs4 import BeautifulSoup


def _num(v: str):
    v = (v or "").strip()
    if v in ("", "-"):
        return None
    try:
        f = float(v)
    except ValueError:
        return v
    return int(f) if f.is_integer() else f


def parse_table(html: str) -> pd.DataFrame:
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")
    if table is None:
        raise ValueError("resposta sem <table>")
    head_rows = table.find("thead").find_all("tr") if table.find("thead") else []
    headers = [c.get_text(" ", strip=True) for c in head_rows[-1].find_all(["th", "td"])] if head_rows else []
    body = table.find("tbody") or table
    rows = []
    for tr in body.find_all("tr"):
        cells = tr.find_all(["td", "th"])
        if not cells or (not head_rows and tr is body.find("tr")):
            continue
        rows.append([
            _num(c["data-valor-export"]) if c.has_attr("data-valor-export") else c.get_text(" ", strip=True)
            for c in cells
        ])
    width = max([len(headers)] + [len(r) for r in rows])
    headers = headers + [f"col{i}" for i in range(len(headers), width)]
    return pd.DataFrame([r + [None] * (width - len(r)) for r in rows], columns=headers[:width])
