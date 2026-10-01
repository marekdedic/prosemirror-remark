import type { Attrs, NodeType } from "prosemirror-model";
import type { Command } from "prosemirror-state";

import {
  liftListItem,
  sinkListItem,
  splitListItem,
} from "prosemirror-schema-list";

export function listItemKeymap(
  itemType: NodeType,
  newItemAttrs?: Attrs,
): Record<string, Command> {
  return {
    Enter:
      newItemAttrs === undefined
        ? splitListItem(itemType)
        : splitListItemWithAttrs(itemType, newItemAttrs),
    "Shift-Tab": liftListItem(itemType),
    Tab: sinkListItem(itemType),
  };
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
              if ($from.node(depth).type === itemType) {
                tr.setNodeMarkup($from.before(depth), undefined, attrs);
                break;
              }
            }
            dispatch(tr);
          },
    );
}
