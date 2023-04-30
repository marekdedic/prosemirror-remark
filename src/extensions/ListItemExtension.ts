import type { BlockContent, DefinitionContent, ListItem } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";

import { NodeExtension } from "../NodeExtension";

export class ListItemExtension extends NodeExtension<ListItem> {
  public mdastNodeName(): "listItem" {
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

  public mdastNodeToProseMirrorNodes(
    _node: ListItem,
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    const proseMirrorNode = schema.nodes[
      this.proseMirrorNodeName()
    ].createAndFill({}, convertedChildren);
    if (proseMirrorNode === null) {
      return [];
    }
    return [proseMirrorNode];
  }

  public proseMirrorNodeToMdastNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<BlockContent | DefinitionContent>
  ): Array<ListItem> {
    return [
      {
        type: this.mdastNodeName(),
        children: convertedChildren,
      },
    ];
  }
}
