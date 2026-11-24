import type { Mark } from "prosemirror-model";

import {
  type EditorState,
  type Selection,
  TextSelection,
  type Transaction,
} from "prosemirror-state";

import { autolinkText } from "./autolinkText";
import { lineEndingGlobal } from "./lineEnding";
import {
  type LinkAtSelection,
  linkAtSelection,
  type LinkAttrs,
  linkMarkType,
  type LinkRange,
} from "./linkRange";

export interface LinkTransaction {
  tr: Transaction;
  // Whether the href was written as the link's text
  writesText: boolean;
}

// Adds the link over each of the selection's ranges, replacing any links in
// them, so that a selection of several ranges, such as of table cells, links
// only what's selected
export function addLinkToSelection(
  tr: Transaction,
  selection: Selection,
  mark: Mark,
): Transaction {
  for (const { $from, $to } of selection.ranges) {
    tr.removeMark($from.pos, $to.pos, mark.type).addMark(
      $from.pos,
      $to.pos,
      mark,
    );
  }
  return tr;
}

// Destinations can't contain line endings, and surrounding whitespace comes
// with copied URLs rather than being meant
export function normaliseHref(href: string): string {
  return stripTypedHref(href).trim();
}

export function normaliseTitle(
  title: string | null | undefined,
): string | null {
  return title === null || title === undefined || title === "" ? null : title;
}

export function removeLinkTransaction(
  state: EditorState,
  { range }: LinkAtSelection = linkAtSelection(state),
): Transaction | null {
  const type = linkMarkType(state.schema);
  if (type === undefined) {
    return null;
  }
  if (range !== null) {
    return state.tr.removeMark(range.from, range.to, range.mark);
  }
  const { selection } = state;
  const linked = selection.ranges.filter(({ $from, $to }) =>
    state.doc.rangeHasMark($from.pos, $to.pos, type),
  );
  if (selection.empty || linked.length === 0) {
    return null;
  }
  const { tr } = state;
  for (const { $from, $to } of linked) {
    tr.removeMark($from.pos, $to.pos, type);
  }
  return tr;
}

// Changes the link on text that was inserted as its href, found by
// insertedLinkRange, so that only that text changes. Null when the new href
// is null.
export function setInsertedLinkTransaction(
  state: EditorState,
  inserted: LinkRange,
  attrs: LinkAttrs,
  selectText: boolean,
): LinkTransaction | null {
  if (attrs.href === null) {
    return null;
  }
  const { from, mark: current, to } = inserted;
  const mark = current.type.create(attrs);
  const { tr } = state;
  if (current.attrs["href"] === attrs.href) {
    return {
      tr: replaceLinkMark(tr, from, to, current, mark),
      writesText: false,
    };
  }
  return {
    tr: writeHref(tr, from, to, mark, selectText),
    writesText: true,
  };
}

// Adds, changes or inserts a link at the selection, see setLink. With
// selectText, text the link's href is written into is selected afterwards, so
// that the selection stays in the link.
export function setLinkTransaction(
  state: EditorState,
  attrs: LinkAttrs,
  selectText: boolean,
  { applies, range }: LinkAtSelection = linkAtSelection(state),
): LinkTransaction | null {
  const type = linkMarkType(state.schema);
  if (type === undefined || !applies) {
    return null;
  }
  const mark = type.create(attrs);
  const { tr } = state;
  if (range !== null) {
    return {
      tr: replaceLinkMark(tr, range.from, range.to, range.mark, mark),
      writesText: false,
    };
  }
  const { empty, from } = state.selection;
  // An empty URL doesn't add a link, but one keeps its link when its URL is
  // cleared
  if (attrs.href === null || attrs.href === "") {
    return null;
  }
  if (!empty) {
    return {
      tr: addLinkToSelection(tr, state.selection, mark),
      writesText: false,
    };
  }
  return { tr: writeHref(tr, from, from, mark, selectText), writesText: true };
}

// What the URL field removes as it's typed: line endings and leading
// whitespace. A trailing space stays, so that a URL with a space can be typed.
export function stripTypedHref(href: string): string {
  return href.replace(lineEndingGlobal, "").replace(/^\s+/u, "");
}

// Swaps the link between from and to for another, unless it's the same
function replaceLinkMark(
  tr: Transaction,
  from: number,
  to: number,
  current: Mark,
  mark: Mark,
): Transaction {
  return current.eq(mark)
    ? tr
    : tr.removeMark(from, to, current).addMark(from, to, mark);
}

// Writes the href as the link's text, keeping the other marks it had
function writeHref(
  tr: Transaction,
  from: number,
  to: number,
  mark: Mark,
  selectText: boolean,
): Transaction {
  const text = autolinkText(mark.attrs["href"] as string);
  const $from = tr.doc.resolve(from);
  const marks =
    from === to
      ? (tr.storedMarks ?? $from.marks())
      : (tr.doc.nodeAt(from)?.marks ?? []);
  if (text === "") {
    tr.delete(from, to);
  } else {
    tr.replaceWith(
      from,
      to,
      tr.doc.type.schema.text(
        text,
        mark.addToSet(mark.type.removeFromSet(marks)),
      ),
    );
  }
  const end = from + text.length;
  return tr.setSelection(
    TextSelection.create(tr.doc, selectText ? from : end, end),
  );
}
