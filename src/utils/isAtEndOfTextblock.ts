import type { EditorState } from "prosemirror-state";

// Whether nothing is selected and `pos`, where an input rule's match ends, is at
// the end of its textblock, where Enter ends the line instead of splitting it.
// EnterInputRules use it to leave Enter elsewhere to the usual handling.
export function isAtEndOfTextblock(state: EditorState, pos: number): boolean {
  const $pos = state.doc.resolve(pos);
  return (
    state.selection.empty && $pos.parentOffset === $pos.parent.content.size
  );
}
