#!/usr/bin/env python3
"""
Builds the self-hosted Newsreader files in src/app/_fonts/ (see src/app/fonts.ts) from Google Fonts' own
subset files. Google serves each subset with the full optical-size and weight axes, roman and italic: 280 KB
for latin alone. The site sets the serif as display type ('opsz' 24-72) and its italic as an accent, so:

  roman   keeps the weight axis (200-800) and optical sizes 18-72 (the text-size masters, 6-18, are dropped)
  italic  keeps optical sizes 18-72 and only the weights it is set at, 340-400: the display accent is 340 at
          'opsz' 60-72 (hero, section headings), the text italic is 400 at 'opsz' 24-48 (service quotes, the
          chat verdict line) or at the browser's automatic optical size (widgets)

Same outlines, kerning and metrics as the originals at those settings; latin comes to about 167 KB.

Sources: the variable faces listed by
  https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800
saved as newsreader-{latin,latin-ext,vietnamese}{,-italic}.woff2 in one folder.

  pip install fonttools brotli
  python3 scripts/build-fonts.py <folder with the six source files>

Newsreader is licensed under the SIL Open Font License 1.1 (see NOTICE).
"""
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

SUBSETS = ("latin", "latin-ext", "vietnamese")
ROMAN = {"opsz": (18, 72)}
ITALIC = {"opsz": (18, 72), "wght": (340, 400)}

OUT = Path(__file__).resolve().parent.parent / "src" / "app" / "_fonts"


def build(source: Path, name: str, limits: dict) -> None:
    font = instancer.instantiateVariableFont(TTFont(source / name), limits)
    font.flavor = "woff2"
    font.save(OUT / name)
    print(f"{name}: {(source / name).stat().st_size:,} -> {(OUT / name).stat().st_size:,} bytes")


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    source = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    for subset in SUBSETS:
        build(source, f"newsreader-{subset}.woff2", ROMAN)
        build(source, f"newsreader-{subset}-italic.woff2", ITALIC)


if __name__ == "__main__":
    main()
