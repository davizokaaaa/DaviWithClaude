"""Build MINT Journal nº 2 (28/10/2026): the Michelin-style redesign of edition nº 2.

Usage: uv run python newsletter/build_journal_02.py
Story images are drawn by journal_art.tile() (no photos or logo). Indicator numbers come as given
from data/newsletter_indicadores_2026-10.md; news figures come from the sources cited in each story."""

from pathlib import Path

from edition import assemble
from journal_art import tile

HERE = Path(__file__).parent
SRC = HERE / "editions" / "2026-10-28-mint-journal-02.src.html"
OUT = HERE / "editions" / "2026-10-28-mint-journal-02.html"


def build() -> dict[str, str]:
    return {
        "m1": tile("caminhao", "+16,1%", "produção de caminhões pesados", "set/2026 vs set/2025 · ANFAVEA"),
        "m2": tile("bomba", "R$ 2,12/l", "subvenção ao diesel renovada", "por mais 30 dias em 27/10"),
        "m3": tile("gota", "265 ¢/kg", "borracha natural em 12/10", "maior preço em dez anos"),
        "m4": tile("navio", "US$ 114,85", "Brent em 27/10", "queda com conversas de paz"),
        "m5": tile("globo", "+36,1%", "vendas de carros novos na Colômbia", "set/2026 · melhor mês em 12 anos"),
        "ind": tile("painel", "outubro", "indicadores do mês", "atividade, preços, transporte, agro"),
    }


if __name__ == "__main__":
    print(*assemble(SRC, OUT, build()))
