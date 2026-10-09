import type { EditorView } from "prosemirror-view";

import { describe, expect, test, vi } from "vitest";

import { ListItemExtension } from "../../src/syntax-extensions/ListItemExtension";
import { TaskListItemExtension } from "../../src/syntax-extensions/TaskListItemExtension";
import { UnorderedListExtension } from "../../src/syntax-extensions/UnorderedListExtension";
import { type NodeViewFixture, renderNodeView } from "../utils/node-view";

function render(
  markdown: string,
  mousedown?: (view: EditorView, event: MouseEvent) => boolean,
): NodeViewFixture {
  return renderNodeView(
    new TaskListItemExtension(),
    markdown,
    [new UnorderedListExtension(), new ListItemExtension()],
    mousedown === undefined ? {} : { handleDOMEvents: { mousedown } },
  );
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

  test("renders the spread of a tight item", () => {
    expect(
      render("* [ ] Hello\n").editor.element("li").getAttribute("data-spread"),
    ).toBe("false");
  });

  test("renders the spread of a spread item", () => {
    expect(
      render("* [ ] Hello\n\n  World\n")
        .editor.element("li")
        .getAttribute("data-spread"),
    ).toBe("true");
  });

  test.each([
    ["* [ ] Hello\n", "false"],
    ["* [x] Hello\n", "true"],
  ])("renders the checked state of %j", (markdown, checked) => {
    expect(
      render(markdown).editor.element("li").getAttribute("data-checked"),
    ).toBe(checked);
  });

  test("renders the item with classes and without inline styles", () => {
    const { editor } = render("* [ ] Hello\n");
    const item = editor.element("li");

    expect(item.className).toBe("prosemirror-remark-task-list-item");
    expect(editor.element("input").parentElement?.className).toBe(
      "prosemirror-remark-task-list-item-checkbox",
    );
    expect(
      editor.element(".prosemirror-remark-task-list-item-content").tagName,
    ).toBe("DIV");
    expect(item.querySelectorAll("[style]")).toHaveLength(0);
    expect(item.hasAttribute("style")).toBe(false);
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
        .element(".prosemirror-remark-task-list-item-content")
        .contains(checkbox),
    ).toBe(false);
  });

  test("checking the checkbox checks the item", () => {
    const fx = render("* [ ] Hello\n");

    expect(fx.markdown()).toBe("* [ ] Hello");

    fx.editor.click("input");

    expect(fx.markdown()).toBe("* [x] Hello");
    expect(fx.editor.element("li").getAttribute("data-checked")).toBe("true");
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

  test("lets ProseMirror handle events inside the item content", () => {
    const mousedown = vi.fn(() => true);
    const { editor } = render("* [ ] Hello\n", mousedown);

    editor
      .element(".prosemirror-remark-task-list-item-content p")
      .dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(mousedown).toHaveBeenCalledExactlyOnceWith(
      expect.anything(),
      expect.any(MouseEvent),
    );
  });

  test("stops ProseMirror from handling events on the checkbox", () => {
    const mousedown = vi.fn(() => true);
    const { editor } = render("* [ ] Hello\n", mousedown);

    editor
      .element("input")
      .dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(mousedown).not.toHaveBeenCalled();
  });
});
