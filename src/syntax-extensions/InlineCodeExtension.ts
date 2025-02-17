import type { InlineCode, Text } from "mdast";
import type { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";

import { toggleMark } from "prosemirror-commands";
import { MarkExtension, MarkInputRule } from "prosemirror-unified";

/**
 * @public
 */
export class InlineCodeExtension extends MarkExtension<InlineCode> {
  public override processConvertedUnistNode(convertedNode: Text): InlineCode {
    return { type: this.unistNodeName(), value: convertedNode.value };
  }

  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      new MarkInputRule(
        /`([^\s](?:.*[^\s])?)`([\s\S])$/u,
        proseMirrorSchema.marks[this.proseMirrorMarkName()],
      ),
    ];
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    const markType = proseMirrorSchema.marks[this.proseMirrorMarkName()];
    return {
      "Ctrl-`": toggleMark(markType),
    };
  }

  public override proseMirrorMarkName(): string {
    return "code";
  }

  public override proseMirrorMarkSpec(): MarkSpec {
    return {
      inclusive: false,
      parseDOM: [{ tag: "code" }],
      toDOM(): DOMOutputSpec {
        return ["code", 0];
      },
    };
  }

  public override unistNodeName(): "inlineCode" {
    return "inlineCode";
  }

  public override unistNodeToProseMirrorNodes(
    node: InlineCode,
    proseMirrorSchema: Schema<string, string>,
  ): Array<ProseMirrorNode> {
    return [
      proseMirrorSchema
        .text(node.value)
        .mark([proseMirrorSchema.marks[this.proseMirrorMarkName()].create()]),
    ];
  }
}
