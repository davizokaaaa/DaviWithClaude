"""Coleta todos os dados da seção Autoveículos da Central de Dados da ANFAVEA.

A Central de Dados (https://anfavea.com.br/site/central-de-dados/) monta as tabelas
via POST em admin-ajax.php (action=anfavea_dashboard1) com um nonce público que
vem embutido na página (var anfaveaData = {..."nonce":"..."}).

Este script varre todas as combinações de "Autoveículos" (dashboard1) com
agregação mensal desde INICIO e salva:
  data/raw/<consulta>.json   resposta bruta (table_html)
  data/csv/<consulta>.csv    tabela parseada (formato largo, valores inteiros)

Uso: python collect.py [--inicio 2023-01] [--fim AAAA-MM]
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import pathlib
import re
import sys
import time

import requests

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from parse import parse_table  # noqa: E402

PAGE = "https://anfavea.com.br/site/central-de-dados/"
AJAX = "https://anfavea.com.br/site/wp-admin/admin-ajax.php"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
}
ROOT = pathlib.Path(__file__).resolve().parent.parent / "data"

CATEGORIAS = ["automoveis", "comerciais_leves", "caminhoes", "onibus"]
SUBSEG_CAMINHAO = ["SEMILEVES", "LEVES", "MÉDIOS", "SEMIPESADOS", "PESADOS"]
TIPOS = ["producao", "emplacamento", "exportacao"]


def consultas() -> list[tuple[str, dict]]:
    """(nome, campos) de cada consulta. Campos com lista viram 'campo[]'."""
    out: list[tuple[str, dict]] = []
    for tipo in TIPOS:
        # Totais por categoria (sem dimensão), uma consulta com todas as categorias
        out.append((f"{tipo}__categorias", {
            "tipo_dado": tipo, "categorias": CATEGORIAS + ["total_leves", "total_pesados"],
            "dimensao_emplacamento": "",
        }))
        # Caminhões abertos por subsegmento
        out.append((f"{tipo}__caminhoes_subsegmento", {
            "tipo_dado": tipo, "categorias": ["caminhoes"],
            "subsegmento_caminhao": SUBSEG_CAMINHAO, "dimensao_emplacamento": "",
        }))
    for cat in CATEGORIAS:
        # Emplacamento: procedência x empresa x marca (máximo detalhamento)
        out.append((f"emplacamento__{cat}__procedencia_empresa_marca", {
            "tipo_dado": "emplacamento", "categorias": [cat],
            "dimensao_emplacamento": "procedencia",
            "procedencia": ["nacionais", "importados"],
            "por_empresa": 1, "por_marca": 1, "empresa": "", "marca": "",
            "combustivel_filter": "",
        }))
        # Emplacamento: procedência (nacional x importado), sem empresa
        out.append((f"emplacamento__{cat}__procedencia", {
            "tipo_dado": "emplacamento", "categorias": [cat],
            "dimensao_emplacamento": "procedencia",
            "procedencia": ["nacionais", "importados"],
            "por_empresa": 0, "por_marca": 0, "empresa": "", "marca": "",
            "combustivel_filter": "",
        }))
        # Emplacamento: procedência x empresa
        out.append((f"emplacamento__{cat}__procedencia_empresa", {
            "tipo_dado": "emplacamento", "categorias": [cat],
            "dimensao_emplacamento": "procedencia",
            "procedencia": ["nacionais", "importados"],
            "por_empresa": 1, "por_marca": 0, "empresa": "", "marca": "",
            "combustivel_filter": "",
        }))
        # Emplacamento: por combustível
        out.append((f"emplacamento__{cat}__combustivel", {
            "tipo_dado": "emplacamento", "categorias": [cat],
            "dimensao_emplacamento": "combustivel",
            "combustivel_filter": ["todos"],
            "procedencia": "", "por_empresa": 0, "por_marca": 0, "empresa": "", "marca": "",
        }))
    return out


def build_body(nonce: str, campos: dict, inicio: str, fim: str) -> list[tuple[str, str]]:
    base = {
        "action": "anfavea_dashboard1", "nonce": nonce, "dashboard": "dashboard1",
        "procedencia": "total", "por_empresa": 0, "por_marca": 0,
        "empresa": "", "marca": "", "combustivel_filter": "",
        "agregacao": "mensal", "inicio": inicio, "fim": fim,
    }
    base.update(campos)
    body: list[tuple[str, str]] = []
    for k, v in base.items():
        if isinstance(v, list):
            body += [(f"{k}[]", str(x)) for x in v]
        else:
            body.append((k, str(v)))
    return body


def get_nonce(s: requests.Session) -> str:
    html = s.get(PAGE, timeout=60).text
    m = re.search(r'var anfaveaData\s*=\s*\{.*?"nonce"\s*:\s*"([0-9a-f]+)"', html, re.S)
    if not m:
        raise RuntimeError("nonce não encontrado na página")
    return m.group(1)


def post(s: requests.Session, body, tries: int = 4) -> dict:
    for i in range(tries):
        try:
            r = s.post(AJAX, data=body, headers={"Referer": PAGE}, timeout=180)
            r.raise_for_status()
            return r.json()
        except Exception as e:  # noqa: BLE001
            if i == tries - 1:
                raise
            print(f"  retry {i + 1}: {e}")
            time.sleep(2 ** (i + 1))
    raise AssertionError


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--inicio", default="2023-01")
    ap.add_argument("--fim", default=dt.date.today().strftime("%Y-%m"))
    ap.add_argument("--only", default="", help="regex para filtrar consultas")
    a = ap.parse_args()

    (ROOT / "raw").mkdir(parents=True, exist_ok=True)
    (ROOT / "csv").mkdir(parents=True, exist_ok=True)
    s = requests.Session()
    s.headers.update(HEADERS)
    nonce = get_nonce(s)

    log = []
    for nome, campos in consultas():
        if a.only and not re.search(a.only, nome):
            continue
        body = build_body(nonce, campos, a.inicio, a.fim)
        try:
            resp = post(s, body)
        except Exception as e:  # noqa: BLE001
            print(f"[ERRO] {nome}: {e}")
            log.append({"consulta": nome, "ok": False, "erro": str(e)})
            continue
        (ROOT / "raw" / f"{nome}.json").write_text(
            json.dumps({"request": body[2:], "response": resp}, ensure_ascii=False, indent=1),
            encoding="utf-8")
        ok = bool(resp.get("success"))
        entry = {"consulta": nome, "ok": ok}
        if ok:
            try:
                df = parse_table(resp["data"]["table_html"])
                df.to_csv(ROOT / "csv" / f"{nome}.csv", index=False)
                entry.update(linhas=len(df), colunas=list(df.columns)[:12])
            except Exception as e:  # noqa: BLE001
                entry.update(erro_parse=str(e))
        else:
            entry["erro"] = str(resp.get("data"))[:300]
        print(entry)
        log.append(entry)
        time.sleep(1.5)

    (ROOT / "coleta_log.json").write_text(
        json.dumps({"inicio": a.inicio, "fim": a.fim,
                    "coletado_em": dt.datetime.now(dt.timezone.utc).isoformat(),
                    "consultas": log}, ensure_ascii=False, indent=1), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
