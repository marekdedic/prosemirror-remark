import { history, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { describe, expect, test, vi } from "vitest";

import { CodeBlockExtension } from "../../src/syntax-extensions/CodeBlockExtension";
import {
  LinkExtension,
  openLinkEditor,
} from "../../src/syntax-extensions/LinkExtension";
import { createTestProseMirrorUnified } from "../utils/fixture";
import {
  type NodeViewFixture,
  pasteText,
  pressKey,
  renderNodeView,
} from "../utils/node-view";

function control<T extends HTMLElement>(
  fx: NodeViewFixture,
  selector: string,
  elementType: new () => T,
): T {
  const element = popover(fx).querySelector(selector);
  if (!(element instanceof elementType)) {
    throw new Error(`The popover has no ${selector}`);
  }
  return element;
}

function hrefInput(fx: NodeViewFixture): HTMLInputElement {
  return control(
    fx,
    ".prosemirror-remark-link-editor-href > input",
    HTMLInputElement,
  );
}

function open(fx: NodeViewFixture): HTMLAnchorElement {
  return control(fx, ".prosemirror-remark-link-editor-open", HTMLAnchorElement);
}

function popover(fx: NodeViewFixture): HTMLElement {
  return fx.view.dom.nextElementSibling as HTMLElement;
}

function removeButton(fx: NodeViewFixture): HTMLButtonElement {
  return control(
    fx,
    ".prosemirror-remark-link-editor-remove",
    HTMLButtonElement,
  );
}

function render(
  markdown: string,
  selection: { anchor: number; head: number } | number,
  editorProps: { editable?(): boolean } = {},
  extension = new LinkExtension(),
): NodeViewFixture {
  const fx = renderNodeView(extension, markdown, [], {
    ...editorProps,
    plugins: [history(), keymap({ "Mod-z": undo })],
  });
  fx.view.focus();
  fx.editor.setSelection(selection);
  return fx;
}

function selectionOf(view: EditorView): [number, number] {
  return [view.state.selection.from, view.state.selection.to];
}

function titleInput(fx: NodeViewFixture): HTMLInputElement {
  return control(
    fx,
    ".prosemirror-remark-link-editor-title > input",
    HTMLInputElement,
  );
}

function type(field: HTMLInputElement, value: string): void {
  field.value = value;
  field.dispatchEvent(new InputEvent("input", { bubbles: true }));
}

describe("LinkEditorView", () => {
  describe("rendering", () => {
    test("renders the popover after the editor", () => {
      const fx = render("a [link](https://a.test) b\n", 5);

      expect(popover(fx).className).toBe("prosemirror-remark-link-editor");
      expect(popover(fx).getAttribute("role")).toBe("group");
      expect(popover(fx).getAttribute("aria-label")).toBe("Link");
    });

    test("labels the fields", () => {
      const fx = render("a [link](https://a.test) b\n", 5);

      expect(
        Array.from(popover(fx).querySelectorAll("label"), (label) => [
          label.className,
          label.textContent,
        ]),
      ).toStrictEqual([
        ["prosemirror-remark-link-editor-href", "URL:"],
        ["prosemirror-remark-link-editor-title", "Title:"],
      ]);
    });

    test("shows the URL and title of the link at the caret", () => {
      const fx = render('a [link](https://a.test "T") b\n', 5);

      expect(popover(fx).hidden).toBe(false);
      expect(hrefInput(fx).value).toBe("https://a.test");
      expect(titleInput(fx).value).toBe("T");
    });

    test("shows a title's line endings as spaces", () => {
      const fx = render('a [link](https://a.test "a\nb") b\n', 5);

      expect(titleInput(fx).value).toBe("a b");
    });

    test("doesn't take the focus when it shows", () => {
      const fx = render("a [link](https://a.test) b\n", 5);

      expect(fx.view.hasFocus()).toBe(true);
    });

    test("follows the caret from link to link", () => {
      const fx = render("[one](https://a.test) [two](https://b.test)\n", 2);
      fx.editor.setSelection(6);

      expect(hrefInput(fx).value).toBe("https://b.test");
    });

    test("is hidden outside a link", () => {
      expect(popover(render("a [link](https://a.test) b\n", 2)).hidden).toBe(
        true,
      );
    });

    test("is hidden at a caret right after a link", () => {
      expect(popover(render("a [link](https://a.test) b\n", 7)).hidden).toBe(
        true,
      );
    });

    test("hides when the caret leaves the link", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      fx.editor.setSelection(9);

      expect(popover(fx).hidden).toBe(true);
    });

    test("hides when the editor loses the focus", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      fx.view.dom.blur();

      expect(popover(fx).hidden).toBe(true);
    });

    test("is hidden in a read-only editor", () => {
      expect(
        popover(
          render("a [link](https://a.test) b\n", 5, { editable: () => false }),
        ).hidden,
      ).toBe(true);
    });

    test("stays visible while one of its fields has the focus", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      titleInput(fx).focus();

      expect(popover(fx).hidden).toBe(false);
    });

    test("is removed with the editor", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      const element = popover(fx);
      fx.view.destroy();

      expect(element.isConnected).toBe(false);
    });

    test("is added when the editor is put in the page after it's created", () => {
      const pmu = createTestProseMirrorUnified(new LinkExtension());
      const view = new EditorView(null, {
        state: EditorState.create({
          doc: pmu.parse("a [link](https://a.test) b\n"),
          plugins: pmu.plugins(),
        }),
      });
      document.body.appendChild(view.dom);
      view.focus();
      view.dispatch(
        view.state.tr.setSelection(TextSelection.create(view.state.doc, 5)),
      );

      expect(view.dom.nextElementSibling?.className).toBe(
        "prosemirror-remark-link-editor",
      );
      expect(view.dom.nextElementSibling?.hasAttribute("hidden")).toBe(false);

      view.destroy();
      view.dom.remove();
    });

    test("follows the link when a container scrolls", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      vi.spyOn(popover(fx), "getBoundingClientRect").mockReturnValue(
        new DOMRect(0, 0, 100, 30),
      );
      vi.spyOn(fx.view, "coordsAtPos").mockReturnValue({
        bottom: 50,
        left: 0,
        right: 0,
        top: 40,
      });
      document.body.dispatchEvent(new Event("scroll"));

      expect(
        popover(fx).style.getPropertyValue(
          "--prosemirror-remark-link-editor-y",
        ),
      ).toBe("10px");
    });

    test("is placed below the link without room above it", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      vi.spyOn(popover(fx), "getBoundingClientRect").mockReturnValue(
        new DOMRect(0, 0, 100, 30),
      );
      vi.spyOn(fx.view, "coordsAtPos").mockReturnValue({
        bottom: 30,
        left: 0,
        right: 0,
        top: 20,
      });
      document.body.dispatchEvent(new Event("scroll"));

      expect(
        popover(fx).style.getPropertyValue(
          "--prosemirror-remark-link-editor-y",
        ),
      ).toBe("30px");
    });

    test("is placed below the link without room above it in a scrolled container", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      const container = document.createElement("div");
      container.style.overflowY = "auto";
      fx.view.dom.replaceWith(container);
      container.appendChild(fx.view.dom);
      fx.view.dispatch(fx.view.state.tr);
      vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
        new DOMRect(0, 100, 500, 300),
      );
      vi.spyOn(popover(fx), "getBoundingClientRect").mockReturnValue(
        new DOMRect(0, 0, 100, 30),
      );
      vi.spyOn(fx.view, "coordsAtPos").mockReturnValue({
        bottom: 130,
        left: 0,
        right: 0,
        top: 110,
      });
      document.body.dispatchEvent(new Event("scroll"));

      expect(
        popover(fx).style.getPropertyValue(
          "--prosemirror-remark-link-editor-y",
        ),
      ).toBe("130px");
    });

    test("hides while the link is scrolled out of the editor", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      fx.view.dom.style.overflowY = "auto";
      vi.spyOn(fx.view.dom, "getBoundingClientRect").mockReturnValue(
        new DOMRect(0, 100, 500, 100),
      );
      vi.spyOn(fx.view.dom, "clientHeight", "get").mockReturnValue(100);
      vi.spyOn(fx.view.dom, "clientWidth", "get").mockReturnValue(500);
      const coords = vi.spyOn(fx.view, "coordsAtPos").mockReturnValue({
        bottom: 320,
        left: 10,
        right: 10,
        top: 300,
      });
      document.body.dispatchEvent(new Event("scroll"));

      expect(popover(fx).hidden).toBe(true);

      coords.mockReturnValue({ bottom: 170, left: 10, right: 10, top: 150 });
      document.body.dispatchEvent(new Event("scroll"));

      expect(popover(fx).hidden).toBe(false);
    });

    test("isn't rendered with the editor turned off", () => {
      const fx = render(
        "a [link](https://a.test) b\n",
        5,
        {},
        new LinkExtension({ editor: false }),
      );

      expect(fx.view.dom.nextElementSibling).toBeNull();
      expect(fx.editor.command(openLinkEditor())).toBe(false);
    });
  });

  describe("editing a link", () => {
    test("changes the URL as it's typed", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      type(hrefInput(fx), "https://b.test");

      expect(fx.markdown()).toBe("a [link](https://b.test) b");
    });

    test("changes the title as it's typed", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      type(titleInput(fx), "T");

      expect(fx.markdown()).toBe('a [link](https://a.test "T") b');
    });

    test("removes an emptied title", () => {
      const fx = render('a [link](https://a.test "T") b\n', 5);
      type(titleInput(fx), "");

      expect(fx.markdown()).toBe("a [link](https://a.test) b");
    });

    test("keeps a link with an emptied URL", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      type(hrefInput(fx), "");

      expect(fx.markdown()).toBe("a [link]() b");
    });

    test("keeps a typed trailing space in the field without saving it", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      type(hrefInput(fx), "https://b.test ");

      expect(hrefInput(fx).value).toBe("https://b.test ");
      expect(fx.markdown()).toBe("a [link](https://b.test) b");
    });

    test("removes leading whitespace from the URL", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      type(hrefInput(fx), " https://b.test");

      expect(hrefInput(fx).value).toBe("https://b.test");
    });

    test("trims a pasted URL", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      hrefInput(fx).select();
      pasteText(hrefInput(fx), "  https://b.test\n");

      expect(hrefInput(fx).value).toBe("https://b.test");
      expect(fx.markdown()).toBe("a [link](https://b.test) b");
    });

    test("pastes a title's line endings as spaces", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      pasteText(titleInput(fx), "a\nb");

      expect(fx.markdown()).toBe('a [link](https://a.test "a b") b');
    });

    test("keeps the text of a link whose text is its URL", () => {
      const fx = render("a <https://a.test> b\n", 5);
      type(hrefInput(fx), "https://b.test");

      expect(fx.markdown()).toBe("a [https://a.test](https://b.test) b");
    });

    test("doesn't change the text of a selection as its URL is typed", () => {
      const fx = render("a README b\n", { anchor: 3, head: 9 });
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "README");
      type(hrefInput(fx), "README.md");

      expect(fx.markdown()).toBe("a [README](README.md) b");
    });

    test("inserts an email URL as its address", () => {
      const fx = render("a  b\n", 3);
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "mailto:c");
      type(hrefInput(fx), "mailto:c@d.test");

      expect(fx.markdown()).toBe("a <c@d.test> b");
    });

    test("changes only the title of a link whose text is its URL", () => {
      const fx = render("a <https://a.test> b\n", 5);
      type(titleInput(fx), "T");

      expect(fx.markdown()).toBe('a [https://a.test](https://a.test "T") b');
      expect(selectionOf(fx.view)).toStrictEqual([5, 5]);
    });

    test("keeps the missing URL of an unresolved reference when the title is typed", () => {
      const fx = render("a link b\n", 5);
      const { link } = fx.view.state.schema.marks;
      fx.view.dispatch(
        fx.view.state.tr.addMark(3, 7, link.create({ href: null })),
      );
      type(titleInput(fx), "T");

      expect({ ...fx.view.state.doc.nodeAt(3)?.marks[0].attrs }).toStrictEqual({
        href: null,
        title: "T",
      });
    });

    test("updates the fields after an undo", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      type(hrefInput(fx), "https://b.test");
      pressKey(hrefInput(fx), "z", { ctrlKey: true });

      expect(fx.markdown()).toBe("a [link](https://a.test) b");
      expect(hrefInput(fx).value).toBe("https://a.test");
    });

    test("undoes in the editor's history, not the field's", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      type(hrefInput(fx), "https://b.test");

      expect(pressKey(hrefInput(fx), "z", { ctrlKey: true })).toBe(false);
    });
  });

  describe("adding a link", () => {
    test("opens on `Mod-k` with the URL field focused", () => {
      const fx = render("a link b\n", { anchor: 3, head: 7 });

      expect(fx.editor.command(openLinkEditor())).toBe(true);
      expect(popover(fx).hidden).toBe(false);
      expect(document.activeElement).toBe(hrefInput(fx));
      expect(hrefInput(fx).value).toBe("");
    });

    test("selects the URL when opened on a link", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      fx.editor.command(openLinkEditor());

      expect([
        hrefInput(fx).selectionStart,
        hrefInput(fx).selectionEnd,
      ]).toStrictEqual([0, 14]);
    });

    test("adds the link over the selection on the first edit", () => {
      const fx = render("a link b\n", { anchor: 3, head: 7 });
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "h");

      expect(fx.markdown()).toBe("a [link](h) b");
      expect(selectionOf(fx.view)).toStrictEqual([3, 7]);

      type(hrefInput(fx), "https://a.test");

      expect(fx.markdown()).toBe("a [link](https://a.test) b");
    });

    test("leaves the document unchanged when closed without an edit", () => {
      const fx = render("a link b\n", { anchor: 3, head: 7 });
      fx.editor.command(openLinkEditor());
      pressKey(hrefInput(fx), "Escape");

      expect(fx.markdown()).toBe("a link b");
      expect(fx.view.hasFocus()).toBe(true);
      expect(selectionOf(fx.view)).toStrictEqual([3, 7]);
      expect(popover(fx).hidden).toBe(true);
    });

    test("inserts the URL as a link at an empty caret", () => {
      const fx = render("a  b\n", 3);
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "h");
      type(hrefInput(fx), "https://a.test");

      expect(fx.markdown()).toBe("a <https://a.test> b");
    });

    test("puts the caret after an inserted link when closed", () => {
      const fx = render("a  b\n", 3);
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "https://a.test");
      pressKey(hrefInput(fx), "Enter");

      expect(fx.view.hasFocus()).toBe(true);
      expect(selectionOf(fx.view)).toStrictEqual([17, 17]);
    });

    test("removes an inserted link when its URL is cleared, and keeps the focus", () => {
      const fx = render("a  b\n", 3);
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "h");
      type(hrefInput(fx), "");

      expect(fx.markdown()).toBe("a  b");
      expect(popover(fx).hidden).toBe(false);
      expect(document.activeElement).toBe(hrefInput(fx));

      type(hrefInput(fx), "x");

      expect(fx.markdown()).toBe("a [x](x) b");
    });

    test("disables the title at an empty caret until there's a link", () => {
      const fx = render("a  b\n", 3);
      fx.editor.command(openLinkEditor());

      expect(titleInput(fx).disabled).toBe(true);

      type(hrefInput(fx), "https://a.test");

      expect(titleInput(fx).disabled).toBe(false);
    });

    test("keeps changing an inserted URL that merged with an identical link", () => {
      const fx = render("[x](https://a.test) b\n", 2);
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "https://a.tes");
      type(hrefInput(fx), "https://a.test");

      expect(fx.markdown()).toBe("[xhttps://a.test](https://a.test) b");

      type(hrefInput(fx), "https://b.test");

      expect(fx.markdown()).toBe("[x](https://a.test)<https://b.test> b");
      expect(hrefInput(fx).value).toBe("https://b.test");
    });

    test("removes only an inserted URL that merged with an identical link", () => {
      const fx = render("[x](https://a.test) b\n", 2);
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "https://a.test");
      type(hrefInput(fx), "");

      expect(fx.markdown()).toBe("[x](https://a.test) b");
      expect(document.activeElement).toBe(hrefInput(fx));
    });

    test("unlinks only an inserted URL that merged with an identical link", () => {
      const fx = render("[x](https://a.test) b\n", 2);
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "https://a.test");
      removeButton(fx).click();

      expect(fx.markdown()).toBe("[x](https://a.test)https://a.test b");
      expect(fx.view.hasFocus()).toBe(true);
    });

    test("sets the title of only an inserted URL that merged with an identical link", () => {
      const fx = render("[x](https://a.test) b\n", 2);
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "https://a.test");
      pressKey(hrefInput(fx), "ArrowDown");
      type(titleInput(fx), "T");

      expect(fx.markdown()).toBe(
        '[x](https://a.test)[https://a.test](https://a.test "T") b',
      );
    });

    test("keeps changing an inserted URL after switching windows", () => {
      const fx = render("[x](https://a.test) b\n", 2);
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "https://a.test");
      const hasFocus = vi.spyOn(document, "hasFocus").mockReturnValue(false);
      hrefInput(fx).blur();
      hasFocus.mockRestore();

      expect(popover(fx).hidden).toBe(false);

      hrefInput(fx).focus();
      type(hrefInput(fx), "https://b.test");

      expect(fx.markdown()).toBe("[x](https://a.test)<https://b.test> b");
    });

    test("keeps changing an inserted URL that merged with an identical autolink", () => {
      const fx = render("<https://a.test> b\n", 15);
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "https://a.test");
      type(hrefInput(fx), "https://b.test");

      expect(fx.markdown()).toBe("<https://a.test><https://b.test> b");
    });

    test("ends editing when the window is focused again elsewhere", () => {
      const fx = render("[x](https://a.test) b\n", 2);
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "https://a.test");
      const hasFocus = vi.spyOn(document, "hasFocus").mockReturnValue(false);
      hrefInput(fx).blur();
      hasFocus.mockRestore();
      window.dispatchEvent(new FocusEvent("focus"));

      expect(popover(fx).hidden).toBe(true);
    });

    test("keeps editing when the window is focused again in a shadow root", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      fx.editor.command(openLinkEditor());
      const field = hrefInput(fx);
      vi.spyOn(fx.view, "root", "get").mockReturnValue({
        activeElement: field,
      } as unknown as ShadowRoot);
      vi.spyOn(document, "activeElement", "get").mockReturnValue(document.body);
      window.dispatchEvent(new FocusEvent("focus"));

      expect(popover(fx).hidden).toBe(false);
    });

    test("edits the whole merged link once closed", () => {
      const fx = render("[x](https://a.test) b\n", 2);
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "https://a.test");
      pressKey(hrefInput(fx), "Enter");
      fx.editor.setSelection(3);
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "https://b.test");

      expect(fx.markdown()).toBe("[xhttps://a.test](https://b.test) b");
    });

    test("disables the title over a selection until there's a link", () => {
      const fx = render("a link b\n", { anchor: 3, head: 7 });
      fx.editor.command(openLinkEditor());

      expect(titleInput(fx).disabled).toBe(true);

      type(hrefInput(fx), "https://a.test");

      expect(titleInput(fx).disabled).toBe(false);
    });

    test("moves the focus to the URL when undoing the link disables the title", async () => {
      expect.assertions(5);

      const fx = render("a  b\n", 3);
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "https://a.test");
      pressKey(hrefInput(fx), "ArrowDown");
      pressKey(titleInput(fx), "z", { ctrlKey: true });

      expect(document.activeElement).toBe(titleInput(fx));

      await Promise.resolve();

      expect(fx.markdown()).toBe("a  b");
      expect(titleInput(fx).disabled).toBe(true);
      expect(document.activeElement).toBe(hrefInput(fx));
      expect(popover(fx).hidden).toBe(false);
    });

    test("adds a link over a selection across paragraphs", () => {
      const fx = render("abc\n\ndef\n", { anchor: 2, head: 7 });
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "h");
      type(hrefInput(fx), "htt");

      expect(fx.markdown()).toBe("a[bc](htt)\n\n[d](htt)ef");
      expect(hrefInput(fx).value).toBe("htt");
      expect(removeButton(fx).disabled).toBe(false);
    });

    test("returns the focus to the editor when an undo leaves nowhere to set a link", async () => {
      expect.assertions(3);

      const fx = renderNodeView(
        new LinkExtension(),
        "a  b\n\n```\ncode\n```\n",
        [new CodeBlockExtension()],
        { plugins: [history(), keymap({ "Mod-z": undo })] },
      );
      fx.view.focus();
      fx.editor.setSelection(8);
      fx.view.dispatch(fx.view.state.tr.insertText("x"));
      fx.editor.setSelection(3);
      fx.editor.command(openLinkEditor());
      pressKey(hrefInput(fx), "z", { ctrlKey: true });

      expect(document.activeElement).toBe(hrefInput(fx));

      await Promise.resolve();

      expect(fx.view.hasFocus()).toBe(true);
      expect(popover(fx).hidden).toBe(true);
    });

    test("doesn't open in a code block", () => {
      const fx = renderNodeView(new LinkExtension(), "```\ncode\n```\n", [
        new CodeBlockExtension(),
      ]);
      fx.view.focus();
      fx.editor.setSelection(3);

      expect(fx.editor.command(openLinkEditor())).toBe(false);
      expect(fx.view.hasFocus()).toBe(true);
    });

    test("gives up the focus when the editor is made read-only", () => {
      let editable = true;
      const fx = render(
        "a link b\n",
        { anchor: 3, head: 7 },
        {
          editable: () => editable,
        },
      );
      fx.editor.command(openLinkEditor());
      editable = false;
      fx.view.setProps({});

      expect(popover(fx).hidden).toBe(true);
      expect(document.activeElement).not.toBe(hrefInput(fx));

      editable = true;
      fx.view.setProps({});

      expect(popover(fx).hidden).toBe(true);
    });

    test("doesn't open in a read-only editor", () => {
      const fx = render("a link b\n", 3, { editable: () => false });

      expect(fx.editor.command(openLinkEditor())).toBe(false);
    });
  });

  describe("keys", () => {
    test("`Escape` returns the focus to the editor", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      hrefInput(fx).focus();

      expect(pressKey(hrefInput(fx), "Escape")).toBe(false);
      expect(fx.view.hasFocus()).toBe(true);
      expect(selectionOf(fx.view)).toStrictEqual([5, 5]);
    });

    test("`Enter` returns the focus to the editor", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      titleInput(fx).focus();

      expect(pressKey(titleInput(fx), "Enter")).toBe(false);
      expect(fx.view.hasFocus()).toBe(true);
    });

    test("`Shift-Enter` returns the focus to the editor", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      hrefInput(fx).focus();
      pressKey(hrefInput(fx), "Enter", { shiftKey: true });

      expect(fx.view.hasFocus()).toBe(true);
    });

    test("`Mod-k` returns the focus to the editor", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      hrefInput(fx).focus();

      expect(pressKey(hrefInput(fx), "k", { ctrlKey: true })).toBe(false);
      expect(fx.view.hasFocus()).toBe(true);
    });

    test("`Escape` on the remove button returns the focus to the editor", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      removeButton(fx).focus();
      pressKey(removeButton(fx), "Escape");

      expect(fx.view.hasFocus()).toBe(true);
    });

    test("`ArrowDown` moves from the URL to the title", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      hrefInput(fx).focus();
      pressKey(hrefInput(fx), "ArrowDown");

      expect(document.activeElement).toBe(titleInput(fx));
    });

    test("`ArrowUp` moves from the title to the URL", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      titleInput(fx).focus();
      pressKey(titleInput(fx), "ArrowUp");

      expect(document.activeElement).toBe(hrefInput(fx));
    });

    test("`Enter` doesn't submit a form", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      hrefInput(fx).focus();

      expect(pressKey(hrefInput(fx), "Enter")).toBe(false);
    });
  });

  describe("open", () => {
    test("links to an http URL", () => {
      const fx = render("a [link](https://a.test/x) b\n", 5);

      expect(open(fx).getAttribute("href")).toBe("https://a.test/x");
      expect(open(fx).getAttribute("target")).toBe("_blank");
      expect(open(fx).getAttribute("rel")).toBe("noopener noreferrer");
      expect(open(fx).hasAttribute("aria-disabled")).toBe(false);
    });

    test("links to a mailto URL", () => {
      expect(
        open(render("a [link](mailto:a@b.test) b\n", 5)).getAttribute("href"),
      ).toBe("mailto:a@b.test");
    });

    test("resolves a relative URL against the page", () => {
      expect(open(render("a [link](x/y) b\n", 5)).getAttribute("href")).toBe(
        new URL("x/y", document.baseURI).href,
      );
    });

    test("doesn't link to a javascript URL", () => {
      const fx = render("a [link](javascript:alert(1)) b\n", 5);

      expect(open(fx).hasAttribute("href")).toBe(false);
      expect(open(fx).getAttribute("aria-disabled")).toBe("true");
    });

    test("doesn't link to an empty URL", () => {
      expect(open(render("a [link]() b\n", 5)).hasAttribute("href")).toBe(
        false,
      );
    });
  });

  describe("remove", () => {
    test("removes the link and returns the focus", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      removeButton(fx).focus();
      removeButton(fx).click();

      expect(fx.markdown()).toBe("a link b");
      expect(fx.view.hasFocus()).toBe(true);
      expect(popover(fx).hidden).toBe(true);
    });

    test("doesn't take the focus from the editor when clicked", () => {
      const fx = render("a [link](https://a.test) b\n", 5);

      expect(
        removeButton(fx).dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
        ),
      ).toBe(false);
    });

    test("lets a field take the focus when clicked", () => {
      const fx = render("a [link](https://a.test) b\n", 5);

      expect(
        hrefInput(fx).dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
        ),
      ).toBe(true);
    });

    test("removes the links in a selection that isn't one link", () => {
      const fx = render("a [link](https://a.test) b\n", { anchor: 1, head: 5 });
      fx.editor.command(openLinkEditor());

      expect(removeButton(fx).disabled).toBe(false);

      removeButton(fx).click();

      expect(fx.markdown()).toBe("a li[nk](https://a.test) b");
    });

    test("moves the focus to the URL when an undo disables it", async () => {
      expect.assertions(2);

      const fx = render("a  b\n", 3);
      fx.editor.command(openLinkEditor());
      type(hrefInput(fx), "https://a.test");
      removeButton(fx).focus();
      pressKey(removeButton(fx), "z", { ctrlKey: true });
      await Promise.resolve();

      expect(removeButton(fx).disabled).toBe(true);
      expect(document.activeElement).toBe(hrefInput(fx));
    });

    test("is disabled without a link", () => {
      const fx = render("a link b\n", { anchor: 3, head: 7 });
      fx.editor.command(openLinkEditor());

      expect(removeButton(fx).disabled).toBe(true);
    });
  });

  describe("returning the focus", () => {
    test("keeps the selection the editor had", () => {
      const fx = render("a [link](https://a.test) b\n", 5);
      fx.view.dispatch(
        fx.view.state.tr.setSelection(
          TextSelection.create(fx.view.state.doc, 4, 6),
        ),
      );
      hrefInput(fx).focus();
      pressKey(hrefInput(fx), "Escape");

      expect(selectionOf(fx.view)).toStrictEqual([4, 6]);
    });
  });
});
