import type { InlineCode, Text } from "mdast";
import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";

import { MarkExtension } from "../../prosemirror-unified";

export class InlineCodeExtension extends MarkExtension<InlineCode> {
  public unistNodeName(): "inlineCode" {
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

  public unistNodeToProseMirrorNodes(
    node: InlineCode,
    schema: Schema<string, string>
  ): Array<ProseMirrorNode> {
    return [
      schema
        .text(node.value)
        .mark([schema.marks[this.proseMirrorMarkName()].create()]),
    ];
  }

  public processConvertedUnistNode(convertedNode: Text): InlineCode {
    return { type: this.unistNodeName(), value: convertedNode.value };
  }
}