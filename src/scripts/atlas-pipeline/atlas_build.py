"""Entry point for the atlas pipeline. Run with `python -I atlas_build.py <command>`.

Python's isolated mode keeps the working directory and user site off the import path, so this file
adds its own directory, which holds only this repository's code.
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from atlas_pipeline.cli import main  # noqa: E402

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
