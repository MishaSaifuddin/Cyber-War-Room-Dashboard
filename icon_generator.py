"""Generate the Cyber War Room icon (.ico + .png)."""
import math
import os
from PIL import Image, ImageDraw

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
os.makedirs(OUT_DIR, exist_ok=True)

SIZE = 256
BG = (6, 12, 8)
RED = (255, 46, 46)
GREEN = (57, 255, 20)
LIME = (170, 255, 0)
CYAN = (0, 255, 170)
DARK_GREEN = (23, 46, 30)


def rounded_polygon(draw, points, radius, fill, outline=None, width=0):
    draw.polygon(points, fill=fill, outline=outline, width=width)


def draw_icon(size=SIZE):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    inset = int(size * 0.03)

    # Rounded square background with subtle gradient-ish rings
    d.rounded_rectangle(
        [inset, inset, size - inset, size - inset],
        radius=int(size * 0.18),
        fill=BG,
        outline=(40, 80, 50),
        width=3,
    )

    # Shield path
    cx = size / 2
    cy = size / 2
    w = size * 0.42
    h = size * 0.52
    top = cy - h
    bottom = cy + h
    mid_xl = cx - w
    mid_xr = cx + w
    tip = cy + h * 0.95

    shield = [
        (cx - w * 0.55, top),
        (cx + w * 0.55, top),
        (cx + w * 0.62, cy - h * 0.25),
        (mid_xr, cy + h * 0.15),
        (cx + w * 0.2, bottom * 0.85 + h * 0.1),
        (cx, tip),
        (cx - w * 0.2, bottom * 0.85 + h * 0.1),
        (mid_xl, cy + h * 0.15),
        (cx - w * 0.62, cy - h * 0.25),
    ]
    d.polygon(shield, fill=DARK_GREEN, outline=GREEN, width=4)

    # Radar sweep (pie slices) inside shield area
    shield_bbox = [cx - w * 0.5, top + h * 0.18, cx + w * 0.5, bottom * 0.75]
    for angle in (300, 60, 165, 230, 30, 130):
        d.pieslice(shield_bbox, start=angle - 12, end=angle + 12, fill=GREEN)

    # Radar blips
    blip_positions = (
        (cx - w * 0.22, cy - h * 0.1),
        (cx + w * 0.1, cy - h * 0.22),
        (cx - w * 0.05, cy + h * 0.05),
        (cx + w * 0.24, cy + h * 0.22),
    )
    for bx, by in blip_positions:
        r = size * 0.035
        d.ellipse([bx - r, by - r, bx + r, by + r], fill=RED)
        r2 = r * 2.1
        d.ellipse([bx - r2, by - r2, bx + r2, by + r2], outline=RED, width=2)

    # Crosshair lines
    d.line([cx - w * 0.42, cy - h * 0.15, cx - w * 0.42, cy + h * 0.12], fill=GREEN, width=3)
    d.line([cx + w * 0.42, cy - h * 0.15, cx + w * 0.42, cy + h * 0.12], fill=GREEN, width=3)
    d.line([cx - w * 0.32, cy + h * 0.28, cx + w * 0.32, cy + h * 0.28], fill=GREEN, width=3)

    # Corner brackets (HUD style)
    c = size * 0.08
    m = size * 0.03
    for (x1, y1, x2, y2) in (
        (m, m, m + c, m),
        (m, m, m, m + c),
        (size - m - c, m, size - m, m),
        (size - m, m, size - m, m + c),
        (m, size - m - c, m, size - m),
        (m, size - m, m + c, size - m),
        (size - m - c, size - m, size - m, size - m),
        (size - m, size - m - c, size - m, size - m),
    ):
        d.line([x1, y1, x2, y2], fill=GREEN, width=4)

    # Outer glow ring
    ring = size - inset * 4
    d.arc([inset * 2, inset * 2, ring, ring], 175, 365, fill=CYAN, width=2)

    # "CWR" style center mark
    d.text((cx, tip + size * 0.06), "", fill=GREEN)

    return img


if __name__ == "__main__":
    img = draw_icon()
    icon_path = os.path.join(OUT_DIR, "war_room.ico")
    img.save(icon_path, sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
    png_path = os.path.join(OUT_DIR, "war_room.png")
    img.save(png_path)
    print(f"Icon created: {icon_path}")
    print(f"PNG created:   {png_path}")