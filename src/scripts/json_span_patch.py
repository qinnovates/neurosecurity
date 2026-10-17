"""Format-preserving edits to hand-formatted JSON files.

Several data-lake files are hand-formatted (one-line arrays, one-line objects)
and do not survive a `json.load` / `json.dump` round trip. Re-serialising them
would turn a few-line data fix into a whole-file diff. This module parses a
JSON document while recording the character span of every value, so a caller
can replace individual values and rebuild individual arrays, leaving every
other byte untouched. Callers must verify the result by parsing it and
comparing it with the expected object (see `apply_edits`).
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

__all__ = ["Node", "parse", "apply_edits", "line_indent", "rebuild_array"]

_WS = " \t\r\n"


@dataclass
class Node:
    """A parsed JSON value and its [start, end) span in the source text."""

    kind: str  # "object" | "array" | "scalar"
    start: int
    end: int
    value: Any = None
    items: list["Node"] = field(default_factory=list)  # array elements
    members: list[tuple[str, int, "Node"]] = field(default_factory=list)  # (key, key_start, value)

    def get(self, key: str) -> "Node | None":
        for member_key, _, member_value in self.members:
            if member_key == key:
                return member_value
        return None


class _Parser:
    def __init__(self, text: str) -> None:
        self.text = text
        self.pos = 0

    def skip_ws(self) -> None:
        while self.pos < len(self.text) and self.text[self.pos] in _WS:
            self.pos += 1

    def parse_value(self) -> Node:
        self.skip_ws()
        char = self.text[self.pos]
        if char == "{":
            return self.parse_object()
        if char == "[":
            return self.parse_array()
        start = self.pos
        value, end = json.JSONDecoder().raw_decode(self.text, self.pos)
        self.pos = end
        return Node("scalar", start, end, value=value)

    def parse_object(self) -> Node:
        node = Node("object", self.pos, -1)
        self.pos += 1
        self.skip_ws()
        if self.text[self.pos] == "}":
            self.pos += 1
            node.end = self.pos
            return node
        while True:
            self.skip_ws()
            key_start = self.pos
            key, self.pos = json.JSONDecoder().raw_decode(self.text, self.pos)
            self.skip_ws()
            if self.text[self.pos] != ":":
                raise ValueError(f"expected ':' at offset {self.pos}")
            self.pos += 1
            node.members.append((key, key_start, self.parse_value()))
            self.skip_ws()
            if self.text[self.pos] == ",":
                self.pos += 1
                continue
            if self.text[self.pos] == "}":
                self.pos += 1
                node.end = self.pos
                return node
            raise ValueError(f"expected ',' or '}}' at offset {self.pos}")

    def parse_array(self) -> Node:
        node = Node("array", self.pos, -1)
        self.pos += 1
        self.skip_ws()
        if self.text[self.pos] == "]":
            self.pos += 1
            node.end = self.pos
            return node
        while True:
            node.items.append(self.parse_value())
            self.skip_ws()
            if self.text[self.pos] == ",":
                self.pos += 1
                continue
            if self.text[self.pos] == "]":
                self.pos += 1
                node.end = self.pos
                return node
            raise ValueError(f"expected ',' or ']' at offset {self.pos}")


def parse(text: str) -> Node:
    """Parse `text` into a span-annotated tree."""
    parser = _Parser(text)
    root = parser.parse_value()
    parser.skip_ws()
    if parser.pos != len(text):
        raise ValueError(f"trailing content at offset {parser.pos}")
    return root


def line_indent(text: str, offset: int) -> str:
    """Whitespace at the start of the line that contains `offset`."""
    line_start = text.rfind("\n", 0, offset) + 1
    indent_end = line_start
    while indent_end < len(text) and text[indent_end] in " \t":
        indent_end += 1
    return text[line_start:indent_end]


def rebuild_array(text: str, array: Node, element_texts: list[str]) -> str:
    """Render `element_texts` in the layout `array` already uses.

    A multi-line array keeps one element per line at the original element
    indentation; a single-line array stays on one line with ", " separators.
    """
    if not element_texts:
        return "[]"
    original = text[array.start:array.end]
    if "\n" not in original:
        return "[" + ", ".join(element_texts) + "]"
    if array.items:
        element_indent = line_indent(text, array.items[0].start)
    else:
        element_indent = line_indent(text, array.start) + "  "
    closing_indent = line_indent(text, array.end - 1)
    body = (",\n").join(element_indent + element for element in element_texts)
    return "[\n" + body + "\n" + closing_indent + "]"


def apply_edits(text: str, edits: list[tuple[int, int, str]]) -> str:
    """Apply non-overlapping (start, end, replacement) edits to `text`."""
    ordered = sorted(edits, key=lambda edit: edit[0])
    for (_, previous_end, _), (next_start, _, _) in zip(ordered, ordered[1:]):
        if next_start < previous_end:
            raise ValueError(f"overlapping edits at offset {next_start}")
    pieces: list[str] = []
    cursor = 0
    for start, end, replacement in ordered:
        pieces.append(text[cursor:start])
        pieces.append(replacement)
        cursor = end
    pieces.append(text[cursor:])
    return "".join(pieces)
