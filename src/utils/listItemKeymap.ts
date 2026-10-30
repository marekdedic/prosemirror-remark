import type { Attrs, NodeType } from "prosemirror-model";
import type { Command, EditorState } from "prosemirror-state";

import {
  liftListItem,
  sinkListItem,
  splitListItem,
} from "prosemirror-schema-list";

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
      split(state, dispatch) ||
      (isInEmptyNestedListItem(state.selection) && lift(state, dispatch)),
    "Shift-Tab": lift,
    Tab: sinkListItem(itemTypes),
  };
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

function isListItem(type: NodeType): boolean {
  return type.spec.group?.split(" ").includes("list_item") === true;
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
