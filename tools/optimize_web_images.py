from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCES = [
    "assets/brand/dson-logo.png",
    "assets/products/machine-01-dson-subtle.png",
    "assets/products/machine-02-dson-subtle.png",
    "assets/products/machine-03-dson-subtle.png",
    "assets/products/machine-04-dson-subtle.png",
    "assets/products/catalog/multilayer-chamber-dson.png",
    "assets/products/catalog/drug-stability-chamber-dson.png",
    "assets/products/catalog/photovoltaic-chamber-dson.png",
    "assets/products/catalog/three-zone-shock-dson.png",
    "assets/products/catalog/equal-temperature-shock-dson.png",
    "assets/products/catalog/vibration-combined-chamber-dson.png",
    "assets/products/catalog/ess-chamber-clean.png",
    "assets/products/catalog/salt-spray-chamber-dson.png",
    "assets/products/catalog/rain-test-chamber-dson.png",
    "assets/products/catalog/sand-dust-chamber-dson.png",
]


for relative in SOURCES:
    source = ROOT / relative
    target = source.with_suffix(".webp")
    with Image.open(source) as image:
        image.load()
        max_width = 600 if source.name == "dson-logo.png" else 1250
        if image.width > max_width:
            height = round(image.height * max_width / image.width)
            image = image.resize((max_width, height), Image.Resampling.LANCZOS)
        image.save(target, "WEBP", quality=84, method=6)
        print(f"{target.relative_to(ROOT)}: {target.stat().st_size // 1024} KB")
