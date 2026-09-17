"""Baixa o Monthly Report do ANIP (login + export CSV) e escreve os valores na
planilha local Base ANIP <ano>.xlsx, na aba correspondente ao mes do relatorio.

Disparado por uma macro VBA (botao na planilha) via Shell(), ou manualmente com:
    uv run python experiments/anip_report/anip_report.py

Requer um arquivo .env (nao commitado) ao lado deste script, ou variaveis de
ambiente ja exportadas, com:
    ANIP_USERNAME=d.bastos
    ANIP_PASSWORD=...
    ANIP_EXCEL_PATH=C:\\Users\\...\\Base ANIP 2026.xlsx
"""

import csv
import io
import os
import re
import ssl
import sys
from datetime import date
from pathlib import Path

import certifi
import openpyxl
import requests
import urllib3
from requests.adapters import HTTPAdapter
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class NoVerifyAdapter(HTTPAdapter):
    """Desliga a verificacao de certificado, mas pre-carrega um bundle valido
    (certifi) para evitar um bug do urllib3 no Windows: mesmo com verify=False,
    ele tenta carregar os certificados padrao do sistema operacional e quebra
    se houver algum certificado corrompido no repositorio do Windows."""

    def init_poolmanager(self, *args, **kwargs):
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        context.load_verify_locations(certifi.where())
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        kwargs["ssl_context"] = context
        return super().init_poolmanager(*args, **kwargs)


BASE_URL = "https://matis-anip.anura.biz"
LOGIN_URL = (
    f"{BASE_URL}/_layouts/15/FBA/LOGINPAGE/LoginANIP.aspx"
    "?ReturnUrl=%2f_layouts%2f15%2fAuthenticate.aspx%3fSource%3d%252F&Source=%2f"
)
REPORT_URL = f"{BASE_URL}/MIC/Pages/MonthlyReport.aspx"

MONTH_ABBREV_PT = {
    "January": "JAN", "February": "FEV", "March": "MAR", "April": "ABR",
    "May": "MAI", "June": "JUN", "July": "JUL", "August": "AGO",
    "September": "SET", "October": "OUT", "November": "NOV", "December": "DEZ",
}

MONTH_NAME_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


def expected_period() -> tuple[int, str]:
    """O ANIP publica o relatorio do mes anterior (M-1): hoje setembro -> esperado agosto."""
    today = date.today()
    prev_month = today.month - 1 or 12
    prev_year = today.year if today.month > 1 else today.year - 1
    return prev_year, MONTH_NAME_EN[prev_month - 1]

# Segmento -> linha na aba (layout atual: B5:B11).
SEGMENT_ROW = {
    "1000": 5, "2000": 6, "3000": 7, "4000": 8,
    "5000": 9, "6000": 10, "7000": 11,
}


def extract_hidden_field(html: str, field_name: str) -> str:
    match = re.search(rf'id="{field_name}"[^>]*value="([^"]*)"', html)
    if not match:
        raise RuntimeError(f"Campo oculto {field_name} nao encontrado na pagina de login.")
    return match.group(1)


def login(session: requests.Session, username: str, password: str) -> None:
    get_resp = session.get(LOGIN_URL)
    get_resp.raise_for_status()

    view_state = extract_hidden_field(get_resp.text, "__VIEWSTATE")
    view_state_generator = extract_hidden_field(get_resp.text, "__VIEWSTATEGENERATOR")
    event_validation = extract_hidden_field(get_resp.text, "__EVENTVALIDATION")

    payload = {
        "__LASTFOCUS": "",
        "__EVENTTARGET": "",
        "__EVENTARGUMENT": "",
        "__VIEWSTATE": view_state,
        "__VIEWSTATEGENERATOR": view_state_generator,
        "__EVENTVALIDATION": event_validation,
        "ctl00$PlaceHolderMain$signInControl$UserName": username,
        "ctl00$PlaceHolderMain$signInControl$password": password,
        "ctl00$PlaceHolderMain$signInControl$login": "Sign In",
    }

    post_resp = session.post(LOGIN_URL, data=payload)
    post_resp.raise_for_status()

    if "FedAuth" not in session.cookies:
        raise RuntimeError("Login parece ter falhado: cookie FedAuth nao foi definido. Confira usuario/senha.")


def load_report_session_info(session: requests.Session) -> tuple[str, str, int, str]:
    resp = session.get(REPORT_URL)
    resp.raise_for_status()
    html = resp.text

    session_match = re.search(r"ReportSession=([a-z0-9]+)", html, re.IGNORECASE)
    control_match = re.search(r"ControlID=([a-f0-9]+)", html, re.IGNORECASE)
    period_match = re.search(r"Period:\s*(\d{4})\s*-\s*(\w+)", html, re.IGNORECASE)

    if not session_match or not control_match:
        raise RuntimeError(
            "Nao foi possivel extrair ReportSession/ControlID da pagina. Login pode ter falhado."
        )
    if not period_match:
        raise RuntimeError("Nao foi possivel extrair o periodo (ano/mes) do relatorio.")

    return session_match.group(1), control_match.group(1), int(period_match.group(1)), period_match.group(2)


def export_csv(session: requests.Session, report_session: str, control_id: str) -> str:
    export_url = (
        f"{BASE_URL}/Reserved.ReportViewerWebControl.axd?ReportSession={report_session}"
        "&Culture=2057&CultureOverrides=False&UICulture=1033&UICultureOverrides=True&ReportStack=1"
        f"&ControlID={control_id}&OpType=Export&FileName=MonthlyReport"
        "&ContentDisposition=OnlyHtmlInline&Format=CSV"
    )
    resp = session.get(export_url)
    resp.raise_for_status()
    return resp.text


def to_number(value: str) -> float:
    cleaned = (value or "").replace(",", "").strip()
    return float(cleaned) if cleaned else 0.0


def parse_csv(csv_text: str) -> list[dict]:
    rows = []
    reader = csv.reader(io.StringIO(csv_text))
    for cols in reader:
        if not cols:
            continue
        segment_label = cols[0].strip()
        code_match = re.match(r"^(\d{4})", segment_label)
        if not code_match:
            continue  # cabecalho (textbox79,...) ou linha invalida

        cols += [""] * (4 - len(cols))  # garante 4 colunas mesmo se faltar alguma
        rows.append({
            "code": code_match.group(1),
            "replacement": to_number(cols[1]),
            "original_equipment": to_number(cols[2]),
            "import_qtd": to_number(cols[3]),
        })
    return rows


def write_to_excel(excel_path: str, sheet_name: str, rows: list[dict]) -> None:
    path = Path(excel_path)
    if not path.exists():
        raise FileNotFoundError(f"Planilha nao encontrada em: {excel_path}")

    workbook = openpyxl.load_workbook(path, keep_vba=path.suffix.lower() == ".xlsm")
    if sheet_name not in workbook.sheetnames:
        raise RuntimeError(f'Aba "{sheet_name}" nao encontrada na planilha.')

    sheet = workbook[sheet_name]
    for row in rows:
        excel_row = SEGMENT_ROW.get(row["code"])
        if excel_row is None:
            continue
        for column, value in (("D", row["replacement"]), ("E", row["original_equipment"]), ("F", row["import_qtd"])):
            cell = sheet[f"{column}{excel_row}"]
            cell.value = value
            cell.number_format = "#,##0"

    workbook.save(path)


def main() -> None:
    load_dotenv(Path(__file__).parent / ".env")

    username = os.environ.get("ANIP_USERNAME")
    password = os.environ.get("ANIP_PASSWORD")
    excel_path = os.environ.get("ANIP_EXCEL_PATH")

    missing = [
        name for name, value in
        [("ANIP_USERNAME", username), ("ANIP_PASSWORD", password), ("ANIP_EXCEL_PATH", excel_path)]
        if not value
    ]
    if missing:
        print(f"Faltando variaveis de ambiente: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)

    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    session.verify = False  # rede corporativa faz TLS interception no dominio do ANIP
    session.mount("https://", NoVerifyAdapter())

    print("Fazendo login no ANIP...")
    login(session, username, password)

    print("Carregando relatorio e extraindo sessao...")
    report_session, control_id, period_year, period_label = load_report_session_info(session)
    print(f"Periodo do relatorio: {period_year} - {period_label}")

    expected_year, expected_label = expected_period()
    if (period_year, period_label) != (expected_year, expected_label):
        print(
            f"AVISO: esperava {expected_year} - {expected_label} (mes atual - 1), "
            f"mas o ANIP retornou {period_year} - {period_label}. "
            "O ANIP pode ainda nao ter publicado o mes esperado."
        )

    print("Exportando CSV...")
    csv_text = export_csv(session, report_session, control_id)
    rows = parse_csv(csv_text)
    print(f"{len(rows)} segmentos extraidos.")

    sheet_name = MONTH_ABBREV_PT.get(period_label)
    if not sheet_name:
        raise RuntimeError(f"Mes nao reconhecido: {period_label}")

    print(f'Escrevendo na aba "{sheet_name}" de {excel_path}...')
    write_to_excel(excel_path, sheet_name, rows)

    print("Concluido com sucesso.")


if __name__ == "__main__":
    main()
