import { Excalidraw } from "../index";
import {
    actionSelectMatchingShapeStyle,
    getMatchingShape,
} from "../actions/actionSelectMatchingShapeStyle";
import { ExcalLogo } from "../components/icons";

import { API } from "./helpers/api";
import { GlobalTestState, fireEvent, render, screen } from "./test-utils";

const makeShapes = () => [
    API.createElement({ id: "reference", backgroundColor: "#ff8787", x: 15, y: 15, roughness: 0 }),
    API.createElement({ id: "match", backgroundColor: "#ff8787", x: 145, y: 275 }),
    API.createElement({ id: "blue", backgroundColor: "#74c0fc", x: 275, y: 15 }),
    API.createElement({ id: "ellipse", backgroundColor: "#ff8787", x: 405, type: "ellipse" }),
    API.createElement({ id: "locked", backgroundColor: "#ff8787", x: 835, locked: true }),
    API.createElement({ id: "grouped", backgroundColor: "#ff8787", groupIds: ["group"], x: 665 }),
    API.createElement({ id: "deleted", backgroundColor: "#000000", x: 15, y: 15, roughness: 0 }),
    API.createElement({ id: "reference", backgroundColor: "#000000", x: 795, isDeleted: true }),
];

describe("Select matching shape style", () => {
    it("matches fill and shape while excluding ineligible elements", () => {
        const matches = getMatchingShape(makeShapes(), { reference: true });
        expect(matches.map(({ id }) => id)).toEqual(["reference", "match"]);
    });

    it("requires a single unlocked reference", () => {
        const elements = makeShapes();
        expect(getMatchingShape(elements, { locked: true })).toEqual([]);
        const transparent = makeShapes().map((element) => ({
            ...element,
            backgroundColor: "transparent",
        }));
        expect(getMatchingShape(transparent, { reference: true })).toEqual([]);
        expect(getMatchingShape(elements, { reference: true, match: true })).toEqual([]);
        expect(getMatchingShape(elements, {})).toEqual([]);
    });

    it("selects from the canvas context menu without editing any shape", async () => {
        await render(<Excalidraw />);
        const original = makeShapes().filter((element) => !element.isDeleted);
        API.setElements(original);
        API.setSelectedElements([original[0]]);
        fireEvent.contextMenu(GlobalTestState.interactiveCanvas, {
            button: 2,
            clientX: 30,
            clientY: 30,
        });
        fireEvent.click(screen.getByRole("button", { name: "Select matching shape style" }));
        expect(API.getSelectedElements().map(({ id }) => id)).toEqual(["reference", "match"]);
        expect(API.getElement(original[0]).backgroundColor).toBe("#ff8787");
        expect(API.getElement(original[4]).locked).toBe(true);
        API.executeAction(actionSelectMatchingShapeStyle);
        expect(API.getSelectedElements()).toHaveLength(2);
    });
}
);