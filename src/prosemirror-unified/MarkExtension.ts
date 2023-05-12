import { InputRule } from "prosemirror-inputrules";
import type {
  Mark,
  MarkSpec,
  MarkType,
  Node as ProseMirrorNode,
} from "prosemirror-model";
import { SelectionRange, TextSelection } from "prosemirror-state";
import type { Node as UnistNode } from "unist";

import { SyntaxExtension } from "./SyntaxExtension";

export abstract class MarkExtension<
  UNode extends UnistNode
> extends SyntaxExtension<UNode> {
  public proseMirrorToUnistTest(node: UnistNode, mark: Mark): boolean {
    return (
      node.type === "text" && mark.type.name === this.proseMirrorMarkName()
    );
  }

  protected inputRuleHelper(pattern: RegExp): InputRule {
    return new InputRule(pattern, (state, match, start, end) => {
      if (!(state.selection instanceof TextSelection)) {
        return null;
      }

      // Determine if mark applies to match
      const $start = state.doc.resolve(start);
      const $end = state.doc.resolve(end);
      const range = [new SelectionRange($start, $end)];
      const markType =
        this.proseMirrorSchema().marks[this.proseMirrorMarkName()!];

      if (!this.markApplies(state.doc, range, markType)) {
        return null;
      }

      // apply mark
      const tr = state.tr.replaceWith(
        start,
        end,
        this.proseMirrorSchema().text(match[1])
      );
      return tr
        .addMark(
          tr.mapping.map(start),
          tr.mapping.map(end),
          markType.create(null)
        )
        .removeStoredMark(markType)
        .insertText(match[2]);
    });
  }

  private markApplies(
    doc: ProseMirrorNode,
    ranges: Array<SelectionRange>,
    type: MarkType
  ): boolean {
    for (const range of ranges) {
      const { $from, $to } = range;
      let applies = $from.depth == 0 ? doc.type.allowsMarkType(type) : false;
      doc.nodesBetween($from.pos, $to.pos, (node) => {
        if (applies) {
          return false;
        }
        applies = node.inlineContent && node.type.allowsMarkType(type);
        return true;
      });
      if (applies) {
        return true;
      }
    }
    return false;
  }

  public abstract proseMirrorMarkName(): string | null;

  public abstract proseMirrorMarkSpec(): MarkSpec | null;

  public abstract processConvertedUnistNode(
    convertedNode: UnistNode,
    originalMark: Mark
  ): UNode;
}
