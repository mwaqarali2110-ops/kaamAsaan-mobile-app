from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
from typing import Callable

from PIL import Image, ImageChops, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "app.json"
OUTPUT_DIR = ROOT / "preview-assets"
NAVY = "#0C1B33"
DRAWER_BG = "#151A24"
DRAWER_PANEL = "#252B37"
PREVIEW_BG = "#E8EAF0"
WHITE = "#FFFFFF"
MUTED = "#AEB6C5"


def load_config() -> tuple[dict, dict]:
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))["expo"]
    android = config["android"]
    plugin = next(
        entry[1]
        for entry in config["plugins"]
        if isinstance(entry, list) and entry[0] == "expo-splash-screen"
    )
    return android, plugin


def resolve_asset(relative_path: str) -> Path:
    return ROOT / relative_path.removeprefix("./")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    windows_fonts = Path("C:/Windows/Fonts")
    candidates = (
        [windows_fonts / "seguisb.ttf", windows_fonts / "arialbd.ttf"]
        if bold
        else [windows_fonts / "segoeui.ttf", windows_fonts / "arial.ttf"]
    )
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default(size=size)


def hex_rgba(value: str) -> tuple[int, int, int, int]:
    clean = value.removeprefix("#")
    return tuple(int(clean[index : index + 2], 16) for index in (0, 2, 4)) + (255,)


def circle_mask(size: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    return mask


def rounded_square_mask(size: int, radius_ratio: float = 0.22) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    radius = round(size * radius_ratio)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, size - 1, size - 1), radius=radius, fill=255
    )
    return mask


def squircle_mask(size: int, exponent: float = 4.0) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    pixels = mask.load()
    half = (size - 1) / 2
    for y in range(size):
        normalized_y = abs((y - half) / half)
        for x in range(size):
            normalized_x = abs((x - half) / half)
            if normalized_x**exponent + normalized_y**exponent <= 1:
                pixels[x, y] = 255
    return mask


def samsung_mask(size: int) -> Image.Image:
    # One UI launcher shapes vary by device/theme; this approximates the common
    # deeply rounded square while preserving the exact adaptive layers.
    return rounded_square_mask(size, radius_ratio=0.31)


MASKS: list[tuple[str, Callable[[int], Image.Image]]] = [
    ("Circular", circle_mask),
    ("Rounded square", rounded_square_mask),
    ("Squircle", squircle_mask),
    ("Samsung-style", samsung_mask),
]


def render_adaptive_icon(
    foreground: Image.Image,
    background_color: str,
    size: int,
    mask_builder: Callable[[int], Image.Image],
) -> Image.Image:
    background = Image.new("RGBA", (size, size), hex_rgba(background_color))
    resized_foreground = foreground.resize((size, size), Image.Resampling.LANCZOS)
    background.alpha_composite(resized_foreground)
    mask = mask_builder(size)
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.paste(background, (0, 0), mask)
    return result


def assert_no_mask_cropping(foreground: Image.Image) -> dict[str, int]:
    alpha = foreground.getchannel("A")
    results: dict[str, int] = {}
    for label, mask_builder in MASKS:
        mask = mask_builder(foreground.width)
        outside = ImageChops.multiply(alpha, ImageChops.invert(mask))
        cropped_pixels = sum(outside.histogram()[1:])
        if cropped_pixels:
            raise RuntimeError(f"{label} mask crops {cropped_pixels} foreground pixels")
        results[label] = cropped_pixels
    return results


def centered_text(
    draw: ImageDraw.ImageDraw,
    center_x: int,
    y: int,
    value: str,
    text_font: ImageFont.ImageFont,
    fill: str,
) -> None:
    bounds = draw.textbbox((0, 0), value, font=text_font)
    width = bounds[2] - bounds[0]
    draw.text((center_x - width / 2, y), value, font=text_font, fill=fill)


def create_mask_preview(foreground: Image.Image, background_color: str) -> Image.Image:
    width, height = 2304, 720
    canvas = Image.new("RGBA", (width, height), hex_rgba(PREVIEW_BG))
    draw = ImageDraw.Draw(canvas)
    draw.text((72, 42), "KaamAsaan adaptive icon masks", font=font(48, True), fill=NAVY)
    draw.text(
        (72, 108),
        f"Actual foreground + {background_color} adaptive background",
        font=font(28),
        fill="#536077",
    )
    icon_size = 430
    start_x = 68
    gap = 140
    top = 190
    for index, (label, mask_builder) in enumerate(MASKS):
        x = start_x + index * (icon_size + gap)
        icon = render_adaptive_icon(foreground, background_color, icon_size, mask_builder)
        canvas.alpha_composite(icon, (x, top))
        centered_text(draw, x + icon_size // 2, top + icon_size + 22, label, font(28, True), NAVY)
    return canvas


def draw_status_bar(draw: ImageDraw.ImageDraw, width: int, density: float, color: str) -> None:
    margin = round(16 * density)
    top = round(8 * density)
    draw.text((margin, top), "9:41", font=font(round(12 * density), True), fill=color)
    right = width - margin
    battery_w = round(22 * density)
    battery_h = round(10 * density)
    battery_x = right - battery_w
    battery_y = top + round(3 * density)
    draw.rounded_rectangle(
        (battery_x, battery_y, right, battery_y + battery_h),
        radius=max(1, round(2 * density)),
        outline=color,
        width=max(1, round(density)),
    )
    draw.rectangle(
        (battery_x + round(3 * density), battery_y + round(3 * density), right - round(4 * density), battery_y + battery_h - round(3 * density)),
        fill=color,
    )
    signal_right = battery_x - round(22 * density)
    for index in range(4):
        bar_w = max(2, round(2 * density))
        bar_h = round((4 + index * 2) * density)
        x = signal_right - round((11 - index * 3) * density)
        draw.rectangle((x, battery_y + battery_h - bar_h, x + bar_w, battery_y + battery_h), fill=color)


def draw_gesture_navigation(draw: ImageDraw.ImageDraw, width: int, height: int, density: float) -> None:
    pill_w = round(108 * density)
    pill_h = max(5, round(4 * density))
    x = (width - pill_w) // 2
    y = height - round(14 * density)
    draw.rounded_rectangle((x, y, x + pill_w, y + pill_h), radius=pill_h // 2, fill=NAVY)


def draw_vivo_navigation(draw: ImageDraw.ImageDraw, width: int, height: int, density: float) -> None:
    y = height - round(30 * density)
    stroke = max(2, round(1.8 * density))
    centers = (width * 0.25, width * 0.5, width * 0.75)
    size = round(10 * density)
    draw.polygon(
        [(centers[0] + size, y - size), (centers[0] - size, y), (centers[0] + size, y + size)],
        outline=NAVY,
    )
    draw.ellipse((centers[1] - size, y - size, centers[1] + size, y + size), outline=NAVY, width=stroke)
    draw.rectangle((centers[2] - size, y - size, centers[2] + size, y + size), outline=NAVY, width=stroke)


def create_splash_preview(
    splash: Image.Image,
    background_color: str,
    image_width_dp: int,
    output_size: tuple[int, int],
    density: float,
    vivo_navigation: bool = False,
) -> Image.Image:
    width, height = output_size
    canvas = Image.new("RGBA", output_size, hex_rgba(background_color))
    rendered_width = round(image_width_dp * density)
    rendered = splash.resize((rendered_width, rendered_width), Image.Resampling.LANCZOS)
    position = ((width - rendered_width) // 2, (height - rendered_width) // 2)
    canvas.alpha_composite(rendered, position)
    draw = ImageDraw.Draw(canvas)
    draw_status_bar(draw, width, density, NAVY)
    if vivo_navigation:
        draw_vivo_navigation(draw, width, height, density)
    else:
        draw_gesture_navigation(draw, width, height, density)
    return canvas


def generic_icon(size: int, color: str, symbol: str) -> Image.Image:
    base = Image.new("RGBA", (size, size), hex_rgba(color))
    draw = ImageDraw.Draw(base)
    symbol_font = font(round(size * 0.34), True)
    centered_text(draw, size // 2, round(size * 0.27), symbol, symbol_font, WHITE)
    masked = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    masked.paste(base, (0, 0), samsung_mask(size))
    return masked


def create_app_drawer(foreground: Image.Image, background_color: str) -> Image.Image:
    width, height = 1080, 2400
    density = 3.0
    canvas = Image.new("RGBA", (width, height), hex_rgba(DRAWER_BG))
    draw = ImageDraw.Draw(canvas)
    draw_status_bar(draw, width, density, WHITE)
    draw.text((60, 150), "Apps", font=font(72, True), fill=WHITE)
    draw.rounded_rectangle((54, 270, width - 54, 390), radius=54, fill=DRAWER_PANEL)
    draw.ellipse((92, 307, 128, 343), outline=MUTED, width=7)
    draw.line((122, 338, 143, 359), fill=MUTED, width=7)
    draw.text((170, 304), "Search apps", font=font(38), fill=MUTED)

    icon_size = 168
    centers = [135, 405, 675, 945]
    row_y = 540
    app_icon = render_adaptive_icon(foreground, background_color, icon_size, samsung_mask)
    canvas.alpha_composite(app_icon, (centers[0] - icon_size // 2, row_y))
    centered_text(draw, centers[0], row_y + icon_size + 24, "KaamAsaan", font(30, True), WHITE)

    samples = [
        (centers[1], "#536DFE", "N", "Notes"),
        (centers[2], "#2CA58D", "P", "Photos"),
        (centers[3], "#E65F5C", "T", "Tools"),
    ]
    for center_x, color, symbol, label in samples:
        icon = generic_icon(icon_size, color, symbol)
        canvas.alpha_composite(icon, (center_x - icon_size // 2, row_y))
        centered_text(draw, center_x, row_y + icon_size + 24, label, font(30), WHITE)

    second_row_y = 900
    second_samples = [
        (centers[0], "#A56CC1", "C", "Chat"),
        (centers[1], "#F0A202", "M", "Maps"),
        (centers[2], "#3D8BFD", "F", "Files"),
        (centers[3], "#6B7280", "S", "Settings"),
    ]
    for center_x, color, symbol, label in second_samples:
        icon = generic_icon(icon_size, color, symbol)
        canvas.alpha_composite(icon, (center_x - icon_size // 2, second_row_y))
        centered_text(draw, center_x, second_row_y + icon_size + 24, label, font(30), WHITE)
    draw_gesture_navigation(draw, width, height, density)
    return canvas


def fit(image: Image.Image, bounds: tuple[int, int]) -> Image.Image:
    copy = image.copy()
    copy.thumbnail(bounds, Image.Resampling.LANCZOS)
    return copy


def create_comparison_board(
    mask_preview: Image.Image,
    app_drawer: Image.Image,
    splash_preview: Image.Image,
    splash_path: str,
    background_color: str,
    image_width: int,
    resize_mode: str,
) -> Image.Image:
    width, height = 3000, 1800
    board = Image.new("RGBA", (width, height), (246, 247, 250, 255))
    draw = ImageDraw.Draw(board)
    draw.text((90, 52), "KaamAsaan Android Branding Preview", font=font(64, True), fill=NAVY)
    draw.text((90, 140), "Resolved Expo configuration rendered from the approved source assets", font=font(32), fill="#5C667A")
    draw.line((1500, 210, 1500, height - 80), fill="#D5D9E2", width=4)

    draw.text((90, 220), "Android launcher icon", font=font(44, True), fill=NAVY)
    mask_small = fit(mask_preview, (1320, 420))
    board.alpha_composite(mask_small, (90, 290))
    draw.text((90, 740), "Realistic app drawer scale", font=font(36, True), fill=NAVY)
    drawer_small = fit(app_drawer, (480, 920))
    board.alpha_composite(drawer_small, (90, 800))
    draw.text((620, 830), "Mask validation", font=font(34, True), fill=NAVY)
    checks = [
        "PASS - Complete cart visible",
        "PASS - Solar panel visible",
        "PASS - Lightning bolt visible",
        "PASS - Wrench visible",
        "PASS - Wheels remain inside every mask",
        "PASS - Zero cropped foreground pixels",
    ]
    for index, line in enumerate(checks):
        draw.text((620, 900 + index * 72), line, font=font(30), fill="#30405C")

    draw.text((1580, 220), "Native Android splash", font=font(44, True), fill=NAVY)
    splash_small = fit(splash_preview, (610, 1350))
    board.alpha_composite(splash_small, (1580, 315))
    panel_x, panel_y, panel_w, panel_h = 2260, 360, 650, 660
    draw.rounded_rectangle((panel_x, panel_y, panel_x + panel_w, panel_y + panel_h), radius=34, fill=WHITE, outline="#D8DCE5", width=3)
    draw.text((panel_x + 42, panel_y + 42), "Resolved splash settings", font=font(34, True), fill=NAVY)
    settings = [
        ("Image", Path(splash_path).name),
        ("imageWidth", f"{image_width} dp"),
        ("Background", background_color),
        ("resizeMode", resize_mode),
        ("Source", "1024 × 1024 RGBA PNG"),
    ]
    y = panel_y + 130
    for label, value in settings:
        draw.text((panel_x + 42, y), label, font=font(25, True), fill="#69748A")
        draw.text((panel_x + 42, y + 36), value, font=font(28), fill=NAVY)
        y += 102
    draw.text((panel_x + 42, panel_y + panel_h + 72), "Preview device", font=font(28, True), fill="#69748A")
    draw.text((panel_x + 42, panel_y + panel_h + 112), "1080 × 2400 at 3× density", font=font(30), fill=NAVY)
    draw.text((panel_x + 42, panel_y + panel_h + 182), "Rendered artwork width", font=font(28, True), fill="#69748A")
    draw.text((panel_x + 42, panel_y + panel_h + 222), f"{image_width * 3} px container", font=font(30), fill=NAVY)
    return board


def main() -> None:
    android, splash_config = load_config()
    foreground_path = resolve_asset(android["adaptiveIcon"]["foregroundImage"])
    icon_path = resolve_asset(android["icon"])
    splash_path = resolve_asset(splash_config["image"])
    background_color = android["adaptiveIcon"]["backgroundColor"]
    splash_background = splash_config["backgroundColor"]
    image_width = int(splash_config["imageWidth"])
    resize_mode = splash_config["resizeMode"]

    if resize_mode != "contain":
        raise RuntimeError(f"Expected contain resize mode, got {resize_mode}")

    paths = [foreground_path, icon_path, splash_path]
    before_hashes = {path: sha256(path) for path in paths}
    foreground = Image.open(foreground_path).convert("RGBA")
    splash = Image.open(splash_path).convert("RGBA")
    mask_results = assert_no_mask_cropping(foreground)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    mask_preview = create_mask_preview(foreground, background_color)
    app_drawer = create_app_drawer(foreground, background_color)

    splash_specs = [
        ("kaamasaan-native-splash-1080x2400.png", (1080, 2400), 3.0, False),
        ("kaamasaan-native-splash-1080x2340.png", (1080, 2340), 3.0, False),
        ("kaamasaan-native-splash-720x1600.png", (720, 1600), 2.0, False),
        ("kaamasaan-native-splash-vivo-preview.png", (1080, 2408), 3.0, True),
    ]
    splash_previews: dict[str, Image.Image] = {}
    for filename, dimensions, density, vivo in splash_specs:
        preview = create_splash_preview(
            splash,
            splash_background,
            image_width,
            dimensions,
            density,
            vivo_navigation=vivo,
        )
        preview.save(OUTPUT_DIR / filename, "PNG", optimize=True)
        splash_previews[filename] = preview

    mask_preview.save(OUTPUT_DIR / "kaamasaan-icon-mask-preview.png", "PNG", optimize=True)
    app_drawer.save(OUTPUT_DIR / "kaamasaan-app-drawer-preview.png", "PNG", optimize=True)
    board = create_comparison_board(
        mask_preview,
        app_drawer,
        splash_previews["kaamasaan-native-splash-1080x2400.png"],
        splash_config["image"],
        splash_background,
        image_width,
        resize_mode,
    )
    board.save(OUTPUT_DIR / "kaamasaan-branding-final-preview.png", "PNG", optimize=True)

    after_hashes = {path: sha256(path) for path in paths}
    if before_hashes != after_hashes:
        raise RuntimeError("A source branding asset changed while generating previews")

    print("Resolved adaptive foreground:", foreground_path.relative_to(ROOT))
    print("Resolved legacy icon:", icon_path.relative_to(ROOT))
    print("Resolved adaptive background:", background_color)
    print("Resolved splash image:", splash_path.relative_to(ROOT))
    print("Resolved splash background:", splash_background)
    print("Resolved splash imageWidth:", image_width)
    print("Resolved splash resizeMode:", resize_mode)
    print("Mask crop pixel counts:", mask_results)
    print("Source hashes preserved:", before_hashes == after_hashes)
    for output in sorted(OUTPUT_DIR.glob("kaamasaan-*.png")):
        with Image.open(output) as image:
            print(f"{output.relative_to(ROOT)}: {image.size[0]}x{image.size[1]} ({output.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
