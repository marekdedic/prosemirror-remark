import type { Extension } from "prosemirror-unified";

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
}

export function renderNodeView(
  extension: Extension,
  markdown: string,
  otherExtensions: Array<Extension> = [],
  editorProps: Options["editorProps"] = {},
): NodeViewFixture {
  const pmu = createTestProseMirrorUnified(extension, otherExtensions);
  const editor = renderProseMirror(pmu.parse(markdown), {
    editorProps: { ...editorProps, nodeViews: pmu.nodeViews() },
  });
  return {
    editor,
    markdown: (): string => pmu.serialize(editor.doc).trimEnd(),
  };
}
