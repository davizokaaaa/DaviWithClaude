"""Baixa a página da Central de Dados e salva o HTML + scripts JS para inspeção."""
import pathlib
import re

import requests

BASE = "https://anfavea.com.br/site/central-de-dados/"
UA = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
}
out = pathlib.Path(__file__).resolve().parent.parent / "probe"
out.mkdir(exist_ok=True)

s = requests.Session()
s.headers.update(UA)
html = s.get(BASE, timeout=60).text
(out / "page.html").write_text(html, encoding="utf-8")

# scripts do dashboard (o JS revela os campos enviados ao admin-ajax)
for src in sorted(set(re.findall(r'<script[^>]+src="([^"]+)"', html))):
    if "anfavea" in src.lower() or "dashboard" in src.lower():
        name = re.sub(r"[^A-Za-z0-9._-]", "_", src.split("?")[0].rsplit("/", 1)[-1])
        try:
            (out / f"js_{name}").write_text(s.get(src, timeout=60).text, encoding="utf-8")
            print("saved", src)
        except Exception as e:  # noqa: BLE001
            print("fail", src, e)
print("page bytes", len(html))
