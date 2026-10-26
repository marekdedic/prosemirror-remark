import type { Schema } from "prosemirror-model";
import type { Command } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

import { describe, expect, test, vi } from "vitest";

import {
  CodeBlockExtension,
  setCodeBlockLanguage,
} from "../../src/syntax-extensions/CodeBlockExtension";
import { type NodeViewFixture, renderNodeView } from "../utils/node-view";

function fakeView(view: object): EditorView {
  return {
    editable: true,
    endOfTextblock: (): boolean => true,
    root: document,
    ...view,
  } as unknown as EditorView;
}

function input(fx: NodeViewFixture): HTMLInputElement {
  return fx.editor.element("input") as HTMLInputElement;
}

function keymap(fx: NodeViewFixture): Record<string, Command> {
  return new CodeBlockExtension().proseMirrorKeymap(
    fx.editor.state.schema as Schema<string, string>,
  );
}

function paste(fx: NodeViewFixture, text: string): boolean {
  const field = input(fx);
  const inserted = field.dispatchEvent(
    new InputEvent("beforeinput", {
      cancelable: true,
      data: text,
      inputType: "insertFromPaste",
    }),
  );
  if (inserted) {
    field.setRangeText(
      text,
      field.selectionStart ?? field.value.length,
      field.selectionEnd ?? field.value.length,
      "end",
    );
    field.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }
  return inserted;
}

function press(
  fx: NodeViewFixture,
  key: string,
  modifiers: KeyboardEventInit = {},
): boolean {
  return input(fx).dispatchEvent(
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
    handleKeyDown?(view: EditorView, event: KeyboardEvent): boolean;
  } = {},
): NodeViewFixture {
  return renderNodeView(new CodeBlockExtension(), markdown, [], editorProps);
}

function typeLanguage(fx: NodeViewFixture, value: string): void {
  input(fx).value = value;
  input(fx).dispatchEvent(new InputEvent("input", { bubbles: true }));
}

function typeText(fx: NodeViewFixture, data: string): boolean {
  return input(fx).dispatchEvent(
    new InputEvent("beforeinput", {
      cancelable: true,
      data,
      inputType: "insertText",
    }),
  );
}

describe("CodeBlockView", () => {
  test("renders the language", () => {
    const fx = render("```js\nHello\n```\n");

    expect(input(fx).value).toBe("js");
    expect(fx.editor.element("pre").getAttribute("data-language")).toBe("js");
    expect(fx.editor.element("code").className).toBe("language-js");
  });

  test("renders the meta", () => {
    expect(
      render("```js x=1\nHello\n```\n")
        .editor.element("pre")
        .getAttribute("data-meta"),
    ).toBe("x=1");
  });

  test("renders an empty field without a language", () => {
    const fx = render("```\nHello\n```\n");
    const pre = fx.editor.element("pre");

    expect(input(fx).value).toBe("");
    expect(pre.hasAttribute("data-language")).toBe(false);
    expect(pre.hasAttribute("data-meta")).toBe(false);
    expect(fx.editor.element("code").hasAttribute("class")).toBe(false);
  });

  test("renders the block with classes and without inline styles", () => {
    const fx = render("```js\nHello\n```\n");
    const pre = fx.editor.element("pre");

    expect(pre.className).toBe("prosemirror-remark-code-block");
    expect(input(fx).parentElement?.className).toBe(
      "prosemirror-remark-code-block-language",
    );
    expect(input(fx).parentElement?.tagName).toBe("LABEL");
    expect(
      fx.editor.element(".prosemirror-remark-code-block-language-label")
        .textContent,
    ).toBe("Language:");
    expect(pre.querySelectorAll("[style]")).toHaveLength(0);
    expect(pre.hasAttribute("style")).toBe(false);
  });

  test("lets the field's direction follow its content", () => {
    expect(input(render("```js\nHello\n```\n")).getAttribute("dir")).toBe(
      "auto",
    );
  });

  test("renders the field outside of the editable content", () => {
    const fx = render("```js\nHello\n```\n");

    expect(input(fx).parentElement?.getAttribute("contenteditable")).toBe(
      "false",
    );
    expect(fx.editor.element("code").contains(input(fx))).toBe(false);
  });

  test("adding a language", () => {
    const fx = render("```\nHello\n```\n");

    typeLanguage(fx, "js");

    expect(fx.markdown()).toBe("```js\nHello\n```");
    expect(fx.editor.element("pre").getAttribute("data-language")).toBe("js");
    expect(fx.editor.element("code").className).toBe("language-js");
  });

  test("changing the language keeps the meta", () => {
    const fx = render("```ts x=1\nHello\n```\n");

    typeLanguage(fx, "js");

    expect(fx.markdown()).toBe("```js x=1\nHello\n```");
  });

  test("removing the language keeps the meta, which Markdown can't carry", () => {
    const fx = render("```ts x=1\nHello\n```\n");

    typeLanguage(fx, "");

    expect(fx.markdown()).toBe("```\nHello\n```");
    expect(fx.editor.element("pre").getAttribute("data-meta")).toBe("x=1");
  });

  test("retyping the language keeps the meta", () => {
    const fx = render("```js x=1\nHello\n```\n");
    input(fx).focus();

    typeLanguage(fx, "j");
    typeLanguage(fx, "");
    typeLanguage(fx, "t");
    typeLanguage(fx, "ts");

    expect(fx.markdown()).toBe("```ts x=1\nHello\n```");
  });

  test("retyping a language set without normalisation changes nothing", () => {
    const fx = render("```js\nHello\n```\n");
    fx.editor.command((state, dispatch) => {
      dispatch?.(state.tr.setNodeAttribute(0, "lang", "js ts"));
      return true;
    });
    const before = fx.editor.doc;

    typeLanguage(fx, "js");

    expect(fx.editor.doc.eq(before)).toBe(true);
  });

  test("a composition that ends with a blur is committed", () => {
    const fx = render("```\nHello\n```\n");
    input(fx).focus();

    input(fx).dispatchEvent(new CompositionEvent("compositionstart"));
    input(fx).value = "jあ";
    input(fx).dispatchEvent(new InputEvent("input", { isComposing: true }));
    input(fx).blur();

    expect(fx.markdown()).toBe("```jあ\nHello\n```");

    fx.editor.command(setCodeBlockLanguage("ts"));

    expect(input(fx).value).toBe("ts");
  });

  test("a change from elsewhere keeps an ongoing composition", () => {
    const fx = render("```\nHello\n```\n");
    input(fx).focus();

    input(fx).dispatchEvent(new CompositionEvent("compositionstart"));
    input(fx).value = "jあ";
    input(fx).dispatchEvent(new InputEvent("input", { isComposing: true }));
    fx.editor.command((state, dispatch) => {
      dispatch?.(state.tr.insertText("X", 1));
      return true;
    });

    expect(input(fx).value).toBe("jあ");

    input(fx).dispatchEvent(new CompositionEvent("compositionend"));

    expect(fx.markdown()).toBe("```jあ\nXHello\n```");
  });

  test("keeps the field across updates", () => {
    const fx = render("```\nHello\n```\n");
    const field = input(fx);
    field.focus();

    typeLanguage(fx, "js");

    expect(input(fx)).toBe(field);
    expect(document.activeElement).toBe(field);
  });

  test("sizes the field to the placeholder without a language", () => {
    expect(input(render("```\nHello\n```\n")).size).toBe(4);
  });

  test("sizes the field to the language", () => {
    const fx = render("```\nHello\n```\n");

    typeLanguage(fx, "typescript");

    expect(input(fx).size).toBe(10);
  });

  test("resizes the field during a composition", () => {
    const fx = render("```\nHello\n```\n");

    input(fx).value = "typescript";
    input(fx).dispatchEvent(new InputEvent("input", { isComposing: true }));

    expect(input(fx).size).toBe(10);
  });

  test.each([
    [" ", "", "```\nHello\n```"],
    ["python ", "python", "```python\nHello\n```"],
    ["objective c", "objective", "```objective\nHello\n```"],
  ])(
    "inserts only the first word of typed text %j",
    (data, value, markdown) => {
      const fx = render("```\nHello\n```\n");
      input(fx).focus();

      expect(typeText(fx, data)).toBe(false);
      expect(input(fx).value).toBe(value);
      expect(fx.markdown()).toBe(markdown);
    },
  );

  test.each(["historyUndo", "historyRedo"])(
    "prevents the field's own %s",
    (inputType) => {
      const fx = render("```js\nHello\n```\n");

      expect(
        input(fx).dispatchEvent(
          new InputEvent("beforeinput", { cancelable: true, inputType }),
        ),
      ).toBe(false);
    },
  );

  test("ignores the Enter that confirms a composition in Safari", () => {
    const fx = render("```js\nHello\n```\n");
    input(fx).focus();
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Enter",
    });
    Object.defineProperty(event, "keyCode", { value: 229 });

    expect(input(fx).dispatchEvent(event)).toBe(true);
    expect(document.activeElement).toBe(input(fx));
  });

  test("allows typing other characters", () => {
    const fx = render("```\nHello\n```\n");

    expect(typeText(fx, "j")).toBe(true);
  });

  test("keeps a non-breaking space, which Markdown doesn't split at", () => {
    const fx = render("```\nHello\n```\n");

    typeLanguage(fx, "js\u00a0x");

    expect(input(fx).value).toBe("js\u00a0x");
    expect(fx.markdown()).toBe("```js\u00a0x\nHello\n```");
  });

  test("removes whitespace inserted other than by typing or pasting", () => {
    const fx = render("```javascript\nHello\n```\n");
    input(fx).focus();
    input(fx).value = "javax yscript";
    input(fx).setSelectionRange(7, 7);

    input(fx).dispatchEvent(new InputEvent("input", { bubbles: true }));

    expect(input(fx).value).toBe("javaxyscript");
    expect(input(fx).selectionStart).toBe(6);
    expect(fx.markdown()).toBe("```javaxyscript\nHello\n```");
  });

  test("renders a language set without normalisation", () => {
    const fx = render("```js\nHello\n```\n");

    fx.editor.command((state, dispatch) => {
      dispatch?.(state.tr.setNodeAttribute(0, "lang", "foo bar"));
      return true;
    });

    expect(input(fx).value).toBe("foo");
    expect(fx.editor.element("pre").getAttribute("data-language")).toBe("foo");
    expect(fx.editor.element("code").className).toBe("language-foo");
  });

  test("pasting inserts the text up to its first whitespace at the caret", () => {
    const fx = render("```typescript\nHello\n```\n");
    input(fx).focus();
    input(fx).setSelectionRange(4, 4);

    expect(paste(fx, " x y\n")).toBe(false);
    expect(input(fx).value).toBe("typexscript");
    expect(input(fx).selectionStart).toBe(5);
    expect(fx.markdown()).toBe("```typexscript\nHello\n```");
  });

  test("pasting replaces the selected text", () => {
    const fx = render("```typescript\nHello\n```\n");
    input(fx).focus();
    input(fx).setSelectionRange(0, 4);

    paste(fx, "java");

    expect(fx.markdown()).toBe("```javascript\nHello\n```");
  });

  test("pasting only whitespace keeps the selected text", () => {
    const fx = render("```js x=1\nHello\n```\n");
    input(fx).focus();
    input(fx).setSelectionRange(0, 2);

    expect(paste(fx, " \n")).toBe(false);
    expect(input(fx).value).toBe("js");
    expect(fx.markdown()).toBe("```js x=1\nHello\n```");
  });

  test("pasting does nothing in a read-only editor", () => {
    const fx = render("```ts\nHello\n```\n", { editable: () => false });

    expect(paste(fx, "js")).toBe(false);
    expect(input(fx).value).toBe("ts");
    expect(fx.markdown()).toBe("```ts\nHello\n```");
  });

  test("waits for a composition to end", () => {
    const fx = render("```\nHello\n```\n");

    input(fx).value = "js";
    input(fx).dispatchEvent(new InputEvent("input", { isComposing: true }));

    expect(fx.markdown()).toBe("```\nHello\n```");

    input(fx).dispatchEvent(new CompositionEvent("compositionend"));

    expect(fx.markdown()).toBe("```js\nHello\n```");
  });

  test.each([
    ["ArrowUp", 5],
    ["ArrowLeft", 5],
  ])("`%s` does not focus the field in a read-only editor", (key, pos) => {
    const fx = render("Hi\n\n```js\nHello\n```\n", {
      editable: () => false,
    });
    fx.editor.setSelection(pos);

    expect(fx.editor.command(keymap(fx)[key])).toBe(false);
    expect(document.activeElement).not.toBe(input(fx));
  });

  test("makes the field read-only in a read-only editor", () => {
    expect(
      input(render("```ts\nHello\n```\n", { editable: () => false })).readOnly,
    ).toBe(true);
  });

  test("makes the field editable in an editable editor", () => {
    expect(input(render("```ts\nHello\n```\n")).readOnly).toBe(false);
  });

  test.each([
    [false, true],
    [true, false],
  ])(
    "catches up on focus when the editor's editable prop changes to %s",
    (editable, readOnly) => {
      const fx = render("```ts\nHello\n```\n", {
        editable: () => !editable,
      });
      fx.editor.command((_state, _dispatch, view) => {
        view?.setProps({ editable: () => editable });
        return true;
      });

      input(fx).focus();

      expect(input(fx).readOnly).toBe(readOnly);
    },
  );

  test("resizes the field back after rejecting an edit", () => {
    const fx = render("```js\nHello\n```\n", { editable: () => false });

    typeLanguage(fx, "javascript");

    expect(input(fx).value).toBe("js");
    expect(input(fx).size).toBe(4);
  });

  test("ignores edits in a read-only editor", () => {
    const fx = render("```ts\nHello\n```\n", { editable: () => false });

    expect(typeText(fx, "j")).toBe(false);

    typeLanguage(fx, "js");

    expect(fx.markdown()).toBe("```ts\nHello\n```");
    expect(input(fx).value).toBe("ts");
  });

  test("does nothing when the node has no position in the document", () => {
    const fx = render("```\nHello\n```\n");
    const field = input(fx);

    fx.editor.command((state, dispatch) => {
      dispatch?.(state.tr.delete(0, state.doc.content.size));
      return true;
    });
    const docAfterDelete = fx.editor.doc;

    field.value = "js";
    field.dispatchEvent(new InputEvent("input"));
    field.dispatchEvent(
      new KeyboardEvent("keydown", { cancelable: true, key: "Enter" }),
    );

    expect(fx.editor.doc.eq(docAfterDelete)).toBe(true);
  });

  test.each(["Enter", "Escape", "ArrowDown"])(
    "`%s` moves to the start of the code",
    (key) => {
      const fx = render("Hi\n\n```js\nHello\n```\n");
      input(fx).focus();

      expect(press(fx, key)).toBe(false);
      expect(fx.editor.state.selection.from).toBe(5);
      expect(fx.editor.state.selection.empty).toBe(true);
      expect(document.activeElement).not.toBe(input(fx));
    },
  );

  test("`ArrowUp` moves to the end of the previous block", () => {
    const fx = render("Hi\n\n```js\nHello\n```\n");
    input(fx).focus();

    expect(press(fx, "ArrowUp")).toBe(false);
    expect(fx.editor.state.selection.from).toBe(3);
  });

  test("`ArrowUp` without a previous block keeps the focus in the field", () => {
    const fx = render("```js\nHello\n```\n");
    input(fx).focus();
    const before = fx.editor.state.selection;

    expect(press(fx, "ArrowUp")).toBe(true);
    expect(document.activeElement).toBe(input(fx));
    expect(fx.editor.state.selection.eq(before)).toBe(true);
  });

  test.each([
    ["ArrowUp", { shiftKey: true }],
    ["ArrowLeft", { shiftKey: true }],
    ["ArrowRight", { shiftKey: true }],
    ["ArrowDown", { altKey: true }],
    ["Escape", { metaKey: true }],
  ])("`%s` with a modifier is left to the field", (key, modifiers) => {
    const fx = render("Hi\n\n```js\nHello\n```\n");
    input(fx).focus();
    input(fx).setSelectionRange(0, 0);

    expect(press(fx, key, modifiers)).toBe(true);
    expect(document.activeElement).toBe(input(fx));
  });

  test.each([{ ctrlKey: true }, { shiftKey: true }, {}])(
    "`Enter` (%o) doesn't submit an enclosing form",
    (modifiers) => {
      const fx = render("```js\nHello\n```\n");

      expect(press(fx, "Enter", modifiers)).toBe(false);
    },
  );

  test("`Enter` with a modifier stays in the field", () => {
    const fx = render("```js\nHello\n```\n");
    input(fx).focus();

    press(fx, "Enter", { ctrlKey: true });

    expect(document.activeElement).toBe(input(fx));
  });

  test.each([
    ["ArrowLeft", true],
    ["ArrowRight", false],
  ])(
    "in right-to-left text, `%s` at the start of the field stays in it: %s",
    (key, stays) => {
      const fx = render("Hi\n\n```js\nHello\n```\n");
      input(fx).style.direction = "rtl";
      input(fx).focus();
      input(fx).setSelectionRange(0, 0);

      expect(press(fx, key)).toBe(stays);
      expect(document.activeElement === input(fx)).toBe(stays);
    },
  );

  test("in a right-to-left tab, `ArrowRight` goes from the code through the field to the block above", () => {
    const fx = render("Hi\n\n```js\nHello\n```\n");
    input(fx).parentElement?.style.setProperty("direction", "rtl");
    input(fx).style.direction = "ltr";
    fx.editor.setSelection(5);
    const view = fakeView({
      domAtPos: (): { node: Node; offset: number } => ({
        node: fx.editor.element("code"),
        offset: 0,
      }),
      nodeDOM: (): Node => fx.editor.element("pre"),
    });
    const { ArrowRight: arrowRight } = keymap(fx);

    expect(arrowRight(fx.editor.state, () => undefined, view)).toBe(true);
    expect(document.activeElement).toBe(input(fx));

    expect(press(fx, "ArrowRight")).toBe(false);
    expect(fx.editor.state.selection.from).toBe(3);
  });

  test("in a right-to-left tab, `ArrowLeft` at the start of a left-to-right field goes to the code", () => {
    const fx = render("Hi\n\n```js\nHello\n```\n");
    input(fx).parentElement?.style.setProperty("direction", "rtl");
    input(fx).style.direction = "ltr";
    input(fx).focus();
    input(fx).setSelectionRange(0, 0);

    expect(press(fx, "ArrowLeft")).toBe(false);
    expect(fx.editor.state.selection.from).toBe(5);
  });

  test("other keys are left to the field", () => {
    const fx = render("```js\nHello\n```\n");

    expect(press(fx, "a")).toBe(true);
  });

  test.each([
    ["at the start of the code", 5],
    ["in the middle of the first line", 7],
    ["at the end of the first line", 10],
  ])("`ArrowUp` %s focuses the field", (_, pos) => {
    const fx = render("Hi\n\n```js\nHello\nWorld\n```\n");
    fx.editor.setSelection(pos);

    fx.editor.type("{ArrowUp}");

    expect(document.activeElement).toBe(input(fx));
    expect(input(fx).selectionStart).toBe(2);
  });

  test("`ArrowUp` below the first line does not focus the field", () => {
    const fx = render("Hi\n\n```js\nHello\nWorld\n```\n");
    fx.editor.setSelection(12);

    expect(fx.editor.command(keymap(fx)["ArrowUp"])).toBe(false);
    expect(document.activeElement).not.toBe(input(fx));
  });

  test("`ArrowLeft` at the start of the code focuses the field", () => {
    const fx = render("Hi\n\n```js\nHello\n```\n");
    fx.editor.setSelection(5);

    fx.editor.type("{ArrowLeft}");

    expect(document.activeElement).toBe(input(fx));
    expect(input(fx).selectionStart).toBe(2);
  });

  test("`ArrowLeft` elsewhere in the code does not focus the field", () => {
    const fx = render("Hi\n\n```js\nHello\n```\n");
    fx.editor.setSelection(6);

    expect(fx.editor.command(keymap(fx)["ArrowLeft"])).toBe(false);
    expect(document.activeElement).not.toBe(input(fx));
  });

  test("`ArrowRight` at the end of the field moves to the start of the code", () => {
    const fx = render("Hi\n\n```js\nHello\n```\n");
    input(fx).focus();
    input(fx).setSelectionRange(2, 2);

    expect(press(fx, "ArrowRight")).toBe(false);
    expect(fx.editor.state.selection.from).toBe(5);
  });

  test("`ArrowLeft` at the start of the field moves to the end of the previous block", () => {
    const fx = render("Hi\n\n```js\nHello\n```\n");
    input(fx).focus();
    input(fx).setSelectionRange(0, 0);

    expect(press(fx, "ArrowLeft")).toBe(false);
    expect(fx.editor.state.selection.from).toBe(3);
    expect(document.activeElement).not.toBe(input(fx));
  });

  test("`ArrowLeft` inside the field is left to the field", () => {
    const fx = render("Hi\n\n```js\nHello\n```\n");
    input(fx).focus();
    input(fx).setSelectionRange(1, 1);

    expect(press(fx, "ArrowLeft")).toBe(true);
    expect(document.activeElement).toBe(input(fx));
  });

  test("`ArrowLeft` without a previous block is left to the field", () => {
    const fx = render("```js\nHello\n```\n");
    input(fx).focus();
    input(fx).setSelectionRange(0, 0);

    expect(press(fx, "ArrowLeft")).toBe(true);
    expect(document.activeElement).toBe(input(fx));
  });

  test("`ArrowRight` inside the field is left to the field", () => {
    const fx = render("Hi\n\n```js\nHello\n```\n");
    input(fx).focus();
    input(fx).setSelectionRange(1, 1);

    expect(press(fx, "ArrowRight")).toBe(true);
    expect(document.activeElement).toBe(input(fx));
  });

  test("`ArrowUp` does not apply when the field can't take focus", () => {
    const fx = render("Hi\n\n```js\nHello\n```\n");
    input(fx).disabled = true;
    fx.editor.setSelection(5);

    expect(fx.editor.command(keymap(fx)["ArrowUp"])).toBe(false);
  });

  test.each([
    ["z", { ctrlKey: true }],
    ["z", { ctrlKey: true, shiftKey: true }],
    ["y", { ctrlKey: true }],
  ])(
    "lets ProseMirror handle undo and redo (%s %o) in the field",
    (key, modifiers) => {
      const handleKeyDown = vi.fn(() => false);
      const fx = render("```js\nHello\n```\n", { handleKeyDown });

      press(fx, key, modifiers);

      expect(handleKeyDown).toHaveBeenCalledExactlyOnceWith(
        expect.anything(),
        expect.any(KeyboardEvent),
      );
    },
  );

  test.each([
    ["Win32", { metaKey: true }, false],
    ["MacIntel", { metaKey: true }, true],
    ["MacIntel", { ctrlKey: true }, false],
  ])(
    "on %s, undo with %o reaches ProseMirror: %s",
    (platform, modifiers, reaches) => {
      vi.spyOn(navigator, "platform", "get").mockReturnValue(platform);
      const handleKeyDown = vi.fn(() => false);
      const fx = render("```js\nHello\n```\n", { handleKeyDown });

      press(fx, "z", modifiers);

      expect(handleKeyDown).toHaveBeenCalledTimes(reaches ? 1 : 0);
    },
  );

  test("lets ProseMirror handle undo on a non-Latin layout", () => {
    const handleKeyDown = vi.fn(() => false);
    const fx = render("```js\nHello\n```\n", { handleKeyDown });

    press(fx, "я", { code: "KeyZ", ctrlKey: true });

    expect(handleKeyDown).toHaveBeenCalledExactlyOnceWith(
      expect.anything(),
      expect.any(KeyboardEvent),
    );
  });

  test("`ArrowLeft` does not focus the field where it wouldn't leave the code", () => {
    const fx = render("```js\nHello\n```\n");
    fx.editor.setSelection(1);
    const view = fakeView({
      endOfTextblock: (): boolean => false,
      nodeDOM: (): Node => fx.editor.element("pre"),
    });
    const { ArrowLeft: arrowLeft } = keymap(fx);

    expect(arrowLeft(fx.editor.state, () => undefined, view)).toBe(false);
    expect(document.activeElement).not.toBe(input(fx));
  });

  test("lets ProseMirror handle undo from another window, e.g. an iframe", () => {
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    const iframeWindow = iframe.contentWindow as unknown as typeof window;
    const handleKeyDown = vi.fn(() => false);
    const fx = render("```js\nHello\n```\n", { handleKeyDown });

    input(fx).dispatchEvent(
      new iframeWindow.KeyboardEvent("keydown", {
        bubbles: true,
        ctrlKey: true,
        key: "z",
      }),
    );

    expect(handleKeyDown).toHaveBeenCalledExactlyOnceWith(
      expect.anything(),
      expect.anything(),
    );

    iframe.remove();
  });

  test("`ArrowUp` focuses a field in another window, e.g. an iframe", () => {
    const fx = render("Hi\n\n```js\nHello\n```\n");
    fx.editor.setSelection(5);
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    const iframeDocument = (iframe.contentWindow as unknown as typeof window)
      .document;
    const pre = iframeDocument.createElement("pre");
    const label = iframeDocument.createElement("label");
    label.className = "prosemirror-remark-code-block-language";
    const field = iframeDocument.createElement("input");
    label.appendChild(field);
    pre.appendChild(label);
    iframeDocument.body.appendChild(pre);
    const view = fakeView({ nodeDOM: (): Node => pre, root: iframeDocument });
    const { ArrowUp: arrowUp } = keymap(fx);

    expect(arrowUp(fx.editor.state, () => undefined, view)).toBe(true);
    expect(iframeDocument.activeElement).toBe(field);

    iframe.remove();
  });

  test("`ArrowUp` does not apply without a DOM node for the code block", () => {
    const fx = render("Hi\n\n```js\nHello\n```\n");
    fx.editor.setSelection(5);
    const view = fakeView({ nodeDOM: (): null => null });
    const { ArrowUp: arrowUp } = keymap(fx);

    expect(arrowUp(fx.editor.state, () => undefined, view)).toBe(false);
  });

  test.each([
    ["ltr", "ArrowLeft", true],
    ["ltr", "ArrowRight", false],
    ["rtl", "ArrowLeft", false],
    ["rtl", "ArrowRight", true],
  ])(
    "in an empty %s code block, `%s` focuses the field: %s",
    (direction, key, focuses) => {
      const fx = render("Hi\n\n```js\n```\n");
      fx.editor.element("code").style.direction = direction;
      fx.editor.setSelection(5);

      expect(fx.editor.command(keymap(fx)[key])).toBe(focuses);
      expect(document.activeElement === input(fx)).toBe(focuses);
    },
  );

  test("`ArrowUp` focuses a field inside a shadow root", () => {
    const fx = render("Hi\n\n```js\nHello\n```\n");
    fx.editor.setSelection(5);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = host.attachShadow({ mode: "open" });
    const pre = document.createElement("pre");
    const label = document.createElement("label");
    label.className = "prosemirror-remark-code-block-language";
    const field = document.createElement("input");
    field.value = "js";
    label.appendChild(field);
    pre.appendChild(label);
    root.appendChild(pre);
    const view = fakeView({ nodeDOM: (): Node => pre, root });

    const { ArrowUp: arrowUp } = keymap(fx);

    expect(arrowUp(fx.editor.state, () => undefined, view)).toBe(true);
    expect(root.activeElement).toBe(field);
    expect(field.selectionStart).toBe(2);

    host.remove();
  });

  test("stops ProseMirror from handling other keys in the field", () => {
    const handleKeyDown = vi.fn(() => false);
    const fx = render("```js\nHello\n```\n", { handleKeyDown });

    press(fx, "a", { ctrlKey: true });

    expect(handleKeyDown).not.toHaveBeenCalled();
  });

  test("lets ProseMirror handle events inside the code", () => {
    const mousedown = vi.fn(() => true);
    const fx = render("```js\nHello\n```\n", {
      handleDOMEvents: { mousedown },
    });

    fx.editor
      .element("code")
      .dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(mousedown).toHaveBeenCalledExactlyOnceWith(
      expect.anything(),
      expect.any(MouseEvent),
    );
  });

  test("stops ProseMirror from handling events on the field", () => {
    const mousedown = vi.fn(() => true);
    const fx = render("```js\nHello\n```\n", {
      handleDOMEvents: { mousedown },
    });

    input(fx).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(mousedown).not.toHaveBeenCalled();
  });
});
