"""Story art for MINT Journal: a 16:9 tile in Michelin blue with a line icon, one figure and a caption.

No photos and no logo: the team has no image bank or brand files, so every story image is drawn
here. Colors come from the page's CSS tokens (--band, --yellow, --on-band), so the same SVG works
in light, dark and print."""

from html import escape

W, H = 640, 360

# Line icons on a 100×100 grid, drawn with stroke only (fill="none" is set on the group).
ICONS = {
    "caminhao": '<rect x="6" y="30" width="52" height="34" rx="2"/><path d="M58 40h18l14 14v10H58z"/>'
                '<path d="M64 44h10l8 9H64z"/><circle cx="22" cy="70" r="8"/><circle cx="74" cy="70" r="8"/>'
                '<path d="M6 64h8m16 0h36m16 0h8"/>',
    "onibus": '<rect x="10" y="22" width="80" height="44" rx="6"/><path d="M10 40h80M24 22v18M40 22v18M56 22v18M72 22v18"/>'
              '<circle cx="28" cy="70" r="7"/><circle cx="72" cy="70" r="7"/>',
    "bomba": '<rect x="18" y="16" width="40" height="66" rx="3"/><rect x="25" y="24" width="26" height="16"/>'
             '<path d="M58 34h10l8 8v30a5 5 0 0 1-10 0V56h-8"/><path d="M12 82h52"/>',
    "navio": '<path d="M8 62h84l-10 16H18z"/><path d="M22 62V44h40v18"/><path d="M62 50h16v12"/><path d="M34 44V32h14v12"/>'
             '<path d="M6 88c8-5 14-5 22 0s14 5 22 0 14-5 22 0 14 5 22 0"/>',
    "gota": '<path d="M50 10C40 30 26 44 26 60a24 24 0 0 0 48 0c0-16-14-30-24-50z"/><path d="M40 62a10 10 0 0 0 10 10"/>'
            '<path d="M80 22c-10 2-14 10-12 18 8-2 14-8 12-18z"/>',
    "pneu": '<circle cx="50" cy="50" r="40"/><circle cx="50" cy="50" r="22"/><circle cx="50" cy="50" r="6"/>'
            '<path d="M50 10v8M50 82v8M10 50h8M82 50h8M22 22l6 6M72 72l6 6M78 22l-6 6M28 72l-6 6"/>',
    "globo": '<circle cx="50" cy="50" r="38"/><ellipse cx="50" cy="50" rx="16" ry="38"/><path d="M12 50h76M18 30h64M18 70h64"/>',
    "painel": '<path d="M12 70a38 38 0 0 1 76 0"/><path d="M50 70l20-24"/><circle cx="50" cy="70" r="5"/>'
              '<path d="M20 70h6M74 70h6M50 32v6M27 47l4 4M73 47l-4 4"/>',
    "trigo": '<path d="M50 90V20"/><path d="M50 30c-10-2-14-10-12-18 8 2 12 8 12 18zM50 30c10-2 14-10 12-18-8 2-12 8-12 18z"/>'
             '<path d="M50 50c-10-2-14-10-12-18 8 2 12 8 12 18zM50 50c10-2 14-10 12-18-8 2-12 8-12 18z"/>'
             '<path d="M50 70c-10-2-14-10-12-18 8 2 12 8 12 18zM50 70c10-2 14-10 12-18-8 2-12 8-12 18z"/>',
}


def tile(icon: str, figure: str, caption: str, caption2: str = "") -> str:
    """Story image: big figure in yellow, caption in white, icon at the right."""
    label = f"{figure} {caption} {caption2}".strip()
    cap2 = f'<text class="a-cap" x="36" y="262">{escape(caption2)}</text>' if caption2 else ""
    return (
        f'<svg class="art" viewBox="0 0 {W} {H}" role="img" aria-label="{escape(label)}" preserveAspectRatio="xMidYMid slice">'
        f'<rect class="a-bg" width="{W}" height="{H}"/>'
        f'<rect class="a-stripe" x="0" y="{H - 14}" width="{W}" height="14"/>'
        f'<g class="a-icon" fill="none" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" '
        f'transform="translate(392 74) scale(2.2)">{ICONS[icon]}</g>'
        f'<text class="a-fig" x="32" y="186">{escape(figure)}</text>'
        f'<text class="a-cap" x="36" y="234">{escape(caption)}</text>{cap2}</svg>'
    )
