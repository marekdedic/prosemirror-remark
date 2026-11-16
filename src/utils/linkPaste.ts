import type { Root, RootContent } from "mdast";
import type {
  MarkType,
  Node as ProseMirrorNode,
  Slice,
} from "prosemirror-model";
import type { EditorView } from "prosemirror-view";
import type { Processor } from "unified";

import { closeHistory } from "prosemirror-history";
import { type EditorState, Plugin } from "prosemirror-state";

import { linkTextWritten } from "./linkHrefSync";
import { linkAtSelection, linkMarkType } from "./linkRange";
import { addLinkToSelection, normaliseHref } from "./linkTransaction";
import {
  markdownAutolinkLiteralParser,
  markdownParser,
} from "./markdownParser";

interface KeyState {
  lastKey: string | null;
  shift: boolean;
}

// Pasting a URL over a selection links the selection instead of replacing it.
// The paste happens first, as its own undo step, so that undo leaves the URL
// pasted as text. A plain-text paste (Mod-Shift-V) pastes as usual.
export function linkPastePlugin(): Plugin {
  // The keys ProseMirror decides a plain-text paste by, tracked as it does,
  // since it doesn't expose them to handlePaste, see
  // https://code.haverbeke.berlin/prosemirror/prosemirror/issues/1629
  const keys = new WeakMap<EditorView, KeyState>();
  return new Plugin({
    props: {
      handleDOMEvents: {
        keydown: (view, event): boolean => {
          const state = keys.get(view) ?? { lastKey: null, shift: false };
          state.shift = event.key === "Shift" || event.shiftKey;
          // Keys pressed during a composition don't count, as for ProseMirror
          if (!view.composing && !event.isComposing) {
            state.lastKey = event.key;
          }
          keys.set(view, state);
          return false;
        },
        keyup: (view, event): boolean => {
          const state = keys.get(view);
          if (state !== undefined && event.key === "Shift") {
            state.shift = false;
          }
          return false;
        },
        mousedown: (view, event): boolean => {
          const state = keys.get(view);
          if (state !== undefined) {
            state.shift = event.shiftKey;
          }
          return false;
        },
      },
      handlePaste: (view, event, slice): boolean => {
        const state = keys.get(view);
        // Shift-Insert is an ordinary paste
        const plain = state?.shift === true && state.lastKey !== "Insert";
        if (plain || event.clipboardData === null) {
          return false;
        }
        const text = clipboardText(event.clipboardData).trim();
        const html = event.clipboardData.getData("text/html") !== "";
        // The cheap checks on the text and the selection first, parsing the
        // text next, and parsing the selected text last. Rich content, such as
        // an image, can have a URL as its text too, but isn't one: only a
        // slice that shows the URL is.
        if (
          !isSingleWord(text) ||
          (html &&
            slice.content
              .textBetween(0, slice.content.size, " ", " ")
              .trim() !== text) ||
          !canLinkSelection(view.state)
        ) {
          return false;
        }
        const href = urlHref(text);
        if (href === null || isSelectedUrl(view.state)) {
          return false;
        }
        // A link copied from a page keeps its own href, which can differ
        // from the URL it shows
        return pasteLink(
          view,
          slice,
          (html ? pastedLinkHref(slice, linkMarkType(view.state)) : null) ??
            href,
        );
      },
    },
  });
}

// Whether a pasted URL can link the selection: one that isn't empty, can be
// linked and has no link or inline code
function canLinkSelection(state: EditorState): boolean {
  const type = linkMarkType(state);
  const { selection } = state;
  return (
    type !== undefined &&
    !selection.empty &&
    linkAtSelection(state).applies &&
    selection.ranges.every(
      (range) =>
        !state.doc.rangeHasMark(range.$from.pos, range.$to.pos, type) &&
        !hasCodeMark(state.doc, range.$from.pos, range.$to.pos),
    )
  );
}

// The pasted text, read as ProseMirror reads it
function clipboardText(data: DataTransfer): string {
  for (const format of ["text/plain", "Text"]) {
    const text = data.getData(format);
    if (text !== "") {
      return text;
    }
  }
  return data.getData("text/uri-list").replace(/\r?\n/gu, " ");
}

function hasCodeMark(doc: ProseMirrorNode, from: number, to: number): boolean {
  return Object.values(doc.type.schema.marks).some(
    (type) => type.spec.code === true && doc.rangeHasMark(from, to, type),
  );
}

// Whether the selected text is a URL. A selection across textblocks has a
// line break, which no URL has, and leaf nodes, such as hard breaks or
// images, separate the text.
function isSelectedUrl(state: EditorState): boolean {
  const { $from, $to } = state.selection;
  if (!$from.sameParent($to)) {
    return false;
  }
  const text = state.doc.textBetween($from.pos, $to.pos, " ", " ").trim();
  return isSingleWord(text) && urlHref(text) !== null;
}

// Whether the text is one non-empty run without whitespace, which a URL is
function isSingleWord(text: string): boolean {
  return text !== "" && !/\s/u.test(text);
}

// The href of the link on all of the pasted inline content, null when there's
// no single one or it's empty
function pastedLinkHref(
  slice: Slice,
  type: MarkType | undefined,
): string | null {
  const hrefs = new Set<string | null>();
  slice.content.descendants((node) => {
    if (node.isInline) {
      hrefs.add(
        (type?.isInSet(node.marks)?.attrs["href"] as
          string | null | undefined) ?? null,
      );
    }
  });
  const [href] = hrefs;
  if (hrefs.size !== 1 || href === null) {
    return null;
  }
  // Cleaned up as setLink does, and an empty one isn't a link to use
  const normalised = normaliseHref(href);
  return normalised === "" ? null : normalised;
}

// Pastes the slice as ProseMirror would, then puts the selected content back
// with the link on it
function pasteLink(view: EditorView, slice: Slice, href: string): boolean {
  const { state } = view;
  const type = linkMarkType(state);
  if (type === undefined) {
    return false;
  }
  const { selection } = state;
  const singleNode =
    slice.openStart === 0 &&
    slice.openEnd === 0 &&
    slice.content.childCount === 1
      ? slice.content.firstChild
      : null;
  const paste = (
    singleNode === null
      ? state.tr.replaceSelection(slice)
      : state.tr.replaceSelectionWith(singleNode, false)
  )
    .scrollIntoView()
    .setMeta("paste", true)
    .setMeta("uiEvent", "paste");
  view.dispatch(paste);
  // Something else changed the document along with the paste, so the
  // selected content can't be put back by undoing the paste
  if (view.state.doc !== paste.doc) {
    return true;
  }
  const tr = closeHistory(view.state.tr);
  for (let i = paste.steps.length - 1; i >= 0; i--) {
    tr.step(paste.steps[i].invert(paste.docs[i]));
  }
  // The document is as before the paste, so the selection's positions are
  // unchanged
  const unchanged = tr.mapping.slice(tr.mapping.maps.length);
  addLinkToSelection(tr, selection, type.create({ href, title: null }));
  view.dispatch(
    tr
      .setSelection(selection.map(tr.doc, unchanged))
      .setMeta(linkTextWritten, true)
      .scrollIntoView(),
  );
  return true;
}

// The href of the Markdown source when it is a single link whose text is the
// given text, with nothing around it
function singleLinkHref(
  parser: Processor<Root>,
  source: string,
  text: string,
): string | null {
  const paragraph = parser.parse(source).children[0] as RootContent | undefined;
  if (paragraph?.type !== "paragraph" || paragraph.children.length !== 1) {
    return null;
  }
  const [link] = paragraph.children;
  if (link.type !== "link" || link.children.length !== 1) {
    return null;
  }
  const [child] = link.children;
  return child.type === "text" && child.value === text ? link.url : null;
}

// The href of text without whitespace that is a single URL, also in angle
// brackets: a GFM autolink literal, such as www.example.com,
// https://example.com or contact@example.com, or an http:, https: or mailto:
// URL that a CommonMark autolink, <https://example.com>, would allow. Null
// for any other text.
function urlHref(text: string): string | null {
  const source = /^<[^<>]+>$/u.test(text) ? text.slice(1, -1) : text;
  return (
    singleLinkHref(markdownAutolinkLiteralParser(), source, source) ??
    (/^(?:https?|mailto):/iu.test(source)
      ? singleLinkHref(markdownParser(), `<${source}>`, source)
      : null)
  );
}
