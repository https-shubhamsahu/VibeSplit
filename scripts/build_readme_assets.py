#!/usr/bin/env python3
"""Build the README SVGs for VibeSplit.

usage: python3 scripts/build_readme_assets.py

Writes assets/readme/hero.svg (static) and assets/readme/settle.svg (animated).
The settle board replays the rule in src/trip/BalanceSheet.js on a worked example:
the payer gets +amount, every member in the split gets -amount / n.
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "readme"

SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"

# Palette: canteen bill paper, ink, chai-dark table, and the app's own
# gets-back teal (#00bfae) and owes red (#ff4444), tuned for contrast.
PAPER = "#f4ecdc"
INK = "#1c1a17"
INK_MUTED = "#6b6358"
TABLE = "#2a2320"
TRACK = "#3b322d"
CREAM_MUTED = "#bfb3a1"
TEAL_BAR = "#19b3a0"
TEAL_TEXT = "#45d0bd"
TEAL_INK = "#00796b"
RED_BAR = "#e5534b"
RED_TEXT = "#ff8a80"
MARKER = "#f2c94c"
MINUS = "−"
RUPEE = "₹"


def teeth(x_right, x_left, y, width=20, depth=12):
    """Zigzag bill edge from right to left along y."""
    pts, x, down = [], x_right, True
    while x - width / 2 >= x_left - 0.1:
        x -= width / 2
        pts.append(f"L{x:g} {y + depth if down else y}")
        down = not down
    return " ".join(pts)


def bill_path(x0, y0, x1, y_bottom, r=22):
    return (f"M{x0 + r} {y0} H{x1 - r} Q{x1} {y0} {x1} {y0 + r} V{y_bottom} "
            f"{teeth(x1, x0, y_bottom)} L{x0} {y_bottom} V{y0 + r} Q{x0} {y0} {x0 + r} {y0} Z")


def pixel_shades(cx, top, cell):
    """'Deal with it' pixel sunglasses from the VibeSplit coin logo."""
    rows = [
        "########################",
        "..#########..#########..",
        "..#########..#########..",
        "...#######....#######...",
        "....#####......#####....",
    ]
    shine = {(1, 4), (2, 5), (1, 15), (2, 16)}
    x0 = cx - len(rows[0]) * cell / 2
    # One path per colour, so scaled cells don't show hairline seams.
    sq = lambda r, c: f"M{x0 + c * cell:g} {top + r * cell:g}h{cell}v{cell}h-{cell}Z"
    dark = "".join(sq(r, c) for r, row in enumerate(rows) for c, ch in enumerate(row) if ch == "#")
    light = "".join(sq(r, c) for r, c in sorted(shine))
    return f'<path d="{dark}" fill="#111111"/>\n    <path d="{light}" fill="#f4ecdc"/>'


def hero():
    w, h = 1200, 432
    chips, x = [], 64
    for label in ["Trip", "Canteen Tracker", "Outing Split", "Project Pool"]:
        cw = len(label) * 12 + 34
        chips.append(
            f'<rect x="{x}" y="346" width="{cw}" height="42" rx="21" fill="none" stroke="{INK}" stroke-width="2"/>'
            f'<text x="{x + cw / 2:g}" y="374" text-anchor="middle" font-family="{MONO}" font-size="20" fill="{INK}">{label}</text>'
        )
        x += cw + 14
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title desc">
  <title id="title">VibeSplit</title>
  <desc id="desc">VibeSplit, a group expense splitter. Tagline: Vibe with your crew, not your spends. Four group types: Trip, Canteen Tracker, Outing Split and Project Pool. On the right, the app logo: a one rupee coin wearing pixel sunglasses.</desc>
  <path d="{bill_path(0, 0, w, 412)}" fill="{PAPER}"/>

  <g id="title-block">
    <text x="60" y="150" font-family="{SANS}" font-size="104" font-weight="800" letter-spacing="-3" fill="{INK}">VibeSplit</text>
    <text x="64" y="214" font-family="{SANS}" font-size="32" font-weight="600" fill="{INK}">Vibe with your crew, not your spends.</text>
    <text x="64" y="260" font-family="{SANS}" font-size="22" fill="{INK_MUTED}">Log who paid and who shared it. Every member</text>
    <text x="64" y="290" font-family="{SANS}" font-size="22" fill="{INK_MUTED}">sees what they get back or owe, in rupees.</text>
    <line x1="64" y1="324" x2="720" y2="324" stroke="{INK_MUTED}" stroke-width="2" stroke-dasharray="6 7"/>
    {"".join(chips)}
  </g>

  <g id="coin">
    <circle cx="960" cy="206" r="152" fill="#cfcbc1" stroke="#9b978e" stroke-width="10"/>
    <circle cx="960" cy="206" r="152" fill="none" stroke="#b5b1a8" stroke-width="4" stroke-dasharray="3 5"/>
    <circle cx="960" cy="206" r="126" fill="none" stroke="#aeaaa1" stroke-width="3"/>
    {pixel_shades(960, 134, 11)}
    <text x="960" y="298" text-anchor="middle" font-family="{SANS}" font-size="84" font-weight="800" fill="#6f6b63">1</text>
    <text x="960" y="332" text-anchor="middle" font-family="{SANS}" font-size="22" font-weight="700" letter-spacing="6" fill="#6f6b63">RUPEE</text>
  </g>
</svg>
'''


# ---- settle board ------------------------------------------------------

MEMBERS = ["Asha", "Bilal", "Chirag", "Dev"]
EXPENSES = [  # (item, amount, payer, shared_by, split label)
    ("Vada pav ×4", 120, "Asha", MEMBERS, "Asha paid · split 4 ways"),
    ("Chai ×3", 60, "Bilal", ["Asha", "Bilal", "Chirag"], "Bilal paid · Dev not in it"),
    ("Cold coffee ×4", 200, "Chirag", MEMBERS, "Chirag paid · split 4 ways"),
]
LOOP = 12  # seconds; every animation shares this loop
STEP_PCT = [(6, 28), (28, 50), (50, 72)]  # highlight windows per expense
BAR_PCT = [(10, 16), (32, 38), (54, 60)]  # bars travel
TEXT_PCT = [12, 34, 56]                    # running totals switch
FINAL, RESET, END = 72, 94, 99


def states():
    """Running balances exactly as BalanceSheet.calculateBalances builds them."""
    bal = {m: 0.0 for m in MEMBERS}
    out = [dict(bal)]
    for _, amount, payer, shared, _ in EXPENSES:
        bal[payer] += amount
        for m in shared:
            bal[m] -= amount / len(shared)
        out.append(dict(bal))
    assert abs(sum(out[-1].values())) < 1e-9
    return out


def money(v, sign=True):
    v = round(v)
    if v == 0:
        return f"{RUPEE}0"
    s = ("+" if v > 0 else MINUS) if sign else ""
    return f"{s}{RUPEE}{abs(v)}"


def verdict(v):
    # Same wording as the app: 'Gets back ' / 'Owes ' + amount.toFixed(2)
    return f"Gets back {RUPEE}{v:.2f}" if v > 0 else f"Owes {RUPEE}{abs(v):.2f}"


def frames(name, stops, prop):
    body = " ".join(f"{p:g}%{{{prop(v)}}}" for p, v in stops)
    return f"@keyframes {name}{{{body}}}"


def window(a, b, fade=0.6):
    """Opacity 1 inside [a, b], 0 outside."""
    stops = [(0, 0)]
    if a > 0:
        stops += [(a, 0)]
    stops += [(a + fade, 1), (b - fade, 1), (b, 0), (100, 0)]
    if a == 0:
        stops = [(0, 1), (b - fade, 1), (b, 0), (100, 0)]
    return stops


def settle():
    w, h = 1200, 700
    st = states()
    css, body = [], []
    ease = "animation-timing-function:cubic-bezier(.2,.7,.2,1)"

    # receipt
    rx0, rx1, ry0 = 48, 488, 136
    body.append(f'<path d="{bill_path(rx0, ry0, rx1, 648, r=16)}" fill="{PAPER}"/>')
    body.append(f'<text x="76" y="182" font-family="{MONO}" font-size="24" font-weight="700" fill="{INK}">Canteen run</text>')
    body.append(f'<text x="76" y="212" font-family="{MONO}" font-size="18" fill="{INK_MUTED}">4 people · 3 expenses</text>')
    body.append(f'<line x1="76" y1="232" x2="460" y2="232" stroke="{INK_MUTED}" stroke-width="2" stroke-dasharray="5 6"/>')
    for i, (item, amount, _, _, split) in enumerate(EXPENSES):
        y = 242 + i * 96
        a, b = STEP_PCT[i]
        css.append(frames(f"hl{i}", window(a, b), lambda v: f"opacity:{v}"))
        css.append(f".hl{i}{{opacity:0;animation:hl{i} {LOOP}s linear infinite}}")
        body.append(f'<rect class="hl{i}" x="62" y="{y + 4}" width="412" height="86" rx="8" fill="{MARKER}" fill-opacity=".6"/>')
        body.append(f'<text x="76" y="{y + 38}" font-family="{MONO}" font-size="24" font-weight="700" fill="{INK}">{item}</text>')
        body.append(f'<text x="460" y="{y + 38}" text-anchor="end" font-family="{MONO}" font-size="24" font-weight="700" fill="{INK}">{RUPEE}{amount}</text>')
        body.append(f'<text x="76" y="{y + 70}" font-family="{MONO}" font-size="18" fill="{INK_MUTED}">{split}</text>')
    body.append(f'<line x1="76" y1="544" x2="460" y2="544" stroke="{INK_MUTED}" stroke-width="2" stroke-dasharray="5 6"/>')
    total = sum(e[1] for e in EXPENSES)
    body.append(f'<text x="76" y="584" font-family="{MONO}" font-size="24" font-weight="700" fill="{INK}">Total</text>')
    body.append(f'<text x="460" y="584" text-anchor="end" font-family="{MONO}" font-size="24" font-weight="700" fill="{INK}">{RUPEE}{total}</text>')

    # ledger lanes
    zero, k = 850, 2.8  # px per rupee; 100 rupees = 280 px
    full = 100 * k
    body.append(f'<text x="570" y="634" font-family="{SANS}" font-size="18" fill="{CREAM_MUTED}">owes</text>')
    body.append(f'<text x="{zero}" y="634" text-anchor="middle" font-family="{MONO}" font-size="18" fill="{CREAM_MUTED}">0</text>')
    body.append(f'<text x="1130" y="634" text-anchor="end" font-family="{SANS}" font-size="18" fill="{CREAM_MUTED}">gets back</text>')

    def bar_stops(fn):
        s = [(0, fn(st[0])), (BAR_PCT[0][0], fn(st[0]))]
        for j, (a, b) in enumerate(BAR_PCT):
            s.append((b, fn(st[j + 1])))
            nxt = BAR_PCT[j + 1][0] if j + 1 < len(BAR_PCT) else RESET
            s.append((nxt, fn(st[j + 1])))
        s += [(END, fn(st[0])), (100, fn(st[0]))]
        return s

    for i, m in enumerate(MEMBERS):
        y0 = 150 + i * 120
        body.append(f'<text x="548" y="{y0 + 28}" font-family="{SANS}" font-size="24" font-weight="700" fill="{PAPER}">{m}</text>')
        body.append(f'<rect x="{zero - full - 10:g}" y="{y0 + 46}" width="{2 * full + 20:g}" height="36" rx="8" fill="{TRACK}"/>')
        body.append(f'<line x1="{zero}" y1="{y0 + 40}" x2="{zero}" y2="{y0 + 88}" stroke="{CREAM_MUTED}" stroke-width="2"/>')
        for sign, color, origin in (("p", TEAL_BAR, "0% 50%"), ("n", RED_BAR, "100% 50%")):
            val = (lambda s, m=m: max(s[m], 0) / 100) if sign == "p" else (lambda s, m=m: max(-s[m], 0) / 100)
            name = f"b{sign}{i}"
            css.append(frames(name, bar_stops(val), lambda v: f"transform:scaleX({v:.3f})"))
            css.append(f".{name}{{transform-box:fill-box;transform-origin:{origin};"
                       f"transform:scaleX({val(st[-1]):.3f});animation:{name} {LOOP}s infinite;{ease}}}")
            x = zero if sign == "p" else zero - full
            body.append(f'<rect class="{name}" x="{x:g}" y="{y0 + 50}" width="{full:g}" height="28" rx="5" fill="{color}"/>')

        # running totals, then the app's own verdict wording
        switch = [0] + TEXT_PCT + [FINAL]
        for j in range(4):
            v = st[j][m]
            fill = TEAL_TEXT if round(v) > 0 else RED_TEXT if round(v) < 0 else CREAM_MUTED
            if j == 0:
                stops = [(0, 1), (TEXT_PCT[0] - 0.6, 1), (TEXT_PCT[0], 0), (97, 0), (98.5, 1), (100, 1)]
            else:
                stops = window(switch[j], switch[j + 1])
            name = f"t{j}{i}"
            css.append(frames(name, stops, lambda v: f"opacity:{v}"))
            css.append(f".{name}{{opacity:0;animation:{name} {LOOP}s linear infinite}}")
            body.append(f'<text class="{name}" x="1152" y="{y0 + 28}" text-anchor="end" font-family="{MONO}" font-size="24" font-weight="700" fill="{fill}">{money(v)}</text>')
        v = st[-1][m]
        name = f"v{i}"
        css.append(frames(name, [(0, 0), (FINAL, 0), (FINAL + 1.5, 1), (RESET, 1), (RESET + 2, 0), (100, 0)], lambda v: f"opacity:{v}"))
        css.append(f".{name}{{opacity:1;animation:{name} {LOOP}s linear infinite}}")
        body.append(f'<text class="{name}" x="1152" y="{y0 + 28}" text-anchor="end" font-family="{MONO}" font-size="24" font-weight="700" fill="{TEAL_TEXT if v > 0 else RED_TEXT}">{verdict(v)}</text>')

        # per-expense change chips: payer +amount, each sharer -amount/n
        for j, (_, amount, payer, shared, _) in enumerate(EXPENSES):
            parts = []
            if m == payer:
                parts.append((f"+{amount}", TEAL_TEXT))
            if m in shared:
                parts.append((f"{MINUS}{amount // len(shared)}", RED_TEXT))
            if not parts:
                parts.append(("not in split", CREAM_MUTED))
            label_len = sum(len(p) for p, _ in parts) + (len(parts) - 1)
            cw = label_len * 12 + 28
            a, b = STEP_PCT[j]
            name = f"c{j}{i}"
            stops = [(0, (0, 10))] + [(a + 1, (0, 10)), (a + 3, (1, 0)), (b - 1, (1, 0)), (b, (0, 0)), (100, (0, 10))]
            css.append(frames(name, stops, lambda v: f"opacity:{v[0]};transform:translateY({v[1]}px)"))
            css.append(f".{name}{{opacity:0;animation:{name} {LOOP}s infinite;{ease}}}")
            tspans = []
            for n, (p, col) in enumerate(parts):
                gap = ' dx="12"' if n else ""
                tspans.append(f'<tspan fill="{col}"{gap}>{p}</tspan>')
            body.append(
                f'<g class="{name}"><rect x="680" y="{y0 + 4}" width="{cw}" height="34" rx="17" fill="{TRACK}"/>'
                f'<text x="694" y="{y0 + 28}" font-family="{MONO}" font-size="20" font-weight="700">{"".join(tspans)}</text></g>'
            )

    # zero-sum check, shown once the sheet is settled
    terms = " ".join(f"{('+' if st[-1][m] > 0 else MINUS)} {abs(round(st[-1][m]))}" for m in MEMBERS).lstrip("+ ")
    css.append(frames("sum", [(0, 0), (FINAL, 0), (FINAL + 1.5, 1), (RESET, 1), (RESET + 2, 0), (100, 0)], lambda v: f"opacity:{v}"))
    css.append(f".sum{{opacity:1;animation:sum {LOOP}s linear infinite}}")
    body.append(f'<text class="sum" x="1152" y="676" text-anchor="end" font-family="{MONO}" font-size="22" font-weight="700" fill="{PAPER}">{terms} = {RUPEE}0</text>')

    css.append("@media (prefers-reduced-motion: reduce){*{animation:none !important}}")
    style = "\n    ".join(css)
    content = "\n  ".join(body)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title desc">
  <title id="title">How the VibeSplit balance sheet adds up</title>
  <desc id="desc">Worked example of the rule in BalanceSheet.js. A canteen run with four people: Vada pav 120 rupees paid by Asha and split four ways, chai 60 rupees paid by Bilal and split between Asha, Bilal and Chirag, cold coffee 200 rupees paid by Chirag and split four ways. For each expense the payer gets plus the amount and everyone in the split gets minus the amount divided by the number of people in the split. Final balances: Asha gets back 20, Bilal owes 40, Chirag gets back 100, Dev owes 80. The balances sum to zero.</desc>
  <style>
    {style}
  </style>
  <rect width="{w}" height="{h}" rx="24" fill="{TABLE}"/>
  <text x="48" y="66" font-family="{SANS}" font-size="34" font-weight="800" fill="{PAPER}">How the balance sheet adds up</text>
  <text x="48" y="102" font-family="{SANS}" font-size="20" fill="{CREAM_MUTED}">For each expense: the payer gets +amount, everyone in the split gets {MINUS}amount ÷ n.</text>
  {content}
</svg>
'''


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, svg in (("hero.svg", hero()), ("settle.svg", settle())):
        assert "\u2014" not in svg
        (OUT / name).write_text(svg, encoding="utf-8")
        print(f"wrote {OUT / name} ({len(svg.encode()) // 1024} KB)")


if __name__ == "__main__":
    main()
