import type { Paragraph, PhrasingContent } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { ProseMirrorRemarkNodeExtension } from "../ProseMirrorRemarkNodeExtension";

export class ParagraphExtension extends ProseMirrorRemarkNodeExtension {
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

  public mdastNodeToProseMirrorNode(
    _: UnistNode,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema
  ): Array<ProseMirrorNode> {
    const proseMirrorNode = schema.nodes[
      this.proseMirrorNodeName()
    ].createAndFill({}, convertedChildren);
    if (proseMirrorNode === null) {
      return [];
    }
    return [proseMirrorNode];
  }

  public proseMirrorNodeToMdastNode(
    _: ProseMirrorNode,
    convertedChildren: Array<PhrasingContent>
  ): Array<Paragraph> {
    return [{ type: this.mdastNodeName(), children: convertedChildren }];
  }
}
