import type { Emphasis, Text } from "mdast";
import { toggleMark } from "prosemirror-commands";
import type { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";

import { MarkExtension } from "../../prosemirror-unified";

export class ItalicExtension extends MarkExtension<Emphasis> {
  public unistNodeName(): "emphasis" {
    return "emphasis";
  }

  public proseMirrorMarkName(): string {
    return "em";
  }

  public proseMirrorMarkSpec(): MarkSpec {
    return {
      parseDOM: [
        { tag: "i" },
        { tag: "em" },
        {
          style: "font-style",
          getAttrs: (value) => value === "italic" && null,
        },
      ],
      toDOM(): DOMOutputSpec {
        return ["em"];
      },
    };
  }

  public proseMirrorInputRules(): Array<InputRule> {
    return [
      this.inputRuleHelper(/(?<!\*)\*(?:[^\s*](.*[^\s])?)\*([^*])$/),
      this.inputRuleHelper(/(?<!_)_(?:[^\s*](.*[^\s])?)_([^*])$/),
    ];
  }

  public proseMirrorKeymap(): Record<string, Command> {
    const markType = this.proseMirrorSchema().marks[this.proseMirrorMarkName()];
    return {
      "Mod-i": toggleMark(markType),
      "Mod-I": toggleMark(markType),
    };
  }

  public unistNodeToProseMirrorNodes(
    _node: Emphasis,
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

  public processConvertedUnistNode(convertedNode: Text): Emphasis {
    return { type: this.unistNodeName(), children: [convertedNode] };
  }
}
