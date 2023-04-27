import type { Heading, PhrasingContent } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";

import { NodeExtension } from "../NodeExtension";

export class HeadingExtension extends NodeExtension {
  public mdastNodeName(): "heading" {
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

  public mdastNodeToProseMirrorNodes(
    node: Heading,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema
  ): Array<ProseMirrorNode> {
    const proseMirrorNode = schema.nodes[
      this.proseMirrorNodeName()
    ].createAndFill({ level: node.depth }, convertedChildren);
    if (proseMirrorNode === null) {
      return [];
    }
    return [proseMirrorNode];
  }

  public proseMirrorNodeToMdastNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<PhrasingContent>
  ): Array<Heading> {
    return [
      {
        type: this.mdastNodeName(),
        depth: node.attrs.level as 1 | 2 | 3 | 4 | 5 | 6,
        children: convertedChildren,
      },
    ];
  }
}