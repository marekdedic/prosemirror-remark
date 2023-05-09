import type { BlockContent, DefinitionContent, ListItem } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
} from "prosemirror-model";
import {
  liftListItem,
  sinkListItem,
  //splitListItem,
} from "prosemirror-schema-list";
import type { Command } from "prosemirror-state";

import { NodeExtension } from "../../prosemirror-unified";

export class ListItemExtension extends NodeExtension<ListItem> {
  public unistNodeName(): "listItem" {
    return "listItem";
  }

  public proseMirrorNodeName(): string {
    return "list_item";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "paragraph block*",
      defining: true,
      parseDOM: [{ tag: "li" }],
      toDOM(): DOMOutputSpec {
        return ["li", 0];
      },
    };
  }

  public proseMirrorKeymap(): Record<string, Command> {
    const nodeType = this.proseMirrorSchema().nodes[this.proseMirrorNodeName()];
    // TODO: Backspace to lift?
    return {
      // TODO: Breaks all enter keypresses
      //Enter: splitListItem(nodeType),
      "Shift-Tab": liftListItem(nodeType),
      // TODO: Sometimes works, sometimes doesn't?
      Tab: sinkListItem(nodeType),
    };
  }

  public unistNodeToProseMirrorNodes(
    _node: ListItem,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(convertedChildren);
  }

  public proseMirrorNodeToUnistNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<BlockContent | DefinitionContent>
  ): Array<ListItem> {
    return [
      {
        type: this.unistNodeName(),
        children: convertedChildren,
      },
    ];
  }
}
