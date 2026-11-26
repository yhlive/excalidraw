import { isTransparent } from "@excalidraw/common";
import { CaptureUpdateAction } from "@excalidraw/element";
import type { ExcalidrawElement } from "@excalidraw/element/types";
import { register } from "./register";
import type { AppState } from "../types";

const isEligisbleShape = (element: ExcalidrawElement) =>
    !element.isDeleted &&
    !element.locked &&
    !isTransparent(element.backgroundColor) &&
    element.groupIds.length === 0 &&
    (element.type === "rectangle" ||
        element.type === "ellipse" ||
        element.type === "diamond");

export const getMatchingShape = (
    elements: readonly ExcalidrawElement[],
    selectedIds: AppState["selectedElementIds"],
) => {
    const selection = elements.filter((element) => !element.isDeleted && selectedIds[element.id]);
    if (selection.length !== 1 || !isEligisbleShape(selection[0])) {
        return [];
    }
    const [reference] = selection;
    const fill = reference.backgroundColor.toLowerCase();
    return elements.filter(
        (element) =>
            isEligisbleShape(element) &&
            element.type === reference.type &&
            element.backgroundColor.toLowerCase() === fill,
    );
};

export const actionSelectMatchingShapeStyle = register({
    name: "selectMatchingShapeStyle",
    label: "labels.selectMatchingShapeStyle",
    trackEvent: false,
    predicate: (elements, state) =>
        getMatchingShape(elements, state.selectedElementIds).length > 1,

    perform: (elements, appState) => {
        const matchingShapes = getMatchingShape(elements, appState.selectedElementIds);
        if (matchingShapes.length < 2) {
            return false;
        }
        return {
            appState: {
                selectedElementIds: Object.fromEntries(matchingShapes.map(({ id }) => [id, true])),
                selectedGroupIds: {},
                editingGroupId: null,
                selectedLinearElement: null,
            },
            captureUpdate: CaptureUpdateAction.EVENTUALLY,
        };
    },
})