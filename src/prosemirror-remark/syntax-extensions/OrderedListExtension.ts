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
      attrs: { start: { default: 1 } },
      parseDOM: [
        {
          getAttrs(dom: Node | string): { start: number } {
            const start = (dom as HTMLElement).getAttribute("start");
            return { start: start !== null ? parseInt(start) : 1 };
          },
          tag: "ol",
        },
      ],
      toDOM(node: ProseMirrorNode): DOMOutputSpec {
        return ["ol", { start: node.attrs.start as number }, 0];
      },
    };
  }

  public unistNodeToProseMirrorNodes(
    node: List,
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(schema, convertedChildren, {
      start: node.start ?? 1,
    });
  }

  public proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<ListContent>
  ): Array<List> {
    return [
      {
        type: this.unistNodeName(),
        ordered: true,
        start: node.attrs.start as number,
        children: convertedChildren,
      },
    ];
  }
}
