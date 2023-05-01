import type { Heading, PhrasingContent } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";

import { NodeExtension } from "../../prosemirror-unified";

export class HeadingExtension extends NodeExtension<Heading> {
  public unistNodeName(): "heading" {
    return "heading";
  }

  public proseMirrorNodeName(): string {
    return "heading";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      attrs: { level: { default: 1 } },
      content: "text*",
      group: "block",
      defining: true,
      parseDOM: [
        { tag: "h1", attrs: { level: 1 } },
        { tag: "h2", attrs: { level: 2 } },
        { tag: "h3", attrs: { level: 3 } },
        { tag: "h4", attrs: { level: 4 } },
        { tag: "h5", attrs: { level: 5 } },
        { tag: "h6", attrs: { level: 6 } },
      ],
      toDOM(node: ProseMirrorNode): DOMOutputSpec {
        return ["h" + (node.attrs.level as number).toString(), 0];
      },
    };
  }

  public unistNodeToProseMirrorNodes(
    node: Heading,
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(schema, convertedChildren, {
      level: node.depth,
    });
  }

  public proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<PhrasingContent>
  ): Array<Heading> {
    return [
      {
        type: this.unistNodeName(),
        depth: node.attrs.level as 1 | 2 | 3 | 4 | 5 | 6,
        children: convertedChildren,
      },
    ];
  }
}
