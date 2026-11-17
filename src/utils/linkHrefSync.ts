import type { Node as ProseMirrorNode } from "prosemirror-model";

import { Plugin, type Transaction } from "prosemirror-state";

import { autolinkHrefForText, isUniformText, showsHref } from "./autolinkText";
import { linkMarkType, linkRange, type TextRange } from "./linkRange";

// The meta on a transaction whose link text is written deliberately, which the
// plugin leaves alone
export const linkTextWritten = "prosemirrorRemarkLinkTextWritten";

// Keeps the href of a link whose text is its href, as for autolinks, following
// edits to the text. The text doesn't follow edits to the href.
export function linkHrefSyncPlugin(): Plugin {
  return new Plugin({
    appendTransaction: (
      transactions,
      oldState,
      newState,
    ): Transaction | null => {
      const type = linkMarkType(newState.schema);
      if (type === undefined || !transactions.some((tr) => tr.docChanged)) {
        return null;
      }
      const { doc } = newState;
      const inverses = transactions.map((step) => step.mapping.invert());
      const back = (pos: number, assoc: number): number =>
        inverses.reduceRight((mapped, map) => map.map(mapped, assoc), pos);
      const forward = (pos: number, assoc: number): number =>
        mapAfter(transactions, -1, pos, assoc);
      const seen = new Set<number>();
      let tr: Transaction | null = null;
      for (const changed of changedRanges(transactions, doc)) {
        doc.nodesBetween(changed.from, changed.to, (node, pos) => {
          if (!node.isInline) {
            return true;
          }
          const mark = type.isInSet(node.marks);
          if (mark === undefined) {
            return false;
          }
          const run = linkRange(mark, doc.resolve(pos), doc.resolve(pos));
          if (seen.has(run.from)) {
            return false;
          }
          seen.add(run.from);
          if (showsHref(doc, run.from, run.to, mark)) {
            return false;
          }
          const oldFrom = back(run.from, -1);
          const oldNode = oldState.doc.nodeAt(oldFrom);
          if (oldNode === null || !mark.isInSet(oldNode.marks)) {
            return false;
          }
          const $old = oldState.doc.resolve(oldFrom);
          const oldRun = linkRange(mark, $old, $old);
          // Only a run whose edges are the old link's edges is an edit of its
          // text. Linked content past them, where typed text doesn't get the
          // link, comes from another link that was pasted there or whose text
          // in between was deleted. A run ending short of them is part of a
          // link split by unlinked content.
          if (
            forward(oldRun.from, 1) !== run.from ||
            forward(oldRun.to, -1) !== run.to ||
            !showsHref(oldState.doc, oldRun.from, oldRun.to, mark)
          ) {
            return false;
          }
          const text = doc.textBetween(run.from, run.to);
          const oldText = oldState.doc.textBetween(oldRun.from, oldRun.to);
          const href = autolinkHrefForText(
            text,
            oldText,
            mark.attrs["href"] as string,
          );
          if (
            text === oldText ||
            href === null ||
            !isUniformText(doc.slice(run.from, run.to).content)
          ) {
            return false;
          }
          tr ??= newState.tr;
          tr.removeMark(run.from, run.to, mark).addMark(
            run.from,
            run.to,
            type.create({ ...mark.attrs, href }),
          );
          return false;
        });
      }
      return tr;
    },
  });
}

// The ranges of the new document the transactions changed, widened by one so
// that a deletion inside a link touches it
function changedRanges(
  transactions: ReadonlyArray<Transaction>,
  doc: ProseMirrorNode,
): Array<TextRange> {
  const ranges: Array<TextRange> = [];
  transactions.forEach((tr, t) => {
    if (tr.getMeta(linkTextWritten) === true) {
      return;
    }
    tr.mapping.maps.forEach((map, i) => {
      const rest = tr.mapping.slice(i + 1);
      map.forEach((_oldStart, _oldEnd, newStart, newEnd) => {
        ranges.push({
          from: Math.max(
            0,
            mapAfter(transactions, t, rest.map(newStart, -1), -1) - 1,
          ),
          to: Math.min(
            doc.content.size,
            mapAfter(transactions, t, rest.map(newEnd, 1), 1) + 1,
          ),
        });
      });
    });
  });
  return ranges;
}

// Maps a position through the transactions after the one at index t, or
// through all of them for t = -1
function mapAfter(
  transactions: ReadonlyArray<Transaction>,
  t: number,
  pos: number,
  assoc: number,
): number {
  return transactions
    .slice(t + 1)
    .reduce((mapped, tr) => tr.mapping.map(mapped, assoc), pos);
}
