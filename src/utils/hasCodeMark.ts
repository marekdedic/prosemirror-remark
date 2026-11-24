import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { EditorState } from "prosemirror-state";

// Whether any content between from and to has a mark whose spec sets `code`,
// such as inline code
export function hasCodeMark(
  doc: ProseMirrorNode,
  from: number,
  to: number,
): boolean {
  return Object.values(doc.type.schema.marks).some(
    (type) => Boolean(type.spec.code) && doc.rangeHasMark(from, to, type),
  );
}

// Whether the text typed next gets a mark whose spec sets `code`, such as
// inline code toggled on with nothing selected
export function hasStoredCodeMark(state: EditorState): boolean {
  return (
    state.storedMarks?.some((mark) => Boolean(mark.type.spec.code)) ?? false
  );
}
