from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = ROOT / "assets" / "products"


def font(size: int, bold: bool = True):
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf") if bold else Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/msyhbd.ttc") if bold else Path("C:/Windows/Fonts/msyh.ttc"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def label(draw: ImageDraw.ImageDraw, box, fill, text_fill, text="DSON", radius=8):
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(box, radius=radius, fill=fill)
    draw.rounded_rectangle(box, radius=radius, outline=tuple(max(0, c - 22) for c in fill), width=max(1, int((y2 - y1) * 0.05)))
    f = font(max(12, int((y2 - y1) * 0.55)))
    bbox = draw.textbbox((0, 0), text, font=f)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((x1 + (x2 - x1 - tw) / 2, y1 + (y2 - y1 - th) / 2 - 1), text, font=f, fill=text_fill)


def apply_labels(image_name, labels):
    image_path = PRODUCTS / image_name
    image = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(image)
    for spec in labels:
        label(draw, **spec)
    image.save(image_path, quality=92, optimize=True)


def main():
    apply_labels(
        "machine-01.jpg",
        [
            {
                "box": (96, 103, 176, 132),
                "fill": (31, 73, 155),
                "text_fill": (255, 255, 255),
                "radius": 4,
            }
        ],
    )
    apply_labels(
        "machine-02.jpg",
        [
            {
                "box": (46, 380, 292, 462),
                "fill": (23, 64, 156),
                "text_fill": (255, 255, 255),
                "radius": 10,
            }
        ],
    )
    apply_labels(
        "machine-03.jpg",
        [
            {
                "box": (1418, 512, 1548, 572),
                "fill": (239, 236, 226),
                "text_fill": (24, 160, 88),
                "radius": 8,
            }
        ],
    )
    apply_labels(
        "machine-04.jpg",
        [
            {
                "box": (82, 312, 236, 368),
                "fill": (224, 224, 218),
                "text_fill": (24, 160, 88),
                "radius": 8,
            }
        ],
    )
    apply_labels(
        "machine-05.jpg",
        [
            {
                "box": (176, 52, 222, 72),
                "fill": (21, 87, 165),
                "text_fill": (255, 255, 255),
                "radius": 4,
            }
        ],
    )
    apply_labels(
        "machine-06.jpg",
        [
            {
                "box": (286, 452, 482, 526),
                "fill": (227, 227, 220),
                "text_fill": (24, 160, 88),
                "radius": 8,
            }
        ],
    )


if __name__ == "__main__":
    main()
