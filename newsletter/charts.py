"""Inline SVG charts for Mint Newsletter editions, drawn from data/series_mensais.csv.

Colors come from CSS tokens of the page (var(--s1) etc.), so the same SVG works in light,
dark and print. Each chart is a 16:9 viewBox: it serves as the card image on the front
page and, at a larger size, as the chart of the story."""

import csv
import math
from collections import defaultdict
from html import escape
from pathlib import Path

DATA = Path(__file__).parent / "data"
W, H = 640, 360
PAD_L, PAD_R, PAD_T, PAD_B = 46, 132, 18, 34
MES_ABBR = "jan fev mar abr mai jun jul ago set out nov dez".split()


def load_series() -> dict[str, dict[str, float]]:
    s: dict[str, dict[str, float]] = defaultdict(dict)
    for r in csv.DictReader(open(DATA / "series_mensais.csv", encoding="utf-8")):
        s[r["serie"]][r["mes"]] = float(r["valor"])
    return s


def mes_label(mes: str, with_year: bool = False) -> str:
    y, m = mes.split("-")
    return f"{MES_ABBR[int(m) - 1]}/{y[2:]}" if with_year or m == "01" else MES_ABBR[int(m) - 1]


def _nice_ticks(lo: float, hi: float, n: int = 4) -> list[float]:
    span = hi - lo or 1
    raw = span / n
    mag = 10 ** math.floor(math.log10(raw))
    step = min((s * mag for s in (1, 2, 2.5, 5, 10) if s * mag >= raw), default=raw)
    first, last = math.floor(lo / step + 1e-9), math.ceil(hi / step - 1e-9)
    out = [round(k * step, 6) for k in range(first, last + 1)]
    return out


def _frame(xs: list[str], lo: float, hi: float, fmt, label_every: int):
    ticks = _nice_ticks(lo, hi)
    lo, hi = min(lo, ticks[0]), max(hi, ticks[-1])
    pw, ph = W - PAD_L - PAD_R, H - PAD_T - PAD_B

    def x(i: float) -> float:
        return PAD_L + (pw * i / (len(xs) - 1) if len(xs) > 1 else pw / 2)

    def y(v: float) -> float:
        return PAD_T + ph * (1 - (v - lo) / (hi - lo))

    parts = []
    for t in ticks:
        cls = "c-zero" if abs(t) < 1e-9 and lo < 0 < hi else "c-grid"
        parts.append(f'<line class="{cls}" x1="{PAD_L}" x2="{W - PAD_R}" y1="{y(t):.1f}" y2="{y(t):.1f}"/>')
        parts.append(f'<text class="c-tick" x="{PAD_L - 6}" y="{y(t) + 4:.1f}" text-anchor="end">{escape(fmt(t))}</text>')
    for i, m in enumerate(xs):
        month = int(m[5:])
        if i == 0 or (month - 1) % label_every == 0:
            parts.append(f'<text class="c-tick" x="{x(i):.1f}" y="{H - 10}" text-anchor="middle">{mes_label(m, with_year=i == 0)}</text>')
    return x, y, parts


def _svg(parts: list[str], title: str) -> str:
    return (f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="{escape(title)}" '
            f'preserveAspectRatio="xMidYMid meet"><title>{escape(title)}</title>{"".join(parts)}</svg>')


def line_chart(lines: list[tuple[str, str, dict[str, float]]], title: str, fmt=lambda v: f"{v:g}",
               label_every: int = 3, emphasis: str | None = None, value_fmt=None) -> str:
    """lines: (label, css color var, {mes: valor}). The emphasized line is drawn thicker; others thinner."""
    xs = sorted({m for _, _, d in lines for m in d})
    vals = [v for _, _, d in lines for v in d.values()]
    x, y, parts = _frame(xs, min(vals), max(vals), fmt, label_every)
    value_fmt = value_fmt or fmt
    ends = []
    for label, color, d in lines:
        pts = [(x(xs.index(m)), y(v)) for m, v in sorted(d.items())]
        strong = emphasis is None or label == emphasis
        path = " ".join(f"{'M' if i == 0 else 'L'}{px:.1f},{py:.1f}" for i, (px, py) in enumerate(pts))
        parts.append(f'<path d="{path}" fill="none" stroke="var({color})" stroke-width="{3.2 if strong else 1.8}" '
                     f'stroke-linejoin="round" stroke-linecap="round" opacity="{1 if strong else .75}"/>')
        lx, ly = pts[-1]
        parts.append(f'<circle cx="{lx:.1f}" cy="{ly:.1f}" r="{4 if strong else 3}" fill="var({color})"/>')
        last = sorted(d)[-1]
        ends.append([ly, f"{label} {value_fmt(d[last])}", color, strong])
    # end labels in the right margin, pushed apart so they never overlap
    ends.sort()
    for i in range(1, len(ends)):
        ends[i][0] = max(ends[i][0], ends[i - 1][0] + 15)
    for ly, text, color, strong in ends:
        parts.append(f'<text class="c-end{" c-strong" if strong else ""}" x="{W - PAD_R + 8}" y="{ly + 4:.1f}" '
                     f'fill="var({color})">{escape(text)}</text>')
    return _svg(parts, title)


def bar_chart(d: dict[str, float], title: str, fmt=lambda v: f"{v:g}", line: tuple[str, str, dict[str, float]] | None = None,
              bar_label: str = "", value_fmt=None) -> str:
    """Monthly bars (positive = --up, negative = --down) with an optional overlaid line."""
    xs = sorted(set(d) | (set(line[2]) if line else set()))
    vals = list(d.values()) + (list(line[2].values()) if line else []) + [0]
    x0, y, parts = _frame(xs, min(vals), max(vals), fmt, 1)
    pw = W - PAD_L - PAD_R
    bw = pw / len(xs) * 0.62
    step = pw / len(xs)

    def x(i: float) -> float:  # bars are centered in equal slots, so x differs from the line frame
        return PAD_L + step * (i + 0.5)

    # redraw month labels on slot centers
    parts = [p for p in parts if 'text-anchor="middle"' not in p]
    for i, m in enumerate(xs):
        parts.append(f'<text class="c-tick" x="{x(i):.1f}" y="{H - 10}" text-anchor="middle">{mes_label(m)}</text>')
    value_fmt = value_fmt or fmt
    for i, m in enumerate(xs):
        if m not in d:
            continue
        v = d[m]
        top, bot = (y(v), y(0)) if v >= 0 else (y(0), y(v))
        cls = "c-bar-up" if v >= 0 else "c-bar-dn"
        parts.append(f'<rect class="{cls}" x="{x(i) - bw / 2:.1f}" y="{top:.1f}" width="{bw:.1f}" height="{max(bot - top, 1):.1f}"/>')
        ty = top - 6 if v >= 0 else bot + 14
        parts.append(f'<text class="c-val" x="{x(i):.1f}" y="{ty:.1f}" text-anchor="middle">{escape(value_fmt(v))}</text>')
    if line:
        label, color, ld = line
        pts = [(x(xs.index(m)), y(v)) for m, v in sorted(ld.items())]
        path = " ".join(f"{'M' if i == 0 else 'L'}{px:.1f},{py:.1f}" for i, (px, py) in enumerate(pts))
        parts.append(f'<path d="{path}" fill="none" stroke="var({color})" stroke-width="3" stroke-linejoin="round"/>')
        for px, py in pts:
            parts.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="3.5" fill="var({color})"/>')
        last = sorted(ld)[-1]
        parts.append(f'<text class="c-end c-strong" x="{W - PAD_R + 8}" y="{pts[-1][1] + 4:.1f}" fill="var({color})">'
                     f'{escape(label)} {escape(value_fmt(ld[last]))}</text>')
    if bar_label:
        parts.append(f'<text class="c-end" x="{W - PAD_R + 8}" y="{PAD_T + 10}" fill="var(--muted)">{escape(bar_label)}</text>')
    return _svg(parts, title)


def chips(rows: list[tuple[str, str, str]], title: str) -> str:
    """Thermometer as a grid of chips: (label, value text, signal fav|neu|desf)."""
    cols, gap = 3, 8
    cw = (W - gap * (cols - 1)) / cols
    rows_n = -(-len(rows) // cols)
    ch = (H - gap * (rows_n - 1)) / rows_n
    parts = []
    for i, (label, val, sig) in enumerate(rows):
        cx, cy = (i % cols) * (cw + gap), (i // cols) * (ch + gap)
        parts.append(f'<rect class="c-chip c-{sig}" x="{cx:.1f}" y="{cy:.1f}" width="{cw:.1f}" height="{ch:.1f}"/>')
        parts.append(f'<text class="c-chip-l" x="{cx + 10:.1f}" y="{cy + ch / 2 - 3:.1f}">{escape(label)}</text>')
        parts.append(f'<text class="c-chip-v c-{sig}-t" x="{cx + 10:.1f}" y="{cy + ch / 2 + 15:.1f}">{escape(val)}</text>')
    return _svg(parts, title)
