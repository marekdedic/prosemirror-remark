import type { Emphasis, Text } from "mdast";
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

  public proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>
  ): Array<InputRule> {
    return [
      new MarkInputRule(
        /(?<!\*)\*([^\s*](?:.*[^\s])?)\*([^*])$/,
        proseMirrorSchema.marks[this.proseMirrorMarkName()]
      ),
      new MarkInputRule(
        /(?<!_)_([^\s*](?:.*[^\s])?)_([^*])$/,
        proseMirrorSchema.marks[this.proseMirrorMarkName()]
      ),
    ];
  }

  public proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>
  ): Record<string, Command> {
    const markType = proseMirrorSchema.marks[this.proseMirrorMarkName()];
    return {
      "Mod-i": toggleMark(markType),
      "Mod-I": toggleMark(markType),
    };
  }

  public unistNodeToProseMirrorNodes(
    _node: Emphasis,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return convertedChildren.map((child) =>
      child.mark(
        child.marks.concat([
          proseMirrorSchema.marks[this.proseMirrorMarkName()].create(),
        ])
      )
    );
  }

  public processConvertedUnistNode(convertedNode: Text): Emphasis {
    return { type: this.unistNodeName(), children: [convertedNode] };
  }
}
