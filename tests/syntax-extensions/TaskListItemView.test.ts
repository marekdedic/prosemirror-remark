import { describe, expect, test } from "vitest";

import { ListItemExtension } from "../../src/syntax-extensions/ListItemExtension";
import { TaskListItemExtension } from "../../src/syntax-extensions/TaskListItemExtension";
import { UnorderedListExtension } from "../../src/syntax-extensions/UnorderedListExtension";
import { NodeViewTester } from "../utils/NodeViewTester";

function buildTester(
  markdown: string,
  detached = false,
): NodeViewTester<never> {
  return new NodeViewTester(new TaskListItemExtension(), {
    detached,
    markdown,
    otherExtensionsInTest: [
      new UnorderedListExtension(),
      new ListItemExtension(),
    ],
  });
}

describe("TaskListItemView", () => {
  test("Renders an unchecked checkbox for an unchecked item", () => {
    expect.assertions(2);

    const checkbox = buildTester("* [ ] Hello\n").element("input");

    expect(checkbox.getAttribute("type")).toBe("checkbox");
    expect(checkbox.hasAttribute("checked")).toBe(false);
  });

  test("Renders a checked checkbox for a checked item", () => {
    expect.assertions(1);

    expect(
      buildTester("* [x] Hello\n").element("input").getAttribute("checked"),
    ).toBe("checked");
  });

  test("Renders the checkbox outside of the editable content", () => {
    expect.assertions(3);

    const tester = buildTester("* [ ] Hello\n");

    expect(tester.dom.tagName).toBe("LI");
    // The checkbox sits in a separate, non-editable container, so that
    // ProseMirror only ever manages the content span.
    expect(
      tester.element("input").parentElement?.getAttribute("contenteditable"),
    ).toBe("false");
    expect(tester.contentDOM.contains(tester.element("input"))).toBe(false);
  });

  test("Checking the checkbox checks the item", () => {
    expect.assertions(2);

    const tester = buildTester("* [ ] Hello\n");

    expect(tester.markdown).toBe("* [ ] Hello");

    tester.click("input");

    expect(tester.markdown).toBe("* [x] Hello");
  });

  test("Unchecking the checkbox unchecks the item", () => {
    expect.assertions(2);

    const tester = buildTester("* [x] Hello\n");

    expect(tester.markdown).toBe("* [x] Hello");

    tester.click("input");

    expect(tester.markdown).toBe("* [ ] Hello");
  });

  test("Prevents the browser from toggling the checkbox itself", () => {
    expect.assertions(1);

    expect(buildTester("* [ ] Hello\n").click("input")).toBe(true);
  });

  test("Does nothing when the node has no position in the document", () => {
    expect.assertions(2);

    const tester = buildTester("* [ ] Hello\n", true);

    expect(tester.click("input")).toBe(false);
    expect(tester.markdown).toBe("* [ ] Hello");
  });

  test("Keeps ProseMirror from handling events on the checkbox", () => {
    expect.assertions(1);

    expect(
      buildTester("* [ ] Hello\n").nodeView.stopEvent?.(new Event("x")),
    ).toBe(true);
  });
});
