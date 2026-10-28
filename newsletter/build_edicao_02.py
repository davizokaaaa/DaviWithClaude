"""Build Mint Newsletter edition nº 2 (28/10/2026): Seção de Indicadores de outubro/2026.

Usage: uv run python newsletter/build_edicao_02.py
Every number in the indicator charts is copied as given from the monthly indicator summary
(data/newsletter_indicadores_2026-10.md); nothing is computed here. The three news cards show
one figure each from the cited news source."""

from pathlib import Path

from charts import hbar_chart, number_card
from edition import assemble

HERE = Path(__file__).parent
SRC = HERE / "editions" / "2026-10-28-edicao-02.src.html"
OUT = HERE / "editions" / "2026-10-28-edicao-02.html"


def build() -> dict[str, str]:
    return {
        "atividade": hbar_chart(
            [("PIB agropecuária (2º tri)", -18.8, "−18,8%"), ("PIB indústria (2º tri)", 9.7, "+9,7%"),
             ("PIB serviços (2º tri)", 8.0, "+8,0%"), ("Produção industrial (ago)", -0.9, "−0,9%"),
             ("Volume de serviços (ago)", 0.6, "+0,6%"), ("Varejo, receita (ago)", 4.3, "+4,3%")],
            "Atividade econômica: variação sobre o mesmo período de 2025, %"),
        "precos": hbar_chart(
            [("IPCA set/2026, no mês", 0.82, "0,82%"), ("IPCA, 12 meses", 4.58, "4,58%"),
             ("Focus, IPCA 2026", 5.19, "5,19%"), ("Focus, IPCA 2027", 4.34, "4,34%")],
            "IPCA de setembro de 2026 e expectativas do Focus de 23/10/2026, %"),
        "confianca": hbar_chart(
            [("Intenção de consumo (ICF)", 103.6, "103,6"), ("Confiança da indústria", 91.0, "91,0"),
             ("Confiança do consumidor", 84.7, "84,7")],
            "Índices de confiança e consumo, outubro de 2026, pontos; linha em 100",
            ref=100, domain=(80, 108), ref_label="100"),
        "transporte": hbar_chart(
            [("Caminhões pesados (set)", 16.1, "+16,1%"), ("Ônibus (set)", -48.9, "−48,9%"),
             ("Diesel (ago)", 1.9, "+1,9%"), ("Gasolina C (ago)", 0.4, "+0,4%"),
             ("Etanol hidratado (ago)", 21.1, "+21,1%"), ("Fluxo pedagiado (set)", 0.2, "+0,2%")],
            "Transporte e mobilidade: variação sobre o mesmo mês de 2025, %"),
        "agro": hbar_chart(
            [("Fertilizantes (jul, a/a)", -22.3, "−22,3%"), ("Grãos 2026/27 vs 25/26", 1.5, "+1,5%"),
             ("Cana 2026/27 vs 25/26", 4.7, "+4,7%"), ("Soja exportada (set, m/m)", -25.9, "−25,9%")],
            "Agro: fertilizantes, safra e exportação de soja, variação %"),
        "infra": hbar_chart(
            [("Asfalto, ago vs ago/25", 11.0, "+11,0%"), ("Asfalto, ago vs jul", 15.9, "+15,9%")],
            "Produção de asfalto em agosto de 2026, variação %"),
        "n_diesel": number_card("R$ 2,12/l", "subvenção ao diesel renovada", "por mais 30 dias em 27/10"),
        "n_brent": number_card("US$ 114,85", "Brent em 27/10, em queda com", "conversas de paz no Irã"),
        "n_borracha": number_card("265 ¢/kg", "borracha natural em 12/10,", "máxima em dez anos"),
    }


if __name__ == "__main__":
    print(*assemble(SRC, OUT, build()))
