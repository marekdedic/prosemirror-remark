import type { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

export function isAtStart(
  state: EditorState,
  view: EditorView | undefined,
): boolean {
  if (!state.selection.empty) {
    return false;
  }
  if (view !== undefined) {
    return view.endOfTextblock("backward", state);
  }
  return state.selection.$anchor.parentOffset === 0;
}
