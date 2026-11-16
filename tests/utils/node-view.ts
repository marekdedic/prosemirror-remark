import type { Extension } from "prosemirror-unified";
import type { EditorView } from "prosemirror-view";

import { Plugin, type PluginView } from "prosemirror-state";
import {
  type Options,
  type ProseMirrorEditor,
  renderProseMirror,
} from "vitest-prosemirror";

import { createTestProseMirrorUnified } from "./fixture";

export interface NodeViewFixture {
  editor: ProseMirrorEditor;
  /** The markdown the editor currently holds, without the trailing newline. */
  markdown(): string;
  view: EditorView;
}

export function pasteText(field: HTMLInputElement, text: string): boolean {
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

export function pressKey(
  target: Element,
  key: string,
  modifiers: KeyboardEventInit = {},
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

export function renderNodeView(
  extension: Extension,
  markdown: string,
  otherExtensions: Array<Extension> = [],
  editorProps: Options["editorProps"] = {},
): NodeViewFixture {
  const pmu = createTestProseMirrorUnified(extension, otherExtensions);
  let view: EditorView | undefined;
  const capture = new Plugin({
    view: (editorView): PluginView => {
      view = editorView;
      return {};
    },
  });
  const editor = renderProseMirror(pmu.parse(markdown), {
    editorProps: {
      ...editorProps,
      nodeViews: pmu.nodeViews(),
      plugins: [...(editorProps.plugins ?? []), ...pmu.plugins(), capture],
    },
  });
  if (view === undefined) {
    throw new Error("The editor wasn't mounted");
  }
  return {
    editor,
    markdown: (): string => pmu.serialize(editor.doc).trimEnd(),
    view,
  };
}
