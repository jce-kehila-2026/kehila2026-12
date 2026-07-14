"""Trim white/transparent padding from partner logo assets in-place."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "src" / "assets" / "images"
LOGOS = ("assuta.png", "ichilov.png", "barzilai-logo.jpg", "shamir.png")
FUZZ = 24
PADDING = 2


def _bbox_non_background(image: Image.Image) -> tuple[int, int, int, int] | None:
    if image.mode in ("RGBA", "LA"):
        alpha = image.split()[-1]
        return alpha.point(lambda value: 255 if value > 8 else 0).getbbox()

    rgb = image.convert("RGB")
    background = Image.new("RGB", rgb.size, (255, 255, 255))
    diff = ImageChops.difference(rgb, background).convert("L")
    mask = diff.point(lambda value: 255 if value > FUZZ else 0)
    return mask.getbbox()


def trim_logo(filename: str) -> None:
    path = IMAGES / filename
    with Image.open(path) as source:
        original_size = source.size
        bbox = _bbox_non_background(source)
        if not bbox:
            print(f"{filename}: no trim bbox, skipped")
            return

        left = max(0, bbox[0] - PADDING)
        top = max(0, bbox[1] - PADDING)
        right = min(source.width, bbox[2] + PADDING)
        bottom = min(source.height, bbox[3] + PADDING)
        cropped = source.crop((left, top, right, bottom))

        save_kwargs: dict = {}
        if path.suffix.lower() in {".jpg", ".jpeg"}:
            cropped = cropped.convert("RGB")
            save_kwargs = {"quality": 92, "optimize": True}
        else:
            cropped = cropped.convert("RGBA")

        cropped.save(path, **save_kwargs)
        print(f"{filename}: {original_size[0]}x{original_size[1]} -> {cropped.size[0]}x{cropped.size[1]}")


def main() -> None:
    for name in LOGOS:
        trim_logo(name)


if __name__ == "__main__":
    main()
