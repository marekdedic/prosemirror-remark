import type { BlockContent, DefinitionContent, ListItem } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import {
  liftListItem,
  sinkListItem,
  splitListItem,
} from "prosemirror-schema-list";
import type { Command } from "prosemirror-state";
import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

/**
 * @public
 */
export class ListItemExtension extends NodeExtension<ListItem> {
  public override unistNodeName(): "listItem" {
    return "listItem";
  }

  public override proseMirrorNodeName(): string {
    return "regular_list_item";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "paragraph block*",
      defining: true,
      group: "list_item",
      parseDOM: [{ tag: "li" }],
      toDOM(): DOMOutputSpec {
        return ["li", 0];
      },
    };
  }

  public unistToProseMirrorTest(node: UnistNode): boolean {
    return (
      node.type === this.unistNodeName() &&
      (!("checked" in node) || typeof node.checked !== "boolean")
    );
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    const nodeType = proseMirrorSchema.nodes[this.proseMirrorNodeName()];
    return {
      Enter: splitListItem(nodeType),
      "Shift-Tab": liftListItem(nodeType),
      Tab: sinkListItem(nodeType),
    };
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

  public override proseMirrorNodeToUnistNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<BlockContent | DefinitionContent>,
  ): Array<ListItem> {
    return [
      {
        type: this.unistNodeName(),
        children: convertedChildren,
      },
    ];
  }
}
