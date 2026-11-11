import { type Attrs, Fragment, type NodeType } from "prosemirror-model";
import {
  type EditorState,
  TextSelection,
  type Transaction,
} from "prosemirror-state";

import { isAtEndOfTextblock } from "./isAtEndOfTextblock";

// For an EnterInputRule whose match covers a paragraph from its start to `end`:
// replaces the paragraph with a node of `nodeType` and a new paragraph for the
// cursor, so that Enter isn't handled any further. Null if Enter isn't at the
// end of the paragraph or the parent doesn't allow the node there, leaving
// Enter to the usual handling.
export function replaceParagraphOnEnter(
  state: EditorState,
  start: number,
  end: number,
  nodeType: NodeType,
  attrs?: Attrs,
): Transaction | null {
  const $start = state.doc.resolve(start);
  const paragraph = state.schema.nodes["paragraph"];
  if (
    $start.parent.type !== paragraph ||
    $start.parentOffset !== 0 ||
    !isAtEndOfTextblock(state, end)
  ) {
    return null;
  }
  const node = nodeType.create(attrs);
  const content = Fragment.from([node, paragraph.create()]);
  const index = $start.index(-1);
  if (!$start.node(-1).canReplace(index, index + 1, content)) {
    return null;
  }
  const tr = state.tr.replaceWith($start.before(), $start.after(), content);
  return tr
    .setSelection(
      TextSelection.create(tr.doc, $start.before() + node.nodeSize + 1),
    )
    .scrollIntoView();
}
