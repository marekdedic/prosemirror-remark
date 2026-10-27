import type { ResolvedPos, Schema } from "prosemirror-model";

import { type Command, Plugin, Selection } from "prosemirror-state";
import {
  DecorationSet,
  type EditorView,
  type NodeView,
} from "prosemirror-view";
import { describe, expect, onTestFinished, test, vi } from "vitest";

import { ListItemExtension } from "../../src/syntax-extensions/ListItemExtension";
import { TaskListItemExtension } from "../../src/syntax-extensions/TaskListItemExtension";
import { UnorderedListExtension } from "../../src/syntax-extensions/UnorderedListExtension";
import { type NodeViewFixture, renderNodeView } from "../utils/node-view";

class TopLevelCursor extends Selection {
  public constructor($pos: ResolvedPos) {
    super($pos, $pos);
  }

  public eq(other: Selection): boolean {
    return other === this;
  }

  public map(): Selection {
    return this;
  }

  public toJSON(): object {
    return { head: this.head };
  }
}

function fakeView(view: object): EditorView {
  return {
    editable: true,
    endOfTextblock: (): boolean => true,
    root: document,
    ...view,
  } as unknown as EditorView;
}

function inIframe(markdown: string): {
  iframeDocument: Document;
  nodeView: NodeView;
} {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  onTestFinished(() => {
    iframe.remove();
  });
  const iframeDocument = (iframe.contentWindow as unknown as typeof window)
    .document;
  const view = { dom: iframeDocument.body } as unknown as EditorView;
  const createNodeView = new TaskListItemExtension().proseMirrorNodeView();
  if (createNodeView === null) {
    throw new Error("TaskListItemExtension provides no node view");
  }
  const nodeView = createNodeView(
    render(markdown).editor.doc.child(0).child(0),
    view,
    () => 1,
    [],
    DecorationSet.empty,
  );
  return { iframeDocument, nodeView };
}

function input(fx: NodeViewFixture): HTMLInputElement {
  return fx.editor.element("input") as HTMLInputElement;
}

function keymap(fx: NodeViewFixture): Record<string, Command> {
  return new TaskListItemExtension().proseMirrorKeymap(
    fx.editor.state.schema as Schema<string, string>,
  );
}

function press(
  fx: NodeViewFixture,
  key: string,
  modifiers: KeyboardEventInit = {},
  target: Element = fx.editor.element("input"),
): boolean {
  return target.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key,
      ...modifiers,
    }),
  );
}

function render(
  markdown: string,
  editorProps: {
    editable?(): boolean;
    handleDOMEvents?: {
      mousedown(view: EditorView, event: MouseEvent): boolean;
    };
    plugins?: Array<Plugin>;
  } = {},
): NodeViewFixture {
  return renderNodeView(
    new TaskListItemExtension(),
    markdown,
    [new UnorderedListExtension(), new ListItemExtension()],
    editorProps,
  );
}

function setEditable(fx: NodeViewFixture, editable: boolean): void {
  fx.editor.command((_state, _dispatch, view) => {
    view?.setProps({ editable: () => editable });
    return true;
  });
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

  test("labels each checkbox by its own item's content", () => {
    const { editor } = render("* [ ] Hello\n* [x] World\n");

    expect(
      editor.elements("input").map((checkbox) => {
        const labels = editor.elements(
          `[id="${checkbox.getAttribute("aria-labelledby") ?? ""}"]`,
        );
        return labels.length === 1
          ? [
              labels[0].className,
              labels[0].textContent,
              checkbox.closest("li")?.contains(labels[0]),
            ]
          : null;
      }),
    ).toStrictEqual([
      ["prosemirror-remark-task-list-item-content", "Hello", true],
      ["prosemirror-remark-task-list-item-content", "World", true],
    ]);
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

  test("keeps the focused checkbox when it's toggled", () => {
    const fx = render("* [ ] Hello\n");
    const checkbox = input(fx);
    checkbox.focus();

    fx.editor.click(checkbox);

    expect(input(fx)).toBe(checkbox);
    expect(document.activeElement).toBe(checkbox);
    expect(checkbox.checked).toBe(true);

    fx.editor.click(checkbox);

    expect(fx.markdown()).toBe("* [ ] Hello");
    expect(document.activeElement).toBe(checkbox);
  });

  test.each([
    [true, "checked", "true"],
    [false, null, "false"],
  ])(
    "follows the checked state set elsewhere to %s",
    (checked, attribute, data) => {
      const fx = render(checked ? "* [ ] Hello\n" : "* [x] Hello\n");
      fx.editor.command((state, dispatch) => {
        dispatch?.(state.tr.setNodeAttribute(1, "checked", checked));
        return true;
      });

      expect(input(fx).checked).toBe(checked);
      expect(input(fx).getAttribute("checked")).toBe(attribute);
      expect(fx.editor.element("li").getAttribute("data-checked")).toBe(data);
    },
  );

  test("follows the spread set elsewhere", () => {
    const fx = render("* [ ] Hello\n");
    fx.editor.command((state, dispatch) => {
      dispatch?.(state.tr.setNodeAttribute(1, "spread", true));
      return true;
    });

    expect(fx.editor.element("li").getAttribute("data-spread")).toBe("true");
  });

  test("is replaced when the item stops being a task item", () => {
    const fx = render("* [ ] Hello\n");
    fx.editor.command((state, dispatch) => {
      dispatch?.(
        state.tr.setNodeMarkup(1, state.schema.nodes["regular_list_item"]),
      );
      return true;
    });

    expect(fx.editor.elements("input")).toHaveLength(0);
    expect(fx.editor.element("li").className).toBe("");
  });

  test("lets the browser toggle the checkbox to the item's new state", () => {
    const fx = render("* [ ] Hello\n");

    expect(fx.editor.click("input")).toBe(false);
    expect(input(fx).checked).toBe(true);
  });

  test("keeps the checkbox's state when the transaction is filtered out", () => {
    const fx = render("* [ ] Hello\n", {
      plugins: [new Plugin({ filterTransaction: (): boolean => false })],
    });

    fx.editor.click("input");

    expect(input(fx).checked).toBe(false);
    expect(fx.markdown()).toBe("* [ ] Hello");
  });

  test("disables the checkbox in a read-only editor", () => {
    expect(
      input(render("* [ ] Hello\n", { editable: () => false })).disabled,
    ).toBe(true);
  });

  test("enables the checkbox in an editable editor", () => {
    expect(input(render("* [ ] Hello\n")).disabled).toBe(false);
  });

  test.each([
    [false, true],
    [true, false],
  ])(
    "follows the editor's editable prop when it changes to %s",
    async (editable, disabled) => {
      expect.assertions(1);

      const fx = render("* [ ] Hello\n", { editable: () => !editable });
      setEditable(fx, editable);
      await Promise.resolve();

      expect(input(fx).disabled).toBe(disabled);
    },
  );

  test("stops following the editor's editable prop when destroyed", () => {
    const observe = vi.spyOn(MutationObserver.prototype, "observe");
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    render("* [ ] Hello\n").editor.destroy();
    const observer =
      observe.mock.contexts[
        observe.mock.calls.findIndex(
          ([, options]) =>
            options?.attributeFilter?.includes("contenteditable") === true,
        )
      ];

    expect(observer).toBeDefined();
    expect(disconnect.mock.contexts).toContain(observer);
  });

  test("clicking the checkbox does nothing in a read-only editor", () => {
    const fx = render("* [ ] Hello\n");
    setEditable(fx, false);

    expect(fx.editor.click("input")).toBe(true);
    expect(fx.markdown()).toBe("* [ ] Hello");
    expect(fx.editor.element("li").getAttribute("data-checked")).toBe("false");
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

    expect(editor.click(checkbox)).toBe(true);
    expect((checkbox as HTMLInputElement).checked).toBe(false);
    expect(editor.doc.eq(docAfterDelete)).toBe(true);
  });

  test("lets ProseMirror handle events inside the item content", () => {
    const mousedown = vi.fn(() => true);
    const { editor } = render("* [ ] Hello\n", {
      handleDOMEvents: { mousedown },
    });

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
    const { editor } = render("* [ ] Hello\n", {
      handleDOMEvents: { mousedown },
    });

    editor
      .element("input")
      .dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(mousedown).not.toHaveBeenCalled();
  });

  test.each([{ ctrlKey: true }, { shiftKey: true }, {}])(
    "`Enter` (%o) on the checkbox doesn't submit an enclosing form",
    (modifiers) => {
      const fx = render("* [ ] Hello\n");

      expect(press(fx, "Enter", modifiers)).toBe(false);
      expect(fx.markdown()).toBe("* [ ] Hello");
    },
  );

  test.each([" ", "Tab", "a"])(
    "lets the browser handle `%j` on the checkbox",
    (key) => {
      expect(press(render("* [ ] Hello\n"), key)).toBe(true);
    },
  );

  test("creates its elements in the editor's document, e.g. an iframe", () => {
    const { iframeDocument, nodeView } = inIframe("* [ ] Hello\n");

    expect(nodeView.dom.ownerDocument).toBe(iframeDocument);
    expect(nodeView.contentDOM?.ownerDocument).toBe(iframeDocument);
    expect(nodeView.dom.querySelector("input")?.ownerDocument).toBe(
      iframeDocument,
    );
  });

  test("stops ProseMirror from handling events on the checkbox in another window, e.g. an iframe", () => {
    const { iframeDocument, nodeView } = inIframe("* [ ] Hello\n");
    const checkbox = nodeView.dom.querySelector("input");
    const event = new (
      iframeDocument.defaultView as unknown as typeof window
    ).MouseEvent("mousedown", { bubbles: true });
    checkbox?.dispatchEvent(event);

    expect(nodeView.stopEvent?.(event)).toBe(true);
  });

  test("`ArrowLeft` at the start of the item focuses the checkbox", () => {
    const fx = render("Hi\n\n* [ ] Hello\n");
    fx.editor.setSelection(7);

    fx.editor.type("{ArrowLeft}");

    expect(document.activeElement).toBe(input(fx));
  });

  test("`ArrowLeft` at the start of a nested item focuses its own checkbox", () => {
    const fx = render("* [ ] Hello\n  * [ ] World\n");
    fx.editor.setSelection(12);

    fx.editor.type("{ArrowLeft}");

    expect(document.activeElement).toBe(fx.editor.elements("input")[1]);
  });

  test.each([
    ["elsewhere in the text", "* [ ] Hello\n", 4],
    ["at the start of a later paragraph", "* [ ] Hello\n\n  World\n", 10],
    ["at the start of a regular item", "* Hello\n", 3],
  ])("`ArrowLeft` %s does not focus the checkbox", (_, markdown, pos) => {
    const fx = render(markdown);
    fx.editor.setSelection(pos);

    expect(fx.editor.command(keymap(fx)["ArrowLeft"])).toBe(false);
    expect(document.activeElement?.tagName).not.toBe("INPUT");
  });

  test("`ArrowLeft` with a selection does not focus the checkbox", () => {
    const fx = render("* [ ] Hello\n");
    fx.editor.setSelection({ anchor: 5, head: 3 });

    expect(fx.editor.command(keymap(fx)["ArrowLeft"])).toBe(false);
    expect(document.activeElement).not.toBe(input(fx));
  });

  test("`ArrowLeft` does not focus the checkbox in a read-only editor", () => {
    const fx = render("* [ ] Hello\n", { editable: () => false });
    fx.editor.setSelection(3);

    expect(fx.editor.command(keymap(fx)["ArrowLeft"])).toBe(false);
    expect(document.activeElement).not.toBe(input(fx));
  });

  test("`ArrowLeft` does not apply when the checkbox can't take focus", () => {
    const fx = render("* [ ] Hello\n");
    input(fx).disabled = true;
    fx.editor.setSelection(3);

    expect(fx.editor.command(keymap(fx)["ArrowLeft"])).toBe(false);
  });

  test("`ArrowLeft` does not report itself applicable for a disabled checkbox", () => {
    const fx = render("* [ ] Hello\n");
    fx.editor.setSelection(3);
    const item = fx.editor.element("li");
    input(fx).disabled = true;
    const view = fakeView({ nodeDOM: (): Node => item });
    const { ArrowLeft: arrowLeft } = keymap(fx);

    expect(arrowLeft(fx.editor.state, undefined, view)).toBe(false);
  });

  test("`ArrowLeft` does not apply without a DOM node for the item", () => {
    const fx = render("* [ ] Hello\n");
    fx.editor.setSelection(3);
    const view = fakeView({ nodeDOM: (): null => null });
    const { ArrowLeft: arrowLeft } = keymap(fx);

    expect(arrowLeft(fx.editor.state, () => undefined, view)).toBe(false);
  });

  test("`ArrowLeft` does not apply when the item has no checkbox", () => {
    const fx = render("* [ ] Hello\n");
    fx.editor.setSelection(3);
    const view = fakeView({
      nodeDOM: (): Node => document.createElement("li"),
    });
    const { ArrowLeft: arrowLeft } = keymap(fx);

    expect(arrowLeft(fx.editor.state, () => undefined, view)).toBe(false);
  });

  test("`ArrowRight` does not focus the checkbox where it wouldn't leave the text", () => {
    const fx = render("* [ ] Hello\n");
    fx.editor.setSelection(3);
    const view = fakeView({
      endOfTextblock: (): boolean => false,
      nodeDOM: (): Node => fx.editor.element("li"),
    });
    const { ArrowRight: arrowRight } = keymap(fx);

    expect(arrowRight(fx.editor.state, () => undefined, view)).toBe(false);
    expect(document.activeElement).not.toBe(input(fx));
  });

  test("`ArrowLeft` applies without focusing the checkbox when not dispatching", () => {
    const fx = render("* [ ] Hello\n");
    fx.editor.setSelection(3);
    const view = fakeView({ nodeDOM: (): Node => fx.editor.element("li") });
    const { ArrowLeft: arrowLeft } = keymap(fx);

    expect(arrowLeft(fx.editor.state, undefined, view)).toBe(true);
    expect(document.activeElement).not.toBe(input(fx));
  });

  test.each([
    ["ltr", "ArrowLeft", true],
    ["ltr", "ArrowRight", false],
    ["rtl", "ArrowLeft", false],
    ["rtl", "ArrowRight", true],
  ])(
    "in an empty %s item, `%s` focuses the checkbox: %s",
    (direction, key, focuses) => {
      const fx = render("* [ ] Hello\n");
      fx.editor.command((state, dispatch) => {
        dispatch?.(state.tr.delete(3, 8));
        return true;
      });
      input(fx).parentElement?.style.setProperty("direction", direction);
      fx.editor.setSelection(3);

      expect(fx.editor.command(keymap(fx)[key])).toBe(focuses);
      expect(document.activeElement === input(fx)).toBe(focuses);
    },
  );

  test("`ArrowLeft` focuses a checkbox inside a shadow root", () => {
    const fx = render("* [ ] Hello\n");
    fx.editor.setSelection(3);
    const host = document.createElement("div");
    document.body.appendChild(host);
    onTestFinished(() => {
      host.remove();
    });
    const root = host.attachShadow({ mode: "open" });
    const item = document.createElement("li");
    const container = document.createElement("span");
    container.className = "prosemirror-remark-task-list-item-checkbox";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    container.appendChild(checkbox);
    item.appendChild(container);
    root.appendChild(item);
    const view = fakeView({ nodeDOM: (): Node => item, root });
    const { ArrowLeft: arrowLeft } = keymap(fx);

    expect(arrowLeft(fx.editor.state, () => undefined, view)).toBe(true);
    expect(root.activeElement).toBe(checkbox);
  });

  test("`ArrowRight` on the checkbox moves to the start of the text", () => {
    const fx = render("Hi\n\n* [ ] Hello\n");
    input(fx).focus();

    expect(press(fx, "ArrowRight")).toBe(false);
    expect(fx.editor.state.selection.from).toBe(7);
    expect(fx.editor.state.selection.empty).toBe(true);
    expect(document.activeElement).not.toBe(input(fx));
  });

  test("`ArrowLeft` on the checkbox moves to the end of the previous block", () => {
    const fx = render("Hi\n\n* [ ] Hello\n");
    input(fx).focus();

    expect(press(fx, "ArrowLeft")).toBe(false);
    expect(fx.editor.state.selection.from).toBe(3);
    expect(document.activeElement).not.toBe(input(fx));
  });

  test("`ArrowLeft` on a nested checkbox moves to the end of the parent item's text", () => {
    const fx = render("* [ ] Hello\n  * [ ] World\n");
    const nested = fx.editor.elements("input")[1];
    nested.focus();

    expect(press(fx, "ArrowLeft", {}, nested)).toBe(false);
    expect(fx.editor.state.selection.from).toBe(8);
  });

  test("`ArrowLeft` on the checkbox without a previous block keeps the focus", () => {
    const fx = render("* [ ] Hello\n");
    input(fx).focus();
    const before = fx.editor.state.selection;

    expect(press(fx, "ArrowLeft")).toBe(true);
    expect(document.activeElement).toBe(input(fx));
    expect(fx.editor.state.selection.eq(before)).toBe(true);
  });

  test.each([
    ["ArrowLeft", true],
    ["ArrowRight", false],
  ])(
    "in right-to-left text, `%s` on the checkbox moves to the text: %s",
    (key, toText) => {
      const fx = render("Hi\n\n* [ ] Hello\n");
      input(fx).parentElement?.style.setProperty("direction", "rtl");
      input(fx).focus();

      expect(press(fx, key)).toBe(false);
      expect(fx.editor.state.selection.from).toBe(toText ? 7 : 3);
    },
  );

  test.each([
    ["ArrowLeft", { shiftKey: true }],
    ["ArrowRight", { altKey: true }],
    ["ArrowRight", { ctrlKey: true }],
    ["ArrowLeft", { metaKey: true }],
    ["ArrowUp", { shiftKey: true }],
    ["ArrowDown", { ctrlKey: true }],
  ])("lets the browser handle `%s` %o on the checkbox", (key, modifiers) => {
    const fx = render("Hi\n\n* [ ] Hello\n");
    input(fx).focus();

    expect(press(fx, key, modifiers)).toBe(true);
    expect(document.activeElement).toBe(input(fx));
  });

  test("arrow keys on the checkbox do nothing when the node has no position in the document", () => {
    const fx = render("* [ ] Hello\n");
    const checkbox = input(fx);
    fx.editor.command((state, dispatch) => {
      dispatch?.(state.tr.delete(0, state.doc.content.size));
      return true;
    });
    const selectionAfterDelete = fx.editor.state.selection;

    expect(press(fx, "ArrowRight", {}, checkbox)).toBe(true);
    expect(fx.editor.state.selection.eq(selectionAfterDelete)).toBe(true);
  });

  test("`ArrowDown` on the checkbox moves to the start of the text", () => {
    const fx = render("Hi\n\n* [ ] Hello\n");
    input(fx).focus();

    expect(press(fx, "ArrowDown")).toBe(false);
    expect(fx.editor.state.selection.from).toBe(7);
    expect(document.activeElement).not.toBe(input(fx));
  });

  test("`ArrowUp` on the checkbox moves to the end of the previous block", () => {
    const fx = render("Hi\n\n* [ ] Hello\n");
    input(fx).focus();

    expect(press(fx, "ArrowUp")).toBe(false);
    expect(fx.editor.state.selection.from).toBe(3);
    expect(document.activeElement).not.toBe(input(fx));
  });

  test("`ArrowUp` on the checkbox without a previous block keeps the focus", () => {
    const fx = render("* [ ] Hello\n");
    input(fx).focus();

    expect(press(fx, "ArrowUp")).toBe(true);
    expect(document.activeElement).toBe(input(fx));
  });

  test("`ArrowLeft` does not apply to a selection outside of a textblock", () => {
    const fx = render("* [ ] Hello\n");
    const $pos = fx.editor.state.doc.resolve(0);
    const state = fx.editor.state.apply(
      fx.editor.state.tr.setSelection(new TopLevelCursor($pos)),
    );
    const view = fakeView({ nodeDOM: (): Node => fx.editor.element("li") });
    const { ArrowLeft: arrowLeft } = keymap(fx);

    expect(arrowLeft(state, () => undefined, view)).toBe(false);
  });
});
