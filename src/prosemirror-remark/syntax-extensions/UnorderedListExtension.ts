import type { List, ListContent } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { NodeExtension } from "../../prosemirror-unified";

// TODO: Item spacing
export class UnorderedListExtension extends NodeExtension<List> {
  public mdastNodeName(): "list" {
    return "list";
  }

  public mdastNodeMatches(node: UnistNode): boolean {
    return (
      node.type === this.mdastNodeName() && (node as List).ordered !== true
    );
  }

  public proseMirrorNodeName(): string {
    return "bullet_list";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "list_item+",
      group: "block",
      parseDOM: [{ tag: "ul" }],
      toDOM(): DOMOutputSpec {
        return ["ul", 0];
      },
    };
  }

  public unistNodeToProseMirrorNodes(
    _node: List,
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
    convertedChildren: Array<ListContent>
  ): Array<List> {
    return [
      {
        type: this.mdastNodeName(),
        ordered: false,
        children: convertedChildren,
      },
    ];
  }
}
