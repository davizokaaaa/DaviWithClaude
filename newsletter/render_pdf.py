"""Render a newsletter edition (artifact-style HTML fragment) to an A4 PDF with headless Chromium.

Usage: uv run python newsletter/render_pdf.py newsletter/editions/<edition>.html
Writes the PDF next to the HTML file.
"""

import os
import subprocess
import sys
import tempfile
from pathlib import Path

CHROMIUM = os.environ.get("CHROMIUM", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome")

SKELETON = """<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{{margin:0}}</style></head><body>
{content}
</body></html>"""


def render(html_path: Path) -> Path:
    pdf_path = html_path.with_suffix(".pdf")
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as tmp:
        tmp.write(SKELETON.format(content=html_path.read_text(encoding="utf-8")))
    cmd = [
        CHROMIUM,
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--virtual-time-budget=15000",
        f"--print-to-pdf={pdf_path}",
    ]
    if proxy := os.environ.get("HTTPS_PROXY"):
        cmd.append(f"--proxy-server={proxy}")
    cmd.append(Path(tmp.name).as_uri())
    subprocess.run(cmd, check=True, capture_output=True)
    return pdf_path


if __name__ == "__main__":
    print(render(Path(sys.argv[1])))
