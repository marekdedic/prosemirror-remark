import type { Break, Image, InlineCode, Text } from "mdast";
import type { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  MarkSpec,
  MarkType,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Command, Transaction } from "prosemirror-state";

import { toggleMark } from "prosemirror-commands";
import { MarkExtension, MarkInputRule } from "prosemirror-unified";

export class InlineCodeExtension extends MarkExtension<InlineCode> {
  public override processConvertedUnistNodes([convertedNode]: [
    Break | Image | Text,
  ]): Break | Image | InlineCode {
    if (convertedNode.type !== "text") {
      return convertedNode;
    }
    return { type: this.unistNodeName(), value: convertedNode.value };
  }

  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      new MarkInputRule(
        /`(?<content>[^\s](?:.*[^\s])?)`(?<trailing>[\s\S])$/u,
        proseMirrorSchema.marks[this.proseMirrorMarkName()],
      ),
    ];
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    const markType = proseMirrorSchema.marks[this.proseMirrorMarkName()];
    const toggle = toggleMark(markType);
    return {
      "Ctrl-`": (state, dispatch, view) =>
        toggle(
          state,
          dispatch === undefined
            ? undefined
            : (tr): void => {
                dispatch(removeMarkFromNonTextNodes(tr, markType));
              },
          view,
        ),
    };
  }

  public override proseMirrorMarkName(): string {
    return "code";
  }

  public override proseMirrorMarkSpec(): MarkSpec {
    return {
      inclusive: false,
      parseDOM: [{ tag: "code" }],
      toDOM: (): DOMOutputSpec => ["code", 0],
    };
  }

  public override unistNodeIsLeaf(): boolean {
    return true;
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

function removeMarkFromNonTextNodes(
  tr: Transaction,
  markType: MarkType,
): Transaction {
  for (const range of tr.selection.ranges) {
    tr.doc.nodesBetween(range.$from.pos, range.$to.pos, (node, pos) => {
      if (node.isInline && !node.isText && markType.isInSet(node.marks)) {
        tr.removeNodeMark(pos, markType);
      }
    });
  }
  return tr;
}
