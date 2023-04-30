import type { Paragraph, PhrasingContent } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";

import { NodeExtension } from "../NodeExtension";

export class ParagraphExtension extends NodeExtension<Paragraph> {
  public mdastNodeName(): "paragraph" {
    return "paragraph";
  }

  public proseMirrorNodeName(): string {
    return "paragraph";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "inline*",
      group: "block",
      parseDOM: [{ tag: "p" }],
      toDOM(): DOMOutputSpec {
        return ["p", 0];
      },
    };
  }

  public mdastNodeToProseMirrorNodes(
    _node: Paragraph,
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
    _node: ProseMirrorNode,
    convertedChildren: Array<PhrasingContent>
  ): Array<Paragraph> {
    return [{ type: this.mdastNodeName(), children: convertedChildren }];
  }
}
