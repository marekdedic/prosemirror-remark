import type { Attrs, NodeType } from "prosemirror-model";

import {
  liftListItem,
  sinkListItem,
  splitListItem,
} from "prosemirror-schema-list";
import {
  type Command,
  type EditorState,
  TextSelection,
  type Transaction,
} from "prosemirror-state";

import { isListItem } from "./listNodes";

export function listItemKeymap(
  itemType: NodeType,
  newItemAttrs?: Attrs,
): Record<string, Command> {
  const itemTypes = Object.values(itemType.schema.nodes).filter(isListItem);
  const split =
    newItemAttrs === undefined
      ? splitListItem(itemType)
      : splitListItemWithAttrs(itemType, newItemAttrs);
  const lift = liftListItem(itemTypes);
  return {
    Enter: (state, dispatch): boolean =>
      exitLoneEmptyListItem(state, dispatch) ||
      split(state, dispatch) ||
      (isInEmptyNestedListItem(state.selection) && lift(state, dispatch)),
    "Shift-Tab": lift,
    Tab: sinkListItem(itemTypes),
  };
}

// In an empty item that is the only item of a list not nested in another,
// keeps the list and moves to an empty paragraph after it, which is added if
// there isn't one. `splitListItem` would lift the item out, removing the list.
function exitLoneEmptyListItem(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean {
  const { $from, empty } = state.selection;
  const paragraph = state.schema.nodes["paragraph"];
  if (
    !empty ||
    $from.depth < 3 ||
    $from.parent.type !== paragraph ||
    $from.parent.content.size !== 0 ||
    !isListItem($from.node(-1).type) ||
    $from.node(-1).childCount !== 1 ||
    $from.node(-2).childCount !== 1 ||
    isListItem($from.node(-3).type)
  ) {
    return false;
  }
  const container = $from.node(-3);
  const index = $from.indexAfter(-3);
  if (!container.canReplaceWith(index, index, paragraph)) {
    return false;
  }
  if (dispatch) {
    const after = $from.after(-2);
    const next = container.maybeChild(index);
    const tr = state.tr;
    if (next?.type !== paragraph || next.content.size !== 0) {
      tr.insert(after, paragraph.create());
    }
    dispatch(
      tr.setSelection(TextSelection.create(tr.doc, after + 1)).scrollIntoView(),
    );
  }
  return true;
}

// Unlike `splitListItem`, works when the outer item has a different type.
function isInEmptyNestedListItem({
  $from,
  empty,
}: EditorState["selection"]): boolean {
  return (
    empty &&
    $from.depth >= 3 &&
    $from.parent.content.size === 0 &&
    isListItem($from.node(-1).type) &&
    $from.indexAfter(-1) === $from.node(-1).childCount &&
    isListItem($from.node(-3).type) &&
    $from.indexAfter(-2) === $from.node(-2).childCount
  );
}

function splitListItemWithAttrs(itemType: NodeType, attrs: Attrs): Command {
  return (state, dispatch): boolean =>
    splitListItem(itemType)(
      state,
      dispatch === undefined
        ? undefined
        : (tr): void => {
            const { $from } = tr.selection;
            for (let depth = $from.depth; depth > 0; depth--) {
              const node = $from.node(depth);
              if (node.type === itemType) {
                tr.setNodeMarkup($from.before(depth), undefined, {
                  ...node.attrs,
                  ...attrs,
                });
                break;
              }
            }
            dispatch(tr);
          },
    );
}
