"""Shared test setup. No test reads an atlas file or touches the network.

Tests that need the imaging stack start with `pytest.importorskip("numpy")`, so the remaining tests
(the buildability rule, fetch, notices and the committed manifest's records) run with the standard
library and pytest alone. That is what the pull-request workflow runs.
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
