import type { BlockContent, DefinitionContent, ListItem } from "mdast";
import type {
  DOMOutputSpec,
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import {
  type Command,
  type EditorState,
  NodeSelection,
  Plugin,
  type PluginView,
  type Selection,
  type Transaction,
} from "prosemirror-state";
import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";

import { listItemKeymap } from "../utils/listItemKeymap";
import { isList, isLoosenessForced } from "../utils/listSpread";

export class ListItemExtension extends NodeExtension<ListItem> {
  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    return listItemKeymap(proseMirrorSchema.nodes[this.proseMirrorNodeName()]);
  }

  public override proseMirrorNodeName(): string {
    return "regular_list_item";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "block+",
      defining: true,
      group: "list_item",
      parseDOM: [{ tag: "li" }],
      toDOM: (): DOMOutputSpec => ["li", 0],
    };
  }

  public override proseMirrorNodeToUnistNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<BlockContent | DefinitionContent>,
  ): Array<ListItem> {
    return [
      {
        children: convertedChildren,
        // The list sets its own looseness on its items
        spread: false,
        type: this.unistNodeName(),
      },
    ];
  }

  public override proseMirrorPlugins(): Array<Plugin> {
    return [
      new Plugin({
        appendTransaction: (
          transactions,
          _oldState,
          newState,
        ): Transaction | null => {
          const range = changedRange(transactions);
          return range === null
            ? null
            : loosenForcedLists(newState, range[0], range[1]);
        },
        // Documents that weren't parsed from Markdown, such as ones loaded
        // from JSON, are checked once when the editor is created or given a
        // new state, or when it first becomes editable
        view: (view): PluginView => {
          let checked = false;
          let destroyed = false;
          let queued = false;
          const check = (): void => {
            if (checked || queued) {
              return;
            }
            queued = true;
            // Not right away: the view may still be under construction, so an
            // app's `dispatchTransaction` couldn't reach it yet, or the app
            // may be in the middle of its own dispatch
            queueMicrotask(() => {
              queued = false;
              // A read-only editor isn't changed just by showing a document
              if (destroyed || checked || !view.editable) {
                return;
              }
              checked = true;
              const tr = loosenForcedLists(
                view.state,
                0,
                view.state.doc.content.size,
              );
              if (tr !== null) {
                view.dispatch(tr.setMeta("addToHistory", false));
              }
            });
          };
          check();
          return {
            destroy: (): void => {
              destroyed = true;
            },
            // An app can make a read-only editor editable with `setProps`
            update: (updatedView): void => {
              if (updatedView.editable) {
                check();
              }
            },
          };
        },
      }),
    ];
  }

  public override unistNodeName(): "listItem" {
    return "listItem";
  }

  public override unistNodeToProseMirrorNodes(
    _node: ListItem,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren,
    );
  }

  public override unistToProseMirrorTest(node: UnistNode): boolean {
    return (
      node.type === this.unistNodeName() &&
      (!("checked" in node) || typeof node.checked !== "boolean")
    );
  }
}

/**
 * Whether the list containing the selection is loose (`true`) or tight
 * (`false`), or `null` when the selection isn't in a list. The list is the
 * innermost one containing the whole selection, or a selected list. A list
 * whose content can't be tight is loose, even if the editor hasn't made it so,
 * as in a read-only editor.
 */
export function listSpreadAt(state: EditorState): boolean | null {
  const list = findList(state.selection);
  if (list === null) {
    return null;
  }
  return list.node.attrs["spread"] === true || isLoosenessForced(list.node);
}

/**
 * Makes the list containing the selection loose (`true`) or tight (`false`).
 * The list is the innermost one containing the whole selection, or a selected
 * list; lists nested in it keep their own looseness. A list whose content can't
 * be written as tight Markdown, such as an item with two paragraphs, can't be
 * made tight. A list with a single item containing a single block can be made
 * loose, but Markdown writes it as tight until it has a second item or block.
 */
export function setListSpread(spread: boolean): Command {
  return (state, dispatch): boolean => {
    const list = findList(state.selection);
    if (list === null || (!spread && isLoosenessForced(list.node))) {
      return false;
    }
    // A toolbar mustn't create empty undo steps
    if (dispatch && list.node.attrs["spread"] !== spread) {
      dispatch(state.tr.setNodeAttribute(list.pos, "spread", spread));
    }
    return true;
  };
}

// A range of the new document covering everything the transactions changed,
// including attribute changes, whose step maps are empty. One range keeps this
// linear in the number of steps; the lists between two distant changes are
// checked too, which is cheap.
function changedRange(
  transactions: ReadonlyArray<Transaction>,
): [number, number] | null {
  let range: [number, number] | null = null;
  const include = (from: number, to: number): void => {
    range =
      range === null
        ? [from, to]
        : [Math.min(range[0], from), Math.max(range[1], to)];
  };
  for (const tr of transactions) {
    tr.steps.forEach((step, index) => {
      const map = tr.mapping.maps[index];
      if (range !== null) {
        range = [map.map(range[0], -1), map.map(range[1], 1)];
      }
      map.forEach((_oldStart, _oldEnd, newStart, newEnd) => {
        include(newStart, newEnd);
      });
      // Attribute and node mark steps, which leave positions unchanged
      if ("pos" in step && typeof step.pos === "number") {
        include(step.pos, step.pos + 1);
      }
    });
  }
  return range;
}

function findList(
  selection: Selection,
): { node: ProseMirrorNode; pos: number } | null {
  if (selection instanceof NodeSelection && hasSpread(selection.node)) {
    return { node: selection.node, pos: selection.from };
  }
  const range = selection.$from.blockRange(selection.$to, hasSpread);
  if (range === null) {
    return null;
  }
  return { node: range.parent, pos: range.$from.before(range.depth) };
}

// A list type of the app's own may have no `spread` to set
function hasSpread(node: ProseMirrorNode): boolean {
  return isList(node.type) && "spread" in node.attrs;
}

// Lists are never made tight: whether the user wants that can't be told
function loosenForcedLists(
  state: EditorState,
  rangeFrom: number,
  rangeTo: number,
): Transaction | null {
  const { doc } = state;
  const tr = state.tr;
  // Positions taken from steps by duck typing may be anything
  const from = Math.min(Math.max(rangeFrom, 0), doc.content.size);
  const to = Math.min(Math.max(rangeTo, from), doc.content.size);
  const loosen = (node: ProseMirrorNode, pos: number): void => {
    if (
      hasSpread(node) &&
      node.attrs["spread"] !== true &&
      isLoosenessForced(node)
    ) {
      tr.setNodeAttribute(pos, "spread", true);
    }
  };
  // `nodesBetween` visits the ancestors of a non-empty range, but not of a
  // position
  const $from = doc.resolve(from);
  for (let depth = $from.depth; depth > 0; depth--) {
    loosen($from.node(depth), $from.before(depth));
  }
  doc.nodesBetween(from, to, (node, pos) => {
    if (pos >= from) {
      loosen(node, pos);
    }
    // Lists can't be inside a textblock
    return !node.isTextblock;
  });
  return tr.docChanged ? tr : null;
}
