import type { Emphasis, Strong, Text } from "mdast";
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
  public override unistNodeName(): "emphasis" {
    return "emphasis";
  }

  public override proseMirrorMarkName(): string {
    return "em";
  }

  public override proseMirrorMarkSpec(): MarkSpec {
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

  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      new MarkInputRule(
        /(?<!\*)\*([^\s*](?:.*[^\s])?)\*([^*])$/,
        proseMirrorSchema.marks[this.proseMirrorMarkName()],
      ),
      new MarkInputRule(
        /(?<!_)_([^\s_](?:.*[^\s])?)_([^_])$/,
        proseMirrorSchema.marks[this.proseMirrorMarkName()],
      ),
    ];
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    const markType = proseMirrorSchema.marks[this.proseMirrorMarkName()];
    return {
      "Mod-i": toggleMark(markType),
      "Mod-I": toggleMark(markType),
    };
  }

  public override unistNodeToProseMirrorNodes(
    _node: Emphasis,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return convertedChildren.map((child) =>
      child.mark(
        child.marks.concat([
          proseMirrorSchema.marks[this.proseMirrorMarkName()].create(),
        ]),
      ),
    );
  }

  public override processConvertedUnistNode(
    convertedNode: Strong | Text,
  ): Emphasis {
    return { type: this.unistNodeName(), children: [convertedNode] };
  }
}
