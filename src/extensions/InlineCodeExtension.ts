import type { InlineCode, Text } from "mdast";
import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";

import { MarkExtension } from "../MarkExtension";

export class InlineCodeExtension extends MarkExtension<InlineCode> {
  public mdastNodeName(): "inlineCode" {
    return "inlineCode";
  }

  public proseMirrorMarkName(): string {
    return "code";
  }

  public proseMirrorMarkSpec(): MarkSpec {
    return {
      inclusive: false,
      parseDOM: [{ tag: "code" }],
      toDOM(): DOMOutputSpec {
        return ["code"];
      },
    };
  }

  public mdastNodeToProseMirrorNodes(
    node: InlineCode,
    _convertedChildren: Array<ProseMirrorNode>,
    schema: Schema<string, string>
  ): Array<ProseMirrorNode> {
    return [
      schema
        .text(node.value)
        .mark([schema.marks[this.proseMirrorMarkName()].create()]),
    ];
  }

  public modifyMdastNode(convertedNode: Text): InlineCode {
    return { type: this.mdastNodeName(), value: convertedNode.value };
  }
}
