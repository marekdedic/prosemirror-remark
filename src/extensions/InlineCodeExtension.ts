import type { InlineCode, Text } from "mdast";
import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";

import { MarkExtension } from "../MarkExtension";

export class InlineCodeExtension extends MarkExtension {
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
    _: Array<ProseMirrorNode>,
    schema: Schema
  ): Array<ProseMirrorNode> {
    return [
      schema
        .text(node.value)
        .mark([schema.marks[this.proseMirrorMarkName()].create()]),
    ];
  }

  public modifyMdastNode(node: Text): InlineCode {
    return { type: this.mdastNodeName(), value: node.value };
  }
}
