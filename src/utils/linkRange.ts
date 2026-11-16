import type {
  Mark,
  MarkType,
  Node as ProseMirrorNode,
  ResolvedPos,
} from "prosemirror-model";
import type { EditorState } from "prosemirror-state";

import { showsHref } from "./autolinkText";

export interface LinkAtSelection {
  // Whether a link can be set at the selection
  applies: boolean;
  range: LinkRange | null;
}

export interface LinkAttrs {
  // Null for an unresolved reference
  href: string | null;
  title: string | null;
}

export interface LinkRange {
  from: number;
  mark: Mark;
  to: number;
}

export interface TextRange {
  from: number;
  to: number;
}

interface LinkableContent {
  from: number;
  // The link on all of it, if any
  mark: Mark | null;
  to: number;
}

// The link on text that was inserted as its href, which may have merged with
// an identical link next to it, as only that text. Null when the text no
// longer shows a link's href.
export function insertedLinkRange(
  state: EditorState,
  inserted: TextRange,
): LinkRange | null {
  const type = linkMarkType(state);
  const { doc } = state;
  if (type === undefined || inserted.to > doc.content.size) {
    return null;
  }
  const mark = type.isInSet(doc.nodeAt(inserted.from)?.marks ?? []);
  if (mark === undefined || !showsHref(doc, inserted.from, inserted.to, mark)) {
    return null;
  }
  return { from: inserted.from, mark, to: inserted.to };
}

// The link at the selection: the run of content around it carrying one link
// mark, which may span several textblocks. A caret at the link's edge isn't in
// it, since text typed there isn't part of it. A non-empty selection is in it
// when everything in it that can be linked, as by addMark, is, and the run is
// found around that content rather than the selection's ends.
export function linkAtSelection(state: EditorState): LinkAtSelection {
  const type = linkMarkType(state);
  if (type === undefined) {
    return { applies: false, range: null };
  }
  const { $from, $to, empty } = state.selection;
  if (empty) {
    const applies =
      $from.parent.inlineContent && $from.parent.type.allowsMarkType(type);
    const mark = type.isInSet($from.nodeAfter?.marks ?? []);
    if (mark?.isInSet($from.nodeBefore?.marks ?? []) !== true) {
      return { applies, range: null };
    }
    return { applies, range: linkRange(mark, $from, $to) };
  }
  const { from, ranges, to } = state.selection;
  // A selection of several ranges, such as of table cells, isn't in one link
  if (ranges.length > 1) {
    return {
      applies: ranges.some(
        (range) =>
          linkableContent(state.doc, range.$from.pos, range.$to.pos, type) !==
          null,
      ),
      range: null,
    };
  }
  const linkable = linkableContent(state.doc, from, to, type);
  if (linkable === null) {
    return { applies: false, range: null };
  }
  if (linkable.mark === null) {
    return { applies: true, range: null };
  }
  return {
    applies: true,
    range: linkRange(
      linkable.mark,
      state.doc.resolve(linkable.from),
      state.doc.resolve(linkable.to),
    ),
  };
}

// The attributes of the link, or empty ones without a link
export function linkAttrs(range: LinkRange | null): LinkAttrs {
  if (range === null) {
    return { href: "", title: null };
  }
  return {
    href: range.mark.attrs["href"] as string | null,
    title: range.mark.attrs["title"] as string | null,
  };
}

export function linkMarkType(state: EditorState): MarkType | undefined {
  return state.schema.marks["link"];
}

// The run of content carrying the mark that extends from $start back and from
// $end forward, within their textblocks
export function linkRange(
  mark: Mark,
  $start: ResolvedPos,
  $end: ResolvedPos,
): LinkRange {
  let from = $start.pos - $start.textOffset;
  for (
    let i = $start.index() - 1;
    i >= 0 && mark.isInSet($start.parent.child(i).marks);
    i--
  ) {
    from -= $start.parent.child(i).nodeSize;
  }
  let to = $end.pos - $end.textOffset;
  for (
    let i = $end.index();
    i < $end.parent.childCount && mark.isInSet($end.parent.child(i).marks);
    i++
  ) {
    to += $end.parent.child(i).nodeSize;
  }
  return { from, mark, to };
}

// The content between from and to that can be linked, as by addMark. Null if
// there's none.
function linkableContent(
  doc: ProseMirrorNode,
  from: number,
  to: number,
  type: MarkType,
): LinkableContent | null {
  const found: Partial<LinkableContent> = {};
  doc.nodesBetween(from, to, (node, pos, parent) => {
    if (node.isInline && parent?.type.allowsMarkType(type) === true) {
      if (found.from === undefined) {
        found.from = pos;
        found.mark = type.isInSet(node.marks) ?? null;
      } else if (
        found.mark !== null &&
        found.mark?.isInSet(node.marks) !== true
      ) {
        found.mark = null;
      }
      found.to = pos + node.nodeSize;
    }
    return !node.isInline;
  });
  if (found.from === undefined || found.to === undefined) {
    return null;
  }
  return { from: found.from, mark: found.mark ?? null, to: found.to };
}
