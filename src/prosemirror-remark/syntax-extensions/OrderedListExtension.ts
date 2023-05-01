import type { List, ListContent } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { NodeExtension } from "../../prosemirror-unified";

// TODO: Add support for starting from number other than 1
// TODO: Item spacing
export class OrderedListExtension extends NodeExtension<List> {
  public unistNodeName(): "list" {
    return "list";
  }

  public unistToProseMirrorTest(node: UnistNode): boolean {
    return (
      node.type === this.unistNodeName() && (node as List).ordered === true
    );
  }

  public proseMirrorNodeName(): string {
    return "ordered_list";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "list_item+",
      group: "block",
      parseDOM: [{ tag: "ol" }],
      toDOM(): DOMOutputSpec {
        return ["ol", 0];
      },
    };
  }

  public unistNodeToProseMirrorNodes(
    _node: List,
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(schema, convertedChildren);
  }

  public proseMirrorNodeToUnistNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<ListContent>
  ): Array<List> {
    return [
      {
        type: this.unistNodeName(),
        ordered: true,
        children: convertedChildren,
      },
    ];
  }
}
