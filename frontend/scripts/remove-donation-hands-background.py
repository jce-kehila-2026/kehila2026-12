"""Remove baked-in checkerboard from donation-hands.png and export transparent PNG."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/assets/images/donation-hands.png"
OUTPUT = ROOT / "src/assets/images/donation-hands.png"


def is_checkerboard_pixel(r: int, g: int, b: int) -> bool:
    """Neutral gray/white tiles from flattened transparency preview."""
    spread = max(r, g, b) - min(r, g, b)
    if spread > 10:
        return False
    return min(r, g, b) >= 228


def flood_remove_background(rgba: Image.Image) -> Image.Image:
    width, height = rgba.size
    pixels = rgba.load()
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def index(x: int, y: int) -> int:
        return y * width + x

    def try_seed(x: int, y: int) -> None:
        idx = index(x, y)
        if visited[idx]:
            return
        r, g, b, _a = pixels[x, y]
        if is_checkerboard_pixel(r, g, b):
            visited[idx] = 1
            queue.append((x, y))

    for x in range(width):
        try_seed(x, 0)
        try_seed(x, height - 1)
    for y in range(height):
        try_seed(0, y)
        try_seed(width - 1, y)

    while queue:
        x, y = queue.popleft()
        r, g, b, _a = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)

        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if nx < 0 or ny < 0 or nx >= width or ny >= height:
                continue
            idx = index(nx, ny)
            if visited[idx]:
                continue
            nr, ng, nb, _na = pixels[nx, ny]
            if is_checkerboard_pixel(nr, ng, nb):
                visited[idx] = 1
                queue.append((nx, ny))

    return rgba


def defringe(rgba: Image.Image) -> Image.Image:
    """Soften remaining white halos on subject edges."""
    px = rgba.load()
    width, height = rgba.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue

            spread = max(r, g, b) - min(r, g, b)
            brightness = (r + g + b) / 3

            if spread <= 14 and brightness >= 236:
                px[x, y] = (r, g, b, 0)
            elif spread <= 18 and brightness >= 230:
                px[x, y] = (r, g, b, int(a * 0.35))
            elif spread <= 22 and brightness >= 222:
                px[x, y] = (r, g, b, int(a * 0.65))

    return rgba.filter(ImageFilter.GaussianBlur(radius=0.6))


def main() -> None:
    image = Image.open(SOURCE).convert("RGBA")
    image = flood_remove_background(image)
    image = defringe(image)
    image.save(OUTPUT, format="PNG", optimize=True)

    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    opaque = sum(1 for value in alpha.get_flattened_data() if value > 16)
    total = image.width * image.height
    print(f"Saved transparent PNG to {OUTPUT}")
    print(f"Subject bbox: {bbox}")
    print(f"Opaque-ish pixels: {opaque}/{total} ({100 * opaque / total:.1f}%)")


if __name__ == "__main__":
    main()
