import type { Command, EditorState, Transaction } from "prosemirror-state";

import {
  type Attrs,
  Fragment,
  NodeRange,
  type NodeType,
  type Node as ProseMirrorNode,
  Slice,
} from "prosemirror-model";
import { liftListItem, splitListItem } from "prosemirror-schema-list";
import { canJoin, liftTarget, ReplaceAroundStep } from "prosemirror-transform";

export function listItemKeymap(
  itemType: NodeType,
  newItemAttrs?: Attrs,
): Record<string, Command> {
  const split =
    newItemAttrs === undefined
      ? splitListItem(itemType)
      : splitListItemWithAttrs(itemType, newItemAttrs);
  return {
    Enter: (state, dispatch): boolean =>
      split(state, dispatch) || liftEmptyNestedListItem(state, dispatch),
    "Shift-Tab": liftAnyListItem,
    Tab: sinkAnyListItem,
  };
}

function isListItem(node: ProseMirrorNode): boolean {
  return node.type.spec.group?.split(" ").includes("list_item") === true;
}

// Like `liftListItem`, but with any item type in the list and its parent.
function liftAnyListItem(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean {
  const range = listItemRange(state);
  if (range === null) {
    return false;
  }
  if (!isListItem(range.$from.node(range.depth - 1))) {
    return liftListItem(range.parent.child(0).type)(state, dispatch);
  }
  if (dispatch === undefined) {
    return true;
  }
  return liftToOuterList(state, dispatch, range);
}

// Unlike `splitListItem`, works when the outer item has a different type.
function liftEmptyNestedListItem(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean {
  const { $from, empty } = state.selection;
  if (
    !empty ||
    $from.depth < 3 ||
    $from.parent.content.size > 0 ||
    !isListItem($from.node(-1)) ||
    $from.indexAfter(-1) < $from.node(-1).childCount ||
    !isListItem($from.node(-3)) ||
    $from.indexAfter(-2) < $from.node(-2).childCount
  ) {
    return false;
  }
  return liftAnyListItem(state, dispatch);
}

function liftToOuterList(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  range: NodeRange,
): boolean {
  const tr = state.tr;
  const { end } = range;
  const endOfList = range.$to.end(range.depth);
  let liftedRange = range;
  if (end < endOfList) {
    // Siblings after the lifted items become children of the last one.
    const lastItem = range.parent.child(range.endIndex - 1);
    tr.step(
      new ReplaceAroundStep(
        end - 1,
        endOfList,
        end,
        endOfList,
        new Slice(
          Fragment.from(lastItem.copy(Fragment.from(range.parent.copy()))),
          1,
          0,
        ),
        1,
        true,
      ),
    );
    liftedRange = new NodeRange(
      tr.doc.resolve(range.$from.pos),
      tr.doc.resolve(endOfList),
      range.depth,
    );
  }
  const target = liftTarget(liftedRange);
  if (target === null) {
    return false;
  }
  tr.lift(liftedRange, target);
  const $after = tr.doc.resolve(tr.mapping.map(end, -1) - 1);
  if (
    canJoin(tr.doc, $after.pos) &&
    $after.nodeBefore?.type === $after.nodeAfter?.type
  ) {
    tr.join($after.pos);
  }
  dispatch(tr.scrollIntoView());
  return true;
}

function listItemRange(state: EditorState): NodeRange | null {
  const { $from, $to } = state.selection;
  return $from.blockRange(
    $to,
    (node) => node.firstChild !== null && isListItem(node.firstChild),
  );
}

// Like `sinkListItem`, but with any item type in the list and before the item.
function sinkAnyListItem(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean {
  const range = listItemRange(state);
  if (range === null || range.startIndex === 0) {
    return false;
  }
  const { parent } = range;
  const nodeBefore = parent.child(range.startIndex - 1);
  if (dispatch !== undefined) {
    const nestedItem =
      nodeBefore.lastChild?.type === parent.type
        ? nodeBefore.lastChild.lastChild
        : null;
    const openStart = nestedItem === null ? 1 : 3;
    const inner =
      nestedItem === null
        ? Fragment.empty
        : Fragment.from(nestedItem.type.create());
    const slice = new Slice(
      Fragment.from(
        nodeBefore.type.create(
          null,
          Fragment.from(parent.type.create(null, inner)),
        ),
      ),
      openStart,
      0,
    );
    dispatch(
      state.tr
        .step(
          new ReplaceAroundStep(
            range.start - openStart,
            range.end,
            range.start,
            range.end,
            slice,
            1,
            true,
          ),
        )
        .scrollIntoView(),
    );
  }
  return true;
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
