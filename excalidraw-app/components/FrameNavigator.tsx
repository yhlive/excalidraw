import { useEffect, useState } from "react";
import { Button, Sidebar } from "@excalidraw/excalidraw";
import { isFrameElement } from "@excalidraw/element";

import type {
  ExcalidrawElement,
  ExcalidrawFrameElement,
} from "@excalidraw/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export const FRAME_NAVIGATOR = "frameNavigator";

type FrameEntry = { id: string; name: string };
type NavigatorEditor = Pick<
  ExcalidrawImperativeAPI,
  "getSceneElements" | "onChange" | "setViewport"
>;

export const getFrameEntries = (
  elements: readonly ExcalidrawElement[],
): FrameEntry[] => {
  return elements
    .filter(
      (element): element is ExcalidrawFrameElement =>
        isFrameElement(element) && !element.isDeleted,
    )
    .map((frame, index) => ({
      id: frame.id,
      name: frame.name?.trim() || `Untitled frame ${index + 1}`,
    }));
};
export const FrameNavigator = ({ editor }: { editor: NavigatorEditor }) => (
  <Sidebar name={FRAME_NAVIGATOR}>
    <Sidebar.Header>Frame Navigator</Sidebar.Header>
    <FrameNavigatorList editor={editor} />
  </Sidebar>
);

export const FrameNavigatorList = ({ editor }: { editor: NavigatorEditor }) => {
  const [frames, setFrames] = useState<FrameEntry[]>(
    getFrameEntries(editor.getSceneElements()),
  );

  useEffect(() => {
    const update = (elements: readonly ExcalidrawElement[]) => {
      const entries = getFrameEntries(elements);
      setFrames((current) =>
        current.length === entries.length &&
        current.every(
          (frame, index) =>
            frame.id === entries[index].id &&
            frame.name === entries[index].name,
        )
          ? current
          : entries,
      );
    };

    const unsubscribe = editor.onChange(update);
    update(editor.getSceneElements());
    return unsubscribe;
  }, [editor]);

  const jumpToFrame = (id: string) => {
    const frame = editor
      .getSceneElements()
      .find((element) => element.id === id);
    if (frame) {
      editor.setViewport({
        target: frame,
        fit: "scale-down",
        offsets: { ui: true },
      });
    }
  };
  if (!frames.length) {
    return <p style={{ fontSize: "0 1rem" }}>No frames on this canvas</p>;
  }
  return (
    <ul
      aria-label="Frames on this canvas"
      style={{
        listStyle: "none",
        margin: 0,
        padding: "0.75rem",
        display: "grid",
        gap: "0.5rem",
        overflowY: "auto",
      }}
    >
      {frames.map((frame) => (
        <li key={frame.id}>
          <Button
            onSelect={() => jumpToFrame(frame.id)}
            style={{ width: "100%", overflowWrap: "anywhere" }}
          >
            {frame.name}
          </Button>
        </li>
      ))}
    </ul>
  );
};
