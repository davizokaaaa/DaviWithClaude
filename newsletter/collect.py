"""Download the open-data series behind the Mint Newsletter into newsletter/data/raw/.

Usage: uv run python newsletter/collect.py
Each source is saved as delivered (CSV/XLSX/JSON), so analyze.py can be rerun offline.
Sources and citation rules: newsletter/FONTES.md."""

import json
import re
import sys
import time
import urllib.request
from pathlib import Path

RAW = Path(__file__).parent / "data" / "raw"
SIDRA_PERIOD = "201901-202612"

SIDRA = {
    # PMS: volume index (raw + seasonally adjusted), all activities incl. road freight
    "ibge_pms_volume": f"t/8688/n1/all/v/7167,7168/p/{SIDRA_PERIOD}/c11046/56726/c12355/all",
    # PMC: nominal revenue and volume
    "ibge_pmc_receita_volume": f"t/8880/n1/all/v/7169,7170/p/{SIDRA_PERIOD}/c11046/all",
    # PIM-PF: general, extractive, manufacturing, food, rubber & plastic, metallurgy, metal products,
    # electrical machinery, vehicles
    "ibge_pim": f"t/8888/n1/all/v/12606,12607/p/{SIDRA_PERIOD}/c544/129314,129315,129316,129317,129331,129333,129334,129336,129338",
    # IPCA: general, transport, tire (subitem 5102010), parts, vehicle fuels, diesel
    "ibge_ipca": f"t/7060/n1/all/v/63,2265/p/{SIDRA_PERIOD}/c315/7169,7625,12411,7645,7656,7659",
}

URLS = {
    "bcb_ptax.csv": "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/"
    "CotacaoDolarPeriodo(dataInicial=@i,dataFinalCotacao=@f)?@i='01-01-2019'&@f='12-31-2030'"
    "&$format=text/csv&$select=cotacaoVenda,dataHoraCotacao",
    "bcb_focus.csv": "https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/"
    "ExpectativasMercadoAnuais?$filter=Data%20ge%20'2026-01-01'%20and%20baseCalculo%20eq%200"
    "&$format=text/csv&$select=Indicador,IndicadorDetalhe,Data,DataReferencia,Mediana",
    "bcb_selic_meta.json": "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json&dataInicial=01/01/2025",
    "fred_brent.csv": "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DCOILBRENTEU&cosd=2019-01-01",
    "anp_vendas_combustiveis.csv": "https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/"
    "arquivos/vdpb/vendas-derivados-petroleo-e-etanol/vendas-combustiveis-m3-1990-2025.csv",
    "anp_vendas_segmento.csv": "https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/"
    "arquivos/vdpb/vcs/vendas-combustiveis-segmento-m3-2012-2025.csv",
}


def fetch(url: str, timeout: int = 180) -> bytes:
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (mint-newsletter)"})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as e:  # network through the proxy is flaky; back off and retry
            print(f"retry {attempt + 1}: {url[:70]} ({e})", file=sys.stderr)
            time.sleep(2**attempt)
    raise RuntimeError(f"failed: {url}")


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    for name, path in SIDRA.items():
        rows = json.loads(fetch(f"https://apisidra.ibge.gov.br/values/{path}/h/n"))
        with open(RAW / f"{name}.csv", "w", encoding="utf-8") as f:
            f.write("variavel,mes,cat1,cat2,valor\n")
            for r in rows[1:]:
                cells = [r.get("D2N", ""), r.get("D3C", ""), r.get("D4N", ""), r.get("D5N", ""), r["V"]]
                f.write(",".join('"' + str(c).replace('"', "'") + '"' for c in cells) + "\n")
        print(name, len(rows) - 1)
    for name, url in URLS.items():
        (RAW / name).write_bytes(fetch(url))
        print(name)
    # ABCR publishes a new workbook each month; the link is scraped from the index page.
    page = fetch("https://melhoresrodovias.org.br/indice-abcr_2/").decode("utf-8", "replace")
    xlsx = re.search(r"https://melhoresrodovias\.org\.br/wp-content/uploads/[^\"'<>\s]+?\.xlsx", page).group(0)
    (RAW / "abcr_base.xlsx").write_bytes(fetch(xlsx))
    print("abcr_base.xlsx", xlsx)


if __name__ == "__main__":
    main()
