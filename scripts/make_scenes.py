#!/usr/bin/env python3
"""Generate original local scenes for the Excalidraw workshop."""

import argparse
import json
from pathlib import Path


class Scene:
    def __init__(self):
        self.elements = []

    def add(self, element_id, kind, x, y, width, height, **options):
        element = {
            "id": element_id, "type": kind, "x": x, "y": y,
            "width": width, "height": height, "angle": 0,
            "strokeColor": "#1e1e1e", "backgroundColor": "transparent",
            "fillStyle": "solid", "strokeWidth": 2, "strokeStyle": "solid",
            "roughness": 0, "opacity": 100, "groupIds": [], "frameId": None,
            "roundness": None, "seed": 1000 + len(self.elements), "version": 1,
            "versionNonce": 0, "isDeleted": False, "boundElements": None,
            "updated": 1, "link": None, "locked": False,
        }
        element.update(options)
        self.elements.append(element)
        return element

    def label(self, element_id, value, x, y, *, frame=None, parent=None, group=None,
              size=20):
        width = max(len(value) * size * 0.66, 10)
        return self.add(
            element_id, "text", x, y, width, size * 1.25,
            text=value, originalText=value, fontSize=size, fontFamily=2,
            textAlign="center" if parent else "left",
            verticalAlign="middle" if parent else "top",
            autoResize=True, lineHeight=1.25, containerId=parent, frameId=frame,
            groupIds=[group] if group else [],
        )

    def node(self, element_id, value, x, y, *, fill="#d0ebff", width=230, h=68,
             kind="rectangle", locked=False, group=None, frame=None):
        body = self.add(
            element_id, kind, x, y, width, h, backgroundColor=fill,
            locked=locked, groupIds=[group] if group else [], frameId=frame,
            boundElements=[{"type": "text", "id": element_id + "-label"}],
        )
        label_width = max(len(value) * 20 * 0.66, 10)
        child = self.label(
            element_id + "-label", value, x + (width - label_width) / 2,
            y + (h - 25) / 2, parent=element_id, frame=frame, group=group,
        )
        child["locked"] = locked
        return body

    def frame(self, element_id, name, x, y, *, width=410, height=250):
        return self.add(element_id, "frame", x, y, width, height, name=name)

    def save(self, where, filename):
        document = {
            "type": "excalidraw", "version": 2, "source": "https://excalidraw.com",
            "elements": self.elements, "appState": {"viewBackgroundColor": "#ffffff"},
            "files": {},
        }
        (where / filename).write_text(
            json.dumps(document, ensure_ascii=False, separators=(",", ":")) + "\n",
            encoding="utf-8",
        )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", type=Path)
    args = parser.parse_args()
    args.folder.mkdir(parents=True, exist_ok=True)

    scene = Scene()
    for i, name in enumerate(["Order intake", "Payment review", "Release delivery", None]):
        x = 620 * i
        frame = f"nav-{i}"
        scene.frame(frame, name, x, 0)
        scene.node(f"lane-{i}", ["Validate request", "Confirm payment", "Send package", "Open items"][i],
                   x + 50, 92, frame=frame)
    scene.save(args.folder, "01-release-map.excalidraw")

    empty = Scene()
    empty.node("no-frame", "Unframed note", 20, 30)
    empty.save(args.folder, "01-no-frames.excalidraw")

    large = Scene()
    for i in range(120):
        x, y = (i % 12) * 500, (i // 12) * 330
        frame = f"batch-{i}"
        large.frame(frame, f"Service {i + 1:03d}", x, y)
        large.node(f"check-{i}", f"Health check {i + 1:03d}", x + 55, y + 100, frame=frame)
    large.save(args.folder, "01-many-frames.excalidraw")

    scene = Scene()
    scene.node("warning-start", "Warning A", 0, 0, fill="#ffc9c9")
    scene.node("warning-match", "Warning B", 295, 0, fill="#ffc9c9")
    scene.node("warning-locked", "Locked warning", 590, 0, fill="#ffc9c9", locked=True)
    scene.node("other-shape", "Decision", 0, 150, fill="#ffc9c9", kind="diamond", h=125)
    scene.node("other-fill", "Normal", 295, 150)
    scene.node("group-first", "Grouped warning", 590, 150, fill="#ffc9c9", group="related")
    scene.node("group-second", "Group note", 590, 245, fill="#fff3bf", group="related")
    scene.save(args.folder, "02-style-review.excalidraw")

    scene = Scene()
    scene.label("release-caption", "Release checklist", 0, -85, size=28)
    # Scene order intentionally differs from the spatial reading order.
    scene.node("deploy", "Deploy release", 375, 180, width=290)
    scene.node("validate", "Validate build", 375, 0, width=290)
    scene.node("prepare", "Prepare branch", 0, 0, width=290)
    scene.node("review", "Review changes", 0, 180, width=290)
    scene.node("locked-reference", "Reference only", 755, 0, width=230, locked=True)
    arrow = scene.add(
        "prepare-validate", "arrow", 295, 34, 76, 0, points=[[0, 0], [76, 0]],
        startBinding={"elementId": "prepare", "focus": 0, "gap": 5},
        endBinding={"elementId": "validate", "focus": 0, "gap": 4},
        startArrowhead=None, endArrowhead="arrow", elbowed=False,
    )
    for element in scene.elements:
        if element["id"] in ("prepare", "validate"):
            element["boundElements"].append({"type": "arrow", "id": arrow["id"]})
    scene.save(args.folder, "03-release-checklist.excalidraw")

    scene = Scene()
    for i, (name, content, color) in enumerate([
        ("Release/QA", "LOGIN SMOKE CHECK", "#ffc9c9"),
        ("Release/QA", "PAYMENT SMOKE CHECK", "#a5d8ff"),
        ("Résumé", "HANDOFF ONLY", "#d3f9d8"),
    ]):
        x = i * 495
        frame = f"qa-{i}"
        scene.frame(frame, name, x, 0, width=410, height=250)
        scene.node(f"export-{i}", content, x + 55, 100,
                   width=300, fill=color, frame=frame)
    scene.label("outside", "DO NOT EXPORT", 10, 320)
    scene.save(args.folder, "04-release-export.excalidraw")


if __name__ == "__main__":
    main()
