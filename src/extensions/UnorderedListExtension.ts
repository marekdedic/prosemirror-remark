import type { List, ListContent } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { NodeExtension } from "../NodeExtension";

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

  public mdastNodeToProseMirrorNodes(
    _node: List,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema<string, string>
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
    _: ProseMirrorNode,
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
