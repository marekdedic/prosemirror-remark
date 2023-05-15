import type { InlineCode, Text } from "mdast";
import { toggleMark } from "prosemirror-commands";
import type { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
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

  public proseMirrorInputRules(): Array<InputRule> {
    return [
      new MarkInputRule(
        /`([^\s](?:.*[^\s])?)`(.)$/,
        this.proseMirrorSchema().marks[this.proseMirrorMarkName()]
      ),
    ];
  }

  public proseMirrorKeymap(): Record<string, Command> {
    const markType = this.proseMirrorSchema().marks[this.proseMirrorMarkName()];
    return {
      "Ctrl-`": toggleMark(markType),
    };
  }

  public unistNodeToProseMirrorNodes(node: InlineCode): Array<ProseMirrorNode> {
    return [
      this.proseMirrorSchema()
        .text(node.value)
        .mark([
          this.proseMirrorSchema().marks[this.proseMirrorMarkName()].create(),
        ]),
    ];
  }

  public processConvertedUnistNode(convertedNode: Text): InlineCode {
    return { type: this.unistNodeName(), value: convertedNode.value };
  }
}
