"""Shared build step for Mint Newsletter editions.

An edition is a source page (editions/<date>-edicao-NN.src.html) with <!--chart:NAME--> slots
and one <!--pdf--> slot. assemble() fills the charts, prints the A4 PDF from the page, and
embeds that PDF (base64) so the artifact's "Baixar PDF" button can hand it to the viewer."""

import base64
from pathlib import Path

from render_pdf import render


def br(v: float, dec: int = 1, sign: bool = False) -> str:
    """Brazilian number format with a typographic minus: br(-4.86, 2) -> '−4,86'."""
    s = f"{v:+.{dec}f}" if sign else f"{v:.{dec}f}"
    return s.replace("-", "−").replace(".", ",")


def assemble(src: Path, out: Path, charts: dict[str, str]) -> tuple[Path, Path]:
    html = src.read_text(encoding="utf-8")
    for name, svg in charts.items():
        html = html.replace(f"<!--chart:{name}-->", svg)
    assert "<!--chart:" not in html, "chart slot without a chart"
    # The PDF is printed from the page without the embed (print CSS hides the button), then embedded.
    out.write_text(html.replace("<!--pdf-->", ""), encoding="utf-8")
    pdf = render(out)
    b64 = base64.b64encode(pdf.read_bytes()).decode("ascii")
    out.write_text(html.replace("<!--pdf-->", f'<script type="text/plain" id="pdf-data">{b64}</script>'), encoding="utf-8")
    return out, pdf
