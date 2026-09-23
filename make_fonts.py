# make_fonts.py — сжатие шрифтов для Судоку·Дзэн
# Noto Serif: кириллица+латиница, 400 и 600
# Zen Old Mincho: сабсет на кандзи проекта
from fontTools.subset import main as subset_main
import os

os.makedirs("fonts", exist_ok=True)

# --- 1. Noto Serif 400: кириллица + латиница + базовая пунктуация ---
subset_main(
    [
        "fonts-src/NotoSerif-Regular.ttf",
        "--unicodes=U+0020-007E,U+00A0-00FF,U+0400-04FF,U+2010-2027,U+20AC",
        "--flavor=woff2",
        "--output-file=fonts/noto-serif-400.woff2",
    ]
)

# --- 2. Noto Serif 600 ---
subset_main(
    [
        "fonts-src/NotoSerif-Regular.ttf",
        "--unicodes=U+0020-007E,U+00A0-00FF,U+0400-04FF,U+2010-2027,U+20AC",
        "--flavor=woff2",
        "--output-file=fonts/noto-serif-600.woff2",
    ]
)

# --- 3. Zen Old Mincho: только кандзи проекта ---
KANJI = "禅完雨縦承書独設音"
subset_main(
    [
        "fonts-src/ZenOldMincho-Regular.ttf",
        "--text=" + KANJI,
        "--flavor=woff2",
        "--output-file=fonts/zen-kaji.woff2",
    ]
)

print("Готово:")
for f in os.listdir("fonts"):
    print(" ", f, round(os.path.getsize("fonts/" + f) / 1024, 1), "КБ")
