"""Build the Lighting Engine case-story walkthrough from Playwright captures.

Every frame uses an illustrative planning scenario and describes product
behavior rather than customer results or stamped engineering.
"""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "case-stories" / "lighting-engine"
OUTPUT = ASSET_DIR / "lighting-engine-walkthrough.mp4"
POSTER = ASSET_DIR / "lighting-engine-film-poster.jpg"
FFMPEG = Path(
    r"C:\Users\akran\AppData\Local\Microsoft\WinGet\Packages"
    r"\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
    r"\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe"
)

WIDTH, HEIGHT, FPS = 1920, 1080, 30
SLIDE_SECONDS = 4.4
NAVY, CYAN, LIME = "#06101f", "#12bfd0", "#b7ed3f"
WHITE, MUTED, LINE = "#f8fbff", "#a9b6c8", "#26364b"
FONT_REGULAR = Path(r"C:\Windows\Fonts\segoeui.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\seguisb.ttf")
FONT_MONO = Path(r"C:\Windows\Fonts\consolab.ttf")

SLIDES = [
    ("lighting-engine-site-demo.png", "01 / SITE CONTEXT", "Start with the place and the operating need.", "One project record carries geometry, season, application, and assumptions into every later test."),
    ("lighting-engine-photometry-demo.png", "02 / MEASURED LIGHT", "Prove usable coverage—not just wattage.", "The selected laboratory file drives point-by-point light levels, pole quantity, and actual spacing."),
    ("lighting-engine-energy-demo.png", "03 / WORST-MONTH ENERGY", "Design for the month most likely to fail.", "Solar production, battery reserve, operating schedule, and added equipment are checked together."),
    ("lighting-engine-alternatives-demo.png", "04 / WHOLE-PROJECT COST", "Compare the complete job on equal performance.", "Construction, trenching, restoration, service, maintenance, and replacement remain visible."),
    ("lighting-engine-decision-brief-demo.png", "05 / DEFENSIBLE DECISION", "Show the recommendation—and what challenges it.", "Four independent tests keep a favorable result in one category from hiding a weakness in another."),
]


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def fit_crop(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    tw, th = size
    scale = max(tw / image.width, th / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left, top = (resized.width - tw) // 2, (resized.height - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def wrap(draw: ImageDraw.ImageDraw, text: str, face: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines, current = [], ""
    for word in text.split():
        candidate = word if not current else f"{current} {word}"
        if draw.textbbox((0, 0), candidate, font=face)[2] <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_lines(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, face: ImageFont.FreeTypeFont, color: str, width: int, gap: int = 8) -> int:
    x, y = xy
    for line in wrap(draw, text, face, width):
        draw.text((x, y), line, font=face, fill=color)
        y += face.size + gap
    return y


def build_slide(index: int, spec: tuple[str, str, str, str]) -> Image.Image:
    filename, eyebrow, title, body = spec
    screenshot = Image.open(ASSET_DIR / filename).convert("RGB")
    canvas = Image.new("RGB", (WIDTH, HEIGHT), NAVY)
    draw = ImageDraw.Draw(canvas)

    screen = fit_crop(screenshot, (1260, 710))
    canvas.paste(screen, (596, 150))
    draw.rounded_rectangle((578, 132, 1874, 878), 20, outline=LINE, width=3)
    draw.rectangle((578, 132, 1874, 139), fill=CYAN)

    draw.text((64, 62), "AKRD / LIGHTING ENGINE", font=font(FONT_MONO, 23), fill=CYAN)
    badge = "ILLUSTRATIVE PLANNING SCENARIO"
    badge_face = font(FONT_MONO, 18)
    badge_width = draw.textbbox((0, 0), badge, font=badge_face)[2] + 34
    draw.rounded_rectangle((64, 114, 64 + badge_width, 158), 22, fill=LIME)
    draw.text((81, 125), badge, font=badge_face, fill=NAVY)
    draw.text((64, 228), eyebrow, font=font(FONT_MONO, 22), fill=CYAN)
    title_end = draw_lines(draw, (64, 278), title, font(FONT_BOLD, 54), WHITE, 450, 2)
    draw.rectangle((64, title_end + 24, 178, title_end + 30), fill=LIME)
    draw_lines(draw, (64, title_end + 64), body, font(FONT_REGULAR, 27), MUTED, 450, 10)
    draw.text((64, 974), "PRODUCT BEHAVIOR · NOT CUSTOMER RESULTS · NOT STAMPED ENGINEERING", font=font(FONT_MONO, 18), fill=MUTED)

    segment = (WIDTH - 128 - 12 * (len(SLIDES) - 1)) / len(SLIDES)
    for step in range(len(SLIDES)):
        x1 = 64 + step * (segment + 12)
        draw.rounded_rectangle((x1, 1025, x1 + segment, 1032), 4, fill=LIME if step <= index else LINE)
    return canvas


def main() -> None:
    ffmpeg = FFMPEG if FFMPEG.exists() else Path(shutil.which("ffmpeg") or "")
    if not ffmpeg.exists():
        raise SystemExit("ffmpeg not found")

    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="lighting-engine-film-") as temp:
        temp_dir = Path(temp)
        for index, spec in enumerate(SLIDES):
            build_slide(index, spec).save(temp_dir / f"slide-{index:02d}.png")
        build_slide(4, SLIDES[4]).save(POSTER, quality=92, optimize=True)

        inputs, filters = [], []
        for index in range(len(SLIDES)):
            inputs += ["-loop", "1", "-t", str(SLIDE_SECONDS), "-i", str(temp_dir / f"slide-{index:02d}.png")]
            filters.append(f"[{index}:v]fps={FPS},format=yuv420p[v{index}]")
        chain = ";".join(filters)
        current = "v0"
        offset = SLIDE_SECONDS
        for index in range(1, len(SLIDES)):
            output = f"x{index}"
            chain += f";[{current}][v{index}]xfade=transition=fade:duration=0.35:offset={offset - 0.35}[{output}]"
            current = output
            offset += SLIDE_SECONDS - 0.35
        command = [str(ffmpeg), "-y", *inputs, "-filter_complex", chain, "-map", f"[{current}]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "20", "-movflags", "+faststart", str(OUTPUT)]
        subprocess.run(command, check=True)
    print(OUTPUT)


if __name__ == "__main__":
    main()
