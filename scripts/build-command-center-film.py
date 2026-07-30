"""Build the 27-second Business Command Center case-story film.

The film uses the public, fictional sample-data screenshots generated from the
private Business Command Center. It intentionally avoids client or AKRD
performance claims and labels the demonstration throughout.
"""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "case-stories" / "business-command-center"
OUTPUT = ASSET_DIR / "business-command-center-film.mp4"
POSTER = ASSET_DIR / "business-command-center-film-poster.jpg"
FFMPEG = Path(
    r"C:\Users\akran\AppData\Local\Microsoft\WinGet\Packages"
    r"\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
    r"\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe"
)

WIDTH = 1920
HEIGHT = 1080
FPS = 30
SLIDE_DURATION = 29.4 / 9
FADE_DURATION = 0.30
STEP = SLIDE_DURATION - FADE_DURATION

NAVY = "#06101f"
BLUE = "#2858ff"
CYAN = "#12bfd0"
LIME = "#b7ed3f"
AMBER = "#ffb74a"
WHITE = "#f8fbff"
MUTED = "#a9b6c8"
LINE = "#26364b"

FONT_REGULAR = Path(r"C:\Windows\Fonts\segoeui.ttf")
FONT_SEMIBOLD = Path(r"C:\Windows\Fonts\seguisb.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\segoeuib.ttf")
FONT_MONO = Path(r"C:\Windows\Fonts\consolab.ttf")


SLIDES = [
    {
        "kind": "intro",
        "image": "command-center-today.png",
        "eyebrow": "AKRD / PRIVATE BUSINESS COMMAND CENTER",
        "title": "A complete business story in 27 seconds.",
        "metric": "SIMULATED DATA",
        "body": "A fictional portfolio demonstrates how customer interest becomes priced work, delivery, cash, and management insight.",
    },
    {
        "image": "command-center-today.png",
        "eyebrow": "01 / DAILY CONTROL",
        "title": "Start with what needs attention.",
        "metric": "4 ACTIVE PROJECTS",
        "body": "Three quotes await a response. Two renewals are due. No invoice is overdue.",
    },
    {
        "image": "command-center-leads.png",
        "eyebrow": "02 / LEAD CONTEXT",
        "title": "Keep every opportunity in context.",
        "metric": "10 OPPORTUNITIES",
        "body": "Source, sales stage, notes, and the next follow-up stay attached to one customer record.",
    },
    {
        "image": "command-center-pipeline.png",
        "eyebrow": "03 / COMMERCIAL PIPELINE",
        "title": "See what is moving toward a decision.",
        "metric": "$60.6K ACCEPTED",
        "body": "Six accepted opportunities, two sent quotes, one scoped opportunity, and one declined opportunity.",
    },
    {
        "image": "command-center-projects.png",
        "eyebrow": "04 / DELIVERY",
        "title": "Carry the sales promise into the work.",
        "metric": "4 PROJECTS",
        "body": "Accepted work becomes projects, task ownership, due dates, and visible completion progress.",
    },
    {
        "image": "command-center-invoices.png",
        "eyebrow": "05 / CASH + RENEWALS",
        "title": "Connect delivery to the money.",
        "metric": "$52.9K COLLECTED",
        "body": "$7.7K remains outstanding, with zero overdue invoices and two recurring renewals approaching.",
    },
    {
        "image": "command-center-reports.png",
        "eyebrow": "06 / MANAGEMENT VIEW",
        "title": "Turn operating records into decisions.",
        "metric": "86% WIN RATE",
        "body": "$10.5K in simulated monthly recurring revenue and $50.1K in one-time booked value.",
    },
    {
        "image": "command-center-analytics.png",
        "eyebrow": "07 / WEBSITE DEMAND",
        "title": "Connect attention to business action.",
        "metric": "176 SESSIONS",
        "body": "The sample shows 31 lead actions, 24 scheduler opens, and 19 completed assessments.",
    },
    {
        "kind": "outro",
        "image": "command-center-reports.png",
        "second_image": "command-center-analytics.png",
        "eyebrow": "CUSTOMER SIGNAL TO MANAGEMENT DECISION",
        "title": "One connected system. A clearer next move.",
        "metric": "BUILT TO FIT THE BUSINESS",
        "body": "The fictional data is replaceable. The operating logic is the product.",
    },
]


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def fit_crop(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    scale = max(target_w / image.width, target_h / image.height)
    resized = image.resize(
        (round(image.width * scale), round(image.height * scale)),
        Image.Resampling.LANCZOS,
    )
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def wrap_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    selected_font: ImageFont.FreeTypeFont,
    max_width: int,
) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if draw.textbbox((0, 0), candidate, font=selected_font)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    position: tuple[int, int],
    text: str,
    selected_font: ImageFont.FreeTypeFont,
    fill: str,
    max_width: int,
    spacing: int,
) -> int:
    x, y = position
    lines = wrap_text(draw, text, selected_font, max_width)
    line_height = selected_font.size + spacing
    for line in lines:
        draw.text((x, y), line, font=selected_font, fill=fill)
        y += line_height
    return y


def add_brand_mark(canvas: Image.Image, x: int, y: int, size: int) -> None:
    logo_path = ROOT / "akrandall_logo_pack_transparent" / "logo-mark-512.png"
    logo = Image.open(logo_path).convert("RGBA")
    logo.thumbnail((size, size), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo, (x, y))


def add_badge(draw: ImageDraw.ImageDraw, x: int, y: int) -> None:
    label = "FICTIONAL SAMPLE DATA"
    badge_font = font(FONT_MONO, 20)
    box = draw.textbbox((0, 0), label, font=badge_font)
    width = box[2] - box[0] + 34
    draw.rounded_rectangle((x, y, x + width, y + 44), 22, fill=LIME)
    draw.text((x + 17, y + 10), label, font=badge_font, fill=NAVY)


def draw_progress(draw: ImageDraw.ImageDraw, active: int) -> None:
    gap = 12
    total_width = WIDTH - 128
    segment_width = (total_width - gap * (len(SLIDES) - 1)) / len(SLIDES)
    y = HEIGHT - 38
    for index in range(len(SLIDES)):
        x1 = 64 + index * (segment_width + gap)
        x2 = x1 + segment_width
        color = LIME if index <= active else LINE
        draw.rounded_rectangle((x1, y, x2, y + 6), 3, fill=color)


def standard_slide(slide: dict[str, str], index: int) -> Image.Image:
    canvas = Image.new("RGBA", (WIDTH, HEIGHT), NAVY)
    draw = ImageDraw.Draw(canvas)
    screenshot = Image.open(ASSET_DIR / slide["image"]).convert("RGB")
    screenshot = fit_crop(screenshot, (1320, 916))

    draw.rounded_rectangle((530, 54, 1882, 1002), 18, fill="#020713")
    canvas.paste(screenshot, (546, 70))
    draw.rounded_rectangle(
        (530, 54, 1882, 1002), 18, outline="#354a63", width=2
    )
    draw.rectangle((530, 54, 1882, 60), fill=BLUE)
    draw.rectangle((530, 60, 1110, 64), fill=CYAN)

    add_brand_mark(canvas, 64, 62, 64)
    add_badge(draw, 64, 152)
    draw.text((64, 232), slide["eyebrow"], font=font(FONT_MONO, 22), fill=CYAN)
    title_bottom = draw_wrapped(
        draw,
        (64, 286),
        slide["title"],
        font(FONT_BOLD, 60),
        WHITE,
        404,
        -2,
    )
    draw.rectangle((64, title_bottom + 24, 178, title_bottom + 29), fill=LIME)
    draw.text(
        (64, title_bottom + 60),
        slide["metric"],
        font=font(FONT_BOLD, 43),
        fill=AMBER,
    )
    draw_wrapped(
        draw,
        (64, title_bottom + 132),
        slide["body"],
        font(FONT_REGULAR, 26),
        MUTED,
        404,
        11,
    )
    draw_progress(draw, index)
    return canvas.convert("RGB")


def intro_slide(slide: dict[str, str], index: int) -> Image.Image:
    background = Image.open(ASSET_DIR / slide["image"]).convert("RGB")
    background = fit_crop(background, (WIDTH, HEIGHT)).filter(
        ImageFilter.GaussianBlur(6)
    )
    canvas = background.convert("RGBA")
    canvas.alpha_composite(Image.new("RGBA", (WIDTH, HEIGHT), (3, 10, 22, 220)))
    draw = ImageDraw.Draw(canvas)
    add_brand_mark(canvas, 96, 74, 82)
    add_badge(draw, WIDTH - 400, 92)
    draw.text((96, 264), slide["eyebrow"], font=font(FONT_MONO, 24), fill=CYAN)
    title_bottom = draw_wrapped(
        draw,
        (96, 328),
        slide["title"],
        font(FONT_BOLD, 88),
        WHITE,
        1180,
        -2,
    )
    draw.text(
        (99, title_bottom + 52),
        slide["metric"],
        font=font(FONT_BOLD, 44),
        fill=LIME,
    )
    draw_wrapped(
        draw,
        (100, title_bottom + 126),
        slide["body"],
        font(FONT_REGULAR, 30),
        MUTED,
        1030,
        12,
    )
    draw_progress(draw, index)
    return canvas.convert("RGB")


def outro_slide(slide: dict[str, str], index: int) -> Image.Image:
    left = fit_crop(
        Image.open(ASSET_DIR / slide["image"]).convert("RGB"), (WIDTH // 2, HEIGHT)
    )
    right = fit_crop(
        Image.open(ASSET_DIR / slide["second_image"]).convert("RGB"),
        (WIDTH // 2, HEIGHT),
    )
    canvas = Image.new("RGBA", (WIDTH, HEIGHT), NAVY)
    canvas.paste(left, (0, 0))
    canvas.paste(right, (WIDTH // 2, 0))
    canvas.alpha_composite(Image.new("RGBA", (WIDTH, HEIGHT), (3, 10, 22, 224)))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((116, 126, 1804, 908), 34, fill=(6, 16, 31, 235))
    draw.rounded_rectangle(
        (116, 126, 1804, 908), 34, outline="#37506f", width=2
    )
    add_brand_mark(canvas, 164, 174, 76)
    add_badge(draw, 1354, 190)
    draw.text((164, 312), slide["eyebrow"], font=font(FONT_MONO, 24), fill=CYAN)
    title_bottom = draw_wrapped(
        draw,
        (164, 376),
        slide["title"],
        font(FONT_BOLD, 82),
        WHITE,
        1450,
        -1,
    )
    draw.text(
        (166, title_bottom + 58),
        slide["metric"],
        font=font(FONT_BOLD, 42),
        fill=LIME,
    )
    draw_wrapped(
        draw,
        (168, title_bottom + 132),
        slide["body"],
        font(FONT_REGULAR, 30),
        MUTED,
        1180,
        12,
    )
    draw_progress(draw, index)
    return canvas.convert("RGB")


def create_slide(slide: dict[str, str], index: int) -> Image.Image:
    if slide.get("kind") == "intro":
        return intro_slide(slide, index)
    if slide.get("kind") == "outro":
        return outro_slide(slide, index)
    return standard_slide(slide, index)


def render_video(slide_paths: list[Path], target: Path) -> None:
    if not FFMPEG.exists():
        raise FileNotFoundError(f"FFmpeg not found at {FFMPEG}")

    command = [str(FFMPEG), "-y", "-hide_banner", "-loglevel", "warning"]
    for slide_path in slide_paths:
        command.extend(
            [
                "-loop",
                "1",
                "-framerate",
                str(FPS),
                "-t",
                f"{SLIDE_DURATION:.8f}",
                "-i",
                str(slide_path),
            ]
        )

    filters: list[str] = []
    for index in range(len(slide_paths)):
        zoom = "1+0.00018*on" if index % 2 == 0 else "1.018-0.00018*on"
        filters.append(
            f"[{index}:v]zoompan=z='{zoom}':"
            "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"d=1:s={WIDTH}x{HEIGHT}:fps={FPS},"
            f"trim=duration={SLIDE_DURATION:.8f},setpts=PTS-STARTPTS[s{index}]"
        )

    previous = "s0"
    transitions = [
        "fade",
        "smoothleft",
        "fade",
        "smoothleft",
        "fade",
        "smoothleft",
        "fade",
        "smoothleft",
    ]
    for index in range(1, len(slide_paths)):
        output_label = f"x{index}"
        offset = STEP * index
        filters.append(
            f"[{previous}][s{index}]xfade=transition={transitions[index - 1]}:"
            f"duration={FADE_DURATION:.2f}:offset={offset:.8f}[{output_label}]"
        )
        previous = output_label

    temp_target = target.with_name(f"{target.stem}.rendering{target.suffix}")
    command.extend(
        [
            "-filter_complex",
            ";".join(filters),
            "-map",
            f"[{previous}]",
            "-t",
            "27",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "22",
            "-profile:v",
            "high",
            "-level",
            "4.1",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "-r",
            str(FPS),
            str(temp_target),
        ]
    )
    subprocess.run(command, check=True)
    shutil.move(str(temp_target), str(target))


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="akrd-command-film-") as temp_dir:
        temp = Path(temp_dir)
        slide_paths: list[Path] = []
        for index, slide in enumerate(SLIDES):
            slide_path = temp / f"slide-{index:02d}.png"
            rendered_slide = create_slide(slide, index)
            rendered_slide.save(slide_path, quality=95)
            if index == 0:
                rendered_slide.save(POSTER, quality=90, optimize=True)
            slide_paths.append(slide_path)
        render_video(slide_paths, OUTPUT)
    print(f"Rendered {OUTPUT}")


if __name__ == "__main__":
    main()
