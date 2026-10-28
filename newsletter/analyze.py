"""Turn newsletter/data/raw/ into tidy monthly series and the indicator thermometer.

Usage: uv run python newsletter/analyze.py
Writes:
  data/series_mensais.csv  serie,fonte,mes(YYYY-MM),valor,unidade
  data/termometro.json     one row per indicator: last month, YoY, YTD, 12m, last quarter, signal
Signal rule (same as the MINT/RGM Overall panel): score = mean(YTD, last quarter YoY);
> +2% favorable, < -2% unfavorable, otherwise neutral. Prices (IPCA) use the 12-month change
and are not signalled, since higher prices are not "good" or "bad" by themselves."""

import csv
import json
import statistics
from collections import defaultdict
from datetime import date
from pathlib import Path

import openpyxl

DATA = Path(__file__).parent / "data"
RAW = DATA / "raw"
MESES = {m: i + 1 for i, m in enumerate("JAN FEV MAR ABR MAI JUN JUL AGO SET OUT NOV DEZ".split())}

series: dict[str, dict[str, float]] = defaultdict(dict)
meta: dict[str, tuple[str, str, str, str]] = {}  # key -> (nome, fonte, unidade, agregacao: soma|media|preco)


def add(key, nome, fonte, unidade, agg, mes, valor):
    meta[key] = (nome, fonte, unidade, agg)
    series[key][mes] = valor


def sidra(fname, wanted):
    """wanted: {(variavel_prefix, cat1, cat2): (key, nome, unidade, agg)}"""
    for r in csv.DictReader(open(RAW / fname, encoding="utf-8")):
        for (var, c1, c2), spec in wanted.items():
            if r["variavel"].startswith(var) and r["cat1"] == c1 and r["cat2"] == c2:
                try:
                    v = float(r["valor"])
                except ValueError:
                    continue
                mes = f"{r['mes'][:4]}-{r['mes'][4:]}"
                add(spec[0], spec[1], "IBGE", spec[2], spec[3], mes, v)


def load_ibge():
    idx = "PMS - Número-índice (2022=100)"
    vol = "Índice de volume de serviços"
    sidra("ibge_pms_volume.csv", {
        (idx, vol, "Total"): ("pms_total", "PMS · volume de serviços", "índice", "media"),
        (idx, vol, "4. Transportes, serviços auxiliares aos transportes e correio"):
            ("pms_transportes", "PMS · transportes", "índice", "media"),
        (idx, vol, "4.1.1 Rodoviário de cargas"): ("pms_rodoviario_cargas", "PMS · rodoviário de cargas", "índice", "media"),
    })
    sidra("ibge_pmc_receita_volume.csv", {
        ("PMC - Número-índice (2022=100)", "Índice de volume de vendas no comércio varejista", ""):
            ("pmc_volume", "PMC · volume de vendas no varejo", "índice", "media"),
        ("PMC - Número-índice (2022=100)", "Índice de receita nominal de vendas no comércio varejista", ""):
            ("pmc_receita", "PMC · receita nominal do varejo", "índice", "media"),
    })
    pim = "PIMPF - Número-índice (2022=100)"
    sidra("ibge_pim.csv", {
        (pim, "1 Indústria geral", ""): ("pim_geral", "PIM · indústria geral", "índice", "media"),
        (pim, "3 Indústrias de transformação", ""): ("pim_transf", "PIM · transformação", "índice", "media"),
        (pim, "3.22 Fabricação de produtos de borracha e de material plástico", ""):
            ("pim_borracha", "PIM · borracha e plástico", "índice", "media"),
        (pim, "3.29 Fabricação de veículos automotores, reboques e carrocerias", ""):
            ("pim_veiculos", "PIM · veículos, reboques e carrocerias", "índice", "media"),
        (pim, "3.24 Metalurgia", ""): ("pim_metalurgia", "PIM · metalurgia", "índice", "media"),
        (pim, "3.10 Fabricação de produtos alimentícios", ""): ("pim_alimentos", "PIM · alimentos", "índice", "media"),
        (pim, "2 Indústrias extrativas", ""): ("pim_extrativa", "PIM · extrativa", "índice", "media"),
    })
    for var, suf, un in (("IPCA - Variação mensal", "_mes", "% no mês"), ("IPCA - Variação acumulada em 12 meses", "_12m", "% 12 meses")):
        sidra("ibge_ipca.csv", {
            (var, "Índice geral", ""): ("ipca_geral" + suf, "IPCA · geral", un, "preco"),
            (var, "5.Transportes", ""): ("ipca_transportes" + suf, "IPCA · transportes", un, "preco"),
            (var, "5102010.Pneu", ""): ("ipca_pneu" + suf, "IPCA · pneu", un, "preco"),
            (var, "5102009.Acessórios e peças", ""): ("ipca_pecas" + suf, "IPCA · acessórios e peças", un, "preco"),
            (var, "5104.Combustíveis (veículos)", ""): ("ipca_combustiveis" + suf, "IPCA · combustíveis (veículos)", un, "preco"),
            (var, "5104003.Óleo diesel", ""): ("ipca_diesel" + suf, "IPCA · óleo diesel", un, "preco"),
        })


def load_anp():
    tot = defaultdict(float)
    for r in csv.DictReader(open(RAW / "anp_vendas_combustiveis.csv", encoding="utf-8-sig"), delimiter=";"):
        if int(r["ANO"]) < 2015:
            continue
        mes = f"{r['ANO']}-{MESES[r['MÊS']]:02d}"
        tot[(r["PRODUTO"], mes)] += float(r["VENDAS"].replace(",", ".")) / 1000
    for (prod, mes), v in tot.items():
        if prod == "ÓLEO DIESEL":
            add("anp_diesel", "ANP · vendas de óleo diesel", "ANP", "mil m³", "soma", mes, v)
    for mes in {m for (_, m) in tot}:
        gas, eta = tot.get(("GASOLINA C", mes)), tot.get(("ETANOL HIDRATADO", mes))
        if gas and eta:  # gasoline-equivalent, same 0.7 factor as the Overall panel and the MINT spreadsheet
            add("anp_otto", "ANP · ciclo Otto (gasolina C + 0,7×etanol)", "ANP", "mil m³ gas.-eq.", "soma", mes, gas + 0.7 * eta)
    seg = defaultdict(float)
    for r in csv.DictReader(open(RAW / "anp_vendas_segmento.csv", encoding="utf-8-sig"), delimiter=";"):
        if r["PRODUTO"] != "ÓLEO DIESEL" or int(r["ANO"]) < 2015:
            continue
        seg[(r["SEGMENTO"], f"{r['ANO']}-{MESES[r['MÊS']]:02d}")] += float(r["VENDAS"].replace(",", ".")) / 1000
    names = {"TRR": "anp_diesel_trr", "POSTO REVENDEDOR": "anp_diesel_posto", "CONSUMIDOR FINAL": "anp_diesel_consumidor_final"}
    for (s, mes), v in seg.items():
        if s in names:
            add(names[s], f"ANP · diesel, segmento {s.lower()}", "ANP", "mil m³", "soma", mes, v)


def load_abcr():
    wb = openpyxl.load_workbook(RAW / "abcr_base.xlsx", read_only=True, data_only=True)
    for sheet, suf, nome in (("(C) Original", "", "original"), ("(D) Dessazonalizado", "_dessaz", "dessazonalizado")):
        for row in wb[sheet].iter_rows(min_row=4, values_only=True):
            if not hasattr(row[0], "year") or row[1] is None:
                continue
            mes = f"{row[0].year}-{row[0].month:02d}"
            add("abcr_leves" + suf, f"ABCR · fluxo de leves ({nome})", "ABCR", "índice 1999=100", "media", mes, row[1])
            add("abcr_pesados" + suf, f"ABCR · fluxo de pesados ({nome})", "ABCR", "índice 1999=100", "media", mes, row[2])


def load_bcb_fred():
    by_month = defaultdict(list)
    for r in csv.DictReader(open(RAW / "bcb_ptax.csv", encoding="utf-8")):
        by_month[r["dataHoraCotacao"][:7]].append(float(r["cotacaoVenda"].replace(",", ".")))
    for mes, vs in by_month.items():
        add("ptax", "Dólar PTAX (média do mês, venda)", "Banco Central", "R$/US$", "preco_nivel", mes, statistics.mean(vs))
    brent = defaultdict(list)
    for r in csv.DictReader(open(RAW / "fred_brent.csv", encoding="utf-8")):
        if r["DCOILBRENTEU"] not in ("", "."):
            brent[r["observation_date"][:7]].append(float(r["DCOILBRENTEU"]))
    for mes, vs in brent.items():
        add("brent_usd", "Brent spot (média do mês)", "EIA/FRED", "US$/barril", "preco_nivel", mes, statistics.mean(vs))
        if mes in series["ptax"]:
            add("brent_brl", "Brent spot em reais (média do mês)", "EIA/FRED e BCB", "R$/barril", "preco_nivel", mes,
                statistics.mean(vs) * series["ptax"][mes])


def load_anfavea():
    ov = json.load(open(RAW / "mint_overall_2026-10-15.json", encoding="utf-8"))
    for key, nome in (("empl", "ANFAVEA · emplacamento de autoveículos"), ("prod", "ANFAVEA · produção de autoveículos")):
        for mes, v in ov["LN"][key]:
            add("anfavea_" + key, nome, "ANFAVEA", "unid.", "soma", mes, v)
    for row in ov["CGm"]:
        for seg in ("Semipesados", "Pesados"):
            series["anfavea_empl_cam_semipes_pes"][row["p"]] = series["anfavea_empl_cam_semipes_pes"].get(row["p"], 0) + row[seg]
    meta["anfavea_empl_cam_semipes_pes"] = ("ANFAVEA · emplacamento de caminhões semipesados + pesados", "ANFAVEA", "unid.", "soma")


def ym(mes):
    y, m = map(int, mes.split("-"))
    return y, m


def shift(mes, k):
    y, m = ym(mes)
    t = y * 12 + (m - 1) + k
    return f"{t // 12}-{t % 12 + 1:02d}"


def pct(a, b):
    return round((a / b - 1) * 100, 1) if a is not None and b else None


def agg(s, meses, how):
    vals = [s.get(m) for m in meses]
    if any(v is None for v in vals):
        return None
    return sum(vals) if how == "soma" else statistics.mean(vals)


def metrics(key):
    s = series[key]
    nome, fonte, unidade, how = meta[key]
    last = max(s)
    y, m = ym(last)
    row = {"key": key, "nome": nome, "fonte": fonte, "unidade": unidade, "ultimo_mes": last, "valor_ultimo": round(s[last], 2)}
    if how == "preco":
        row.update(var_12m=s[last], sinal=None)
        return row
    ytd = [f"{y}-{i:02d}" for i in range(1, m + 1)]
    l3 = [shift(last, -i) for i in range(3)]
    l12 = [shift(last, -i) for i in range(12)]
    how2 = "media" if how in ("media", "preco_nivel") else how
    row["mes_yoy"] = pct(s[last], s.get(shift(last, -12)))
    row["ytd"] = pct(agg(s, ytd, how2), agg(s, [shift(x, -12) for x in ytd], how2))
    row["tri_yoy"] = pct(agg(s, l3, how2), agg(s, [shift(x, -12) for x in l3], how2))
    row["u12m"] = pct(agg(s, l12, how2), agg(s, [shift(x, -12) for x in l12], how2))
    if how == "preco_nivel":
        row["sinal"] = None
        return row
    parts = [v for v in (row["ytd"], row["tri_yoy"]) if v is not None]
    row["score"] = round(statistics.mean(parts), 1) if parts else None
    sc = row["score"]
    row["sinal"] = None if sc is None else "fav" if sc > 2 else "desf" if sc < -2 else "neu"
    return row


def main():
    load_ibge()
    load_anp()
    load_abcr()
    load_bcb_fred()
    load_anfavea()
    with open(DATA / "series_mensais.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["serie", "nome", "fonte", "mes", "valor", "unidade"])
        for key in sorted(series):
            nome, fonte, unidade, _ = meta[key]
            for mes in sorted(series[key]):
                w.writerow([key, nome, fonte, mes, round(series[key][mes], 4), unidade])
    termo = [metrics(k) for k in sorted(series) if not k.endswith("_mes")]
    out = {"gerado_em": date.today().isoformat(), "regra": __doc__.split("Signal rule")[1].strip(), "indicadores": termo}
    json.dump(out, open(DATA / "termometro.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for r in termo:
        print(f"{r['key']:32} {r['ultimo_mes']}  ult={r['valor_ultimo']:>10}  "
              + "  ".join(f"{k}={r.get(k)}" for k in ("mes_yoy", "ytd", "tri_yoy", "u12m", "var_12m", "sinal") if k in r))


if __name__ == "__main__":
    main()
