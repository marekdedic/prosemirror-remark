import type { List, ListContent } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { NodeExtension } from "../../prosemirror-unified";

export class UnorderedListExtension extends NodeExtension<List> {
  public unistNodeName(): "list" {
    return "list";
  }

  public unistToProseMirrorTest(node: UnistNode): boolean {
    return (
      node.type === this.unistNodeName() && (node as List).ordered !== true
    );
  }

  public proseMirrorNodeName(): string {
    return "bullet_list";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "list_item+",
      group: "block",
      attrs: { spread: { default: false } },
      parseDOM: [
        {
          getAttrs(dom: Node | string): { spread: boolean } {
            return {
              spread:
                (dom as HTMLElement).getAttribute("data-spread") === "true",
            };
          },
          tag: "ul",
        },
      ],
      toDOM(node: ProseMirrorNode): DOMOutputSpec {
        return ["ul", { "data-spread": node.attrs.spread as boolean }, 0];
      },
    };
  }

  public unistNodeToProseMirrorNodes(
    node: List,
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(schema, convertedChildren, {
      spread: node.spread,
    });
  }

  public proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<ListContent>
  ): Array<List> {
    const spread = node.attrs.spread as boolean;
    return [
      {
        type: this.unistNodeName(),
        ordered: false,
        spread,
        children: convertedChildren.map((child) => {
          child.spread = spread;
          return child;
        }),
      },
    ];
  }
}
