import { describe, expect, test } from "vitest";

import { ListItemExtension } from "../../src/syntax-extensions/ListItemExtension";
import { TaskListItemExtension } from "../../src/syntax-extensions/TaskListItemExtension";
import { UnorderedListExtension } from "../../src/syntax-extensions/UnorderedListExtension";
import { type NodeViewFixture, renderNodeView } from "../utils/node-view";

function render(markdown: string): NodeViewFixture {
  return renderNodeView(new TaskListItemExtension(), markdown, [
    new UnorderedListExtension(),
    new ListItemExtension(),
  ]);
}

describe("TaskListItemView", () => {
  test("renders an unchecked checkbox for an unchecked item", () => {
    const checkbox = render("* [ ] Hello\n").editor.element("input");

    expect(checkbox.getAttribute("type")).toBe("checkbox");
    expect(checkbox.hasAttribute("checked")).toBe(false);
  });

  test("renders a checked checkbox for a checked item", () => {
    expect(
      render("* [x] Hello\n").editor.element("input").getAttribute("checked"),
    ).toBe("checked");
  });

  test("renders the checkbox outside of the editable content", () => {
    const { editor } = render("* [ ] Hello\n");
    const checkbox = editor.element("input");

    expect(editor.element("li").tagName).toBe("LI");
    // The checkbox sits in a separate, non-editable container, so that
    // ProseMirror only ever manages the content span.
    expect(checkbox.parentElement?.getAttribute("contenteditable")).toBe(
      "false",
    );
    expect(
      editor
        .element('li > span:not([contenteditable="false"])')
        .contains(checkbox),
    ).toBe(false);
  });

  test("checking the checkbox checks the item", () => {
    const fx = render("* [ ] Hello\n");

    expect(fx.markdown()).toBe("* [ ] Hello");

    fx.editor.click("input");

    expect(fx.markdown()).toBe("* [x] Hello");
  });

  test("unchecking the checkbox unchecks the item", () => {
    const fx = render("* [x] Hello\n");

    expect(fx.markdown()).toBe("* [x] Hello");

    fx.editor.click("input");

    expect(fx.markdown()).toBe("* [ ] Hello");
  });

  test("prevents the browser from toggling the checkbox itself", () => {
    expect(render("* [ ] Hello\n").editor.click("input")).toBe(true);
  });

  test("does nothing when the node has no position in the document", () => {
    const { editor } = render("* [ ] Hello\n");
    const checkbox = editor.element("input");

    // Remove the item so the now-orphaned node view's getPos() returns
    // undefined, then click the detached checkbox.
    editor.command((state, dispatch) => {
      dispatch?.(state.tr.delete(0, state.doc.content.size));
      return true;
    });
    const docAfterDelete = editor.doc;

    expect(editor.click(checkbox)).toBe(false);
    expect(editor.doc.eq(docAfterDelete)).toBe(true);
  });
});
