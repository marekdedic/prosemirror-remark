import { InputRule } from "prosemirror-inputrules";
import type { MarkType, Node as ProseMirrorNode } from "prosemirror-model";
import {
  type EditorState,
  SelectionRange,
  TextSelection,
  type Transaction,
} from "prosemirror-state";

export class MarkInputRule extends InputRule {
  private readonly markType: MarkType;

  public constructor(match: RegExp, markType: MarkType) {
    super(match, (state, match, start, end) =>
      this.markHandler(state, match, start, end)
    );
    this.markType = markType;
  }

  private markHandler(
    state: EditorState,
    match: RegExpMatchArray,
    start: number,
    end: number
  ): Transaction | null {
    if (!(state.selection instanceof TextSelection)) {
      return null;
    }

    // Determine if mark applies to match
    const $start = state.doc.resolve(start);
    const $end = state.doc.resolve(end);
    const range = [new SelectionRange($start, $end)];

    if (!this.markApplies(state.doc, range, this.markType)) {
      return null;
    }

    // apply mark
    const tr = state.tr.replaceWith(
      start,
      end,
      this.markType.schema.text(match[1])
    );
    return tr
      .addMark(
        tr.mapping.map(start),
        tr.mapping.map(end),
        this.markType.create(null)
      )
      .removeStoredMark(this.markType)
      .insertText(match[2]);
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
}
