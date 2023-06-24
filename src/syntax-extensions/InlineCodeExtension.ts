import type { InlineCode, Text } from "mdast";
import { toggleMark } from "prosemirror-commands";
import type { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";
import { MarkExtension, MarkInputRule } from "prosemirror-unified";

/**
 * @public
 */
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

  public proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>
  ): Array<InputRule> {
    return [
      new MarkInputRule(
        /`([^\s](?:.*[^\s])?)`(.)$/,
        proseMirrorSchema.marks[this.proseMirrorMarkName()]
      ),
    ];
  }

  public proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>
  ): Record<string, Command> {
    const markType = proseMirrorSchema.marks[this.proseMirrorMarkName()];
    return {
      "Ctrl-`": toggleMark(markType),
    };
  }

  public unistNodeToProseMirrorNodes(
    node: InlineCode,
    proseMirrorSchema: Schema<string, string>
  ): Array<ProseMirrorNode> {
    return [
      proseMirrorSchema
        .text(node.value)
        .mark([proseMirrorSchema.marks[this.proseMirrorMarkName()].create()]),
    ];
  }

  public processConvertedUnistNode(convertedNode: Text): InlineCode {
    return { type: this.unistNodeName(), value: convertedNode.value };
  }
}
