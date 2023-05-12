import type { Strong, Text } from "mdast";
import { toggleMark } from "prosemirror-commands";
import type { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";

import { MarkExtension } from "../../prosemirror-unified";

export class BoldExtension extends MarkExtension<Strong> {
  public unistNodeName(): "strong" {
    return "strong";
  }

  public proseMirrorMarkName(): string {
    return "strong";
  }

  public proseMirrorMarkSpec(): MarkSpec {
    return {
      parseDOM: [
        { tag: "b" },
        { tag: "strong" },
        {
          style: "font-weight",
          getAttrs: (value) =>
            /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null,
        },
      ],
      toDOM(): DOMOutputSpec {
        return ["strong"];
      },
    };
  }

  public proseMirrorInputRules(): Array<InputRule> {
    return [
      this.inputRuleHelper(/\*\*([^\s](?:.*[^\s])?)\*\*(.)$/),
      this.inputRuleHelper(/__([^\s](?:.*[^\s])?)__(.)$/),
    ];
  }

  public proseMirrorKeymap(): Record<string, Command> {
    const markType = this.proseMirrorSchema().marks[this.proseMirrorMarkName()];
    return {
      "Mod-b": toggleMark(markType),
      "Mod-B": toggleMark(markType),
    };
  }

  public unistNodeToProseMirrorNodes(
    _node: Strong,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return convertedChildren.map((child) =>
      child.mark(
        child.marks.concat([
          this.proseMirrorSchema().marks[this.proseMirrorMarkName()].create(),
        ])
      )
    );
  }

  public processConvertedUnistNode(convertedNode: Text): Strong {
    return { type: this.unistNodeName(), children: [convertedNode] };
  }
}
