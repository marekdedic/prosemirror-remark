import type { Emphasis, Strong, Text } from "mdast";
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
export class BoldExtension extends MarkExtension<Strong> {
  public override processConvertedUnistNode(
    convertedNode: Emphasis | Text,
  ): Strong {
    return { children: [convertedNode], type: this.unistNodeName() };
  }

  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      new MarkInputRule(
        /\*\*([^\s](?:.*[^\s])?)\*\*([\s\S])$/u,
        proseMirrorSchema.marks[this.proseMirrorMarkName()],
      ),
      new MarkInputRule(
        /__([^\s](?:.*[^\s])?)__([\s\S])$/u,
        proseMirrorSchema.marks[this.proseMirrorMarkName()],
      ),
    ];
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    const markType = proseMirrorSchema.marks[this.proseMirrorMarkName()];
    return {
      "Mod-b": toggleMark(markType),
      "Mod-B": toggleMark(markType),
    };
  }

  public override proseMirrorMarkName(): string {
    return "strong";
  }

  public override proseMirrorMarkSpec(): MarkSpec {
    return {
      parseDOM: [
        { tag: "b" },
        { tag: "strong" },
        {
          getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/u.test(value) && null,
          style: "font-weight",
        },
      ],
      toDOM(): DOMOutputSpec {
        return ["strong"];
      },
    };
  }

  public override unistNodeName(): "strong" {
    return "strong";
  }

  public override unistNodeToProseMirrorNodes(
    _node: Strong,
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
}
