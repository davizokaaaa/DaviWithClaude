"""Build Mint Newsletter edition nº 1 (23/10/2026): fills the chart slots of the source page
and embeds its A4 PDF so the published artifact can offer it through a "Baixar PDF" button.

Usage: uv run python newsletter/build_edicao_01.py
Reads editions/2026-10-23-edicao-01.src.html, replaces each <!--chart:NAME--> with an inline
SVG drawn from data/series_mensais.csv, renders the A4 PDF (render_pdf.py), then writes
editions/2026-10-23-edicao-01.html with the PDF embedded as base64 in the <!--pdf--> slot."""

import base64

from pathlib import Path

from charts import bar_chart, chips, line_chart, load_series
from render_pdf import render

HERE = Path(__file__).parent
SRC = HERE / "editions" / "2026-10-23-edicao-01.src.html"
OUT = HERE / "editions" / "2026-10-23-edicao-01.html"


def br(v: float, dec: int = 1, sign: bool = False) -> str:
    s = f"{v:+.{dec}f}" if sign else f"{v:.{dec}f}"
    return s.replace("-", "−").replace(".", ",")


def yoy(s: dict[str, float], desde: str, ate: str | None = None) -> dict[str, float]:
    out = {}
    for m, v in s.items():
        prev = f"{int(m[:4]) - 1}{m[4:]}"
        if m >= desde and (ate is None or m <= ate) and prev in s:
            out[m] = (v / s[prev] - 1) * 100
    return out


def chained(var_mes: dict[str, float], base: str) -> dict[str, float]:
    """Index (base month = 100) chained from monthly % changes."""
    out, v = {base: 100.0}, 100.0
    for m in sorted(var_mes):
        if m > base:
            v *= 1 + var_mes[m] / 100
            out[m] = v
    return out


def build() -> str:
    S = load_series()
    pct = lambda v: br(v, 0) + "%"  # noqa: E731
    pct_s = lambda v: br(v, 1, sign=True) + "%"  # noqa: E731
    charts = {
        "ipca": line_chart(
            [("Diesel", "--s4", chained(S["ipca_diesel_mes"], "2024-12")),
             ("IPCA", "--muted", chained(S["ipca_geral_mes"], "2024-12")),
             ("Peças", "--s1", chained(S["ipca_pecas_mes"], "2024-12")),
             ("Pneu", "--accent", chained(S["ipca_pneu_mes"], "2024-12"))],
            "IPCA desde dez/2024 (base 100): pneu, peças, índice geral e diesel",
            fmt=lambda v: br(v, 0), value_fmt=lambda v: br(v, 1), emphasis="Pneu", label_every=3),
        "diesel": bar_chart(
            {m: v for m, v in S["ipca_diesel_12m"].items() if m >= "2026-01"},
            "Preço do diesel no IPCA (barras, % em 12 meses) e volume vendido (linha, % sobre o mesmo mês de 2025)",
            fmt=pct, value_fmt=lambda v: br(v, 1),
            line=("Volume", "--s1", yoy(S["anp_diesel"], "2026-01")), bar_label="Preço 12m"),
        "trr": bar_chart(
            yoy(S["anp_diesel_trr"], "2026-01"),
            "Vendas de diesel TRR, variação sobre o mesmo mês de 2025, %",
            fmt=pct, value_fmt=lambda v: br(v, 1, sign=True)),
        "pim": line_chart(
            [("Veículos", "--s1", yoy(S["pim_veiculos"], "2026-01")),
             ("Borracha", "--accent", yoy(S["pim_borracha"], "2026-01"))],
            "Produção industrial em 2026, variação sobre o mesmo mês de 2025, %",
            fmt=pct, value_fmt=pct_s, label_every=1),
        "termometro": chips(
            [("Emplacamentos", "+18,1% no ano", "fav"), ("Produção de veículos", "+8,7% no ano", "fav"),
             ("Produção de motos", "+9,9% no ano", "fav"), ("Gasolina + etanol", "+4,1% no ano", "fav"),
             ("Diesel", "+1,4% no ano", "neu"), ("Fluxo de pesados", "+1,7% no ano", "neu"),
             ("Varejo (volume)", "+1,7% no ano", "neu"), ("Diesel TRR (agro)", "−6,8% no ano", "desf"),
             ("Fertilizantes", "−8,8% no ano", "desf")],
            "Termômetro de demanda: nove indicadores e seu sinal"),
        "cambio": line_chart(
            [("Em dólar", "--s4", {m: v / S["brent_usd"]["2026-01"] * 100 for m, v in S["brent_usd"].items() if m >= "2026-01"}),
             ("Em reais", "--accent", {m: v / S["brent_brl"]["2026-01"] * 100 for m, v in S["brent_brl"].items() if m >= "2026-01"})],
            "Brent spot em dólar e em reais, média mensal, base jan/2026 = 100",
            fmt=lambda v: br(v, 0), value_fmt=lambda v: br(v, 0), emphasis="Em reais", label_every=1),
    }
    html = SRC.read_text(encoding="utf-8")
    for name, svg in charts.items():
        html = html.replace(f"<!--chart:{name}-->", svg)
    assert "<!--chart:" not in html, "chart slot without a chart"
    return html


if __name__ == "__main__":
    html = build()
    # The PDF is printed from the page without the embed (print CSS hides the button), then embedded.
    OUT.write_text(html.replace("<!--pdf-->", ""), encoding="utf-8")
    pdf = render(OUT)
    b64 = base64.b64encode(pdf.read_bytes()).decode("ascii")
    OUT.write_text(html.replace("<!--pdf-->", f'<script type="text/plain" id="pdf-data">{b64}</script>'), encoding="utf-8")
    print(OUT, pdf)
