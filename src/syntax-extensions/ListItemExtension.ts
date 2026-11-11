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
  type Selection,
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

function findList(
  selection: Selection,
): { node: ProseMirrorNode; pos: number } | null {
  if (selection instanceof NodeSelection && isList(selection.node.type)) {
    return { node: selection.node, pos: selection.from };
  }
  const range = selection.$from.blockRange(selection.$to, (node) =>
    isList(node.type),
  );
  if (range === null) {
    return null;
  }
  return { node: range.parent, pos: range.$from.before(range.depth) };
}
