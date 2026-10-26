"""Read-only verification for the 261012 Files and Exceptions practice bundle.

Usage:
    python verify_files.py
    python verify_files.py --outputs

The first command checks all eight inputs, reference outputs, and core results.
The second command ALSO requires every student-generated output at the lab root.
Nothing is created, changed, or deleted by this script. Only the standard library
is needed. The directory is resolved from this script, not from the shell cwd.
"""
from pathlib import Path
import argparse
import hashlib
import json
import math
import sys


def verify(check_outputs: bool = False) -> int:
    root = Path(__file__).resolve().parent
    manifest = json.loads((root / "file_manifest.json").read_text(encoding="utf-8"))
    failures = []
    passed = 0

    def check(label: str, condition: bool) -> None:
        nonlocal passed
        if condition:
            passed += 1
            print("[PASS]", label)
        else:
            failures.append(label)
            print("[FAIL]", label)

    for name, meta in manifest["inputs"].items():
        p = root / name
        good = p.is_file() and hashlib.sha256(p.read_bytes()).hexdigest() == meta["sha256"]
        check("input " + name, good)

    for name, meta in manifest["expected_outputs"].items():
        p = root / "expected_outputs" / name
        good = p.is_file() and hashlib.sha256(p.read_bytes()).hexdigest() == meta["sha256"]
        check("reference " + name, good)

    if failures:
        print(f"\nInputs/references: {passed} passed, {len(failures)} failed.")
        print("Use a fresh extraction; the input or reference files differ from the distributed bundle.")
        return 1

    with (root / "letters.txt").open(encoding="utf-8") as f:
        first, rest, empty = f.read(2), f.read(), f.read()
    check("slides 11-12: read position", (first, rest, empty) == ("A\n", "B\nC\nB\nB\n", ""))

    with (root / "blank.txt").open(encoding="utf-8") as f:
        lines = [f.readline() for _ in range(4)]
    check("slide 15: blank line vs EOF", lines == ["A\n", "\n", "B\n", ""])

    with (root / "phones.txt").open(encoding="utf-8") as f:
        phone_lines = f.readlines()
    check("slide 16: three phone records", len(phone_lines) == 3 and all(s.endswith("\n") for s in phone_lines))

    hours = []
    for line in (root / "hours.txt").read_text(encoding="utf-8").splitlines():
        fields = line.split()
        hours.append((fields[1], f"{sum(float(x) for x in fields[2:]):.1f}"))
    check("slide 26: person totals", hours == [("Susan", "31.4"), ("Brad", "36.8"), ("Jenn", "39.5")])

    korean = (root / "korean.txt").read_text(encoding="utf-8")
    raw = (root / "korean.txt").read_bytes()
    check("slide 37: one character, three bytes", korean == "가" and len(korean) == 1 and len(raw) == 3)

    sizes = []
    with (root / "sample.bin").open("rb") as f:
        while True:
            block = f.read(1024)
            sizes.append(len(block))
            if not block:
                break
    check("slide 41: block lengths", sizes == [1024, 1024, 452, 0] and sum(sizes) == 2500)

    scores = [int(line) for line in (root / "scores.txt").read_text(encoding="utf-8").splitlines()]
    check("slides 44-47: score count/mean", len(scores) == 3 and math.isclose(sum(scores) / len(scores), 90.0))

    png = (root / "bridge.png").read_bytes()
    check("bridge input: PNG signature", png.startswith(b"\x89PNG\r\n\x1a\n"))
    print("[INFO] supplied bridge.png size:", len(png), "bytes (PPT illustration: 70404 bytes)")

    if check_outputs:
        for name, meta in manifest["expected_outputs"].items():
            actual = root / name
            reference = root / "expected_outputs" / name
            if not actual.is_file():
                check("output " + name + " exists", False)
                continue
            try:
                if meta["comparison"] == "binary":
                    same = actual.read_bytes() == reference.read_bytes()
                else:
                    # Text-mode newline conversion can differ between Windows/Linux.
                    same = actual.read_text(encoding="utf-8") == reference.read_text(encoding="utf-8")
            except (OSError, UnicodeError) as exc:
                check("output " + name + " readable: " + type(exc).__name__, False)
            else:
                check("output " + name + " content", same)

    print(f"\nSUMMARY: {passed} passed, {len(failures)} failed")
    return 1 if failures else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--outputs", action="store_true", help="also verify generated lab outputs")
    args = parser.parse_args()
    sys.exit(verify(args.outputs))
