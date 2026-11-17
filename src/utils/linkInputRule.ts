import type { PhrasingContent, Root } from "mdast";
import type {
  Mark,
  MarkType,
  Node as ProseMirrorNode,
} from "prosemirror-model";
import type { EditorState } from "prosemirror-state";
import type { Processor } from "unified";

import { InputRule } from "prosemirror-inputrules";

import { hasCodeMark, hasStoredCodeMark } from "./hasCodeMark";
import {
  markdownInlineAutolinkLiteralParser,
  markdownInlineParser,
} from "./markdownParser";
import { typedSpaceCharacters } from "./typedSpace";

// A link the text ends with, with offsets into the text
interface ParsedLink {
  // The offset of the end of the link's text, null if it has none
  contentEnd: number | null;
  end: number;
  // Whether the link is a GFM autolink literal: its source is its text
  isLiteral: boolean;
  mark: Mark;
  start: number;
}

// The text typed into a textblock
interface TypedInput {
  // Where the typed text goes. The document holds the text up to there.
  from: number;
  // The text of the textblock up to `from`, followed by the typed text
  text: string;
  // The position the offsets into `text` start at
  textblockStart: number;
  typed: string;
}

// Typing a space or Enter after a GFM autolink literal, such as
// www.example.com, https://example.com or contact@example.com, turns it into a
// link. Where the literal ends is up to the parser, so that trailing
// punctuation isn't part of it. The text is only parsed when its last word has
// what every kind of literal has: "www.", "http://", "https://" or an "@",
// which mailto: and xmpp: literals have too.
export function autolinkLiteralInputRule(markType: MarkType): InputRule {
  return new InputRule(
    new RegExp(
      `(?:www\\.|https?://|@)[^\\s\\ufffc]*[${typedSpaceCharacters}\\n]$`,
      "iu",
    ),
    (state, match, start, end) => {
      if (hasStoredCodeMark(state)) {
        return null;
      }
      const input = typedInput(state, match, start, end);
      if (input === null || (input.typed === "\n" && input.from !== end)) {
        return null;
      }
      const text = input.text.slice(0, input.text.length - input.typed.length);
      const link = parseLastLink(
        markdownInlineAutolinkLiteralParser(),
        text,
        markType,
      );
      // Only punctuation that GFM leaves out of the literal can follow it. A
      // literal that is the URL of an inline link being typed is left for the
      // inline link's input rule.
      if (
        link?.isLiteral !== true ||
        /[\s\ufffc]/u.test(text.slice(link.end)) ||
        /\]\(\s*<?$/u.test(text.slice(0, link.start))
      ) {
        return null;
      }
      const from = input.textblockStart + link.start;
      const to = input.textblockStart + link.end;
      if (
        state.doc.rangeHasMark(from, to, markType) ||
        hasCodeMark(state.doc, from, to) ||
        !markApplies(state.doc, from, to, link.mark)
      ) {
        return null;
      }
      const tr = state.tr;
      if (input.typed !== "\n") {
        tr.insertText(input.typed, input.from, end);
      }
      return tr.addMark(from, to, link.mark);
    },
    { inCodeMark: false },
  );
}

// Typing the ")" that ends an inline link, such as [text](url "title"), or the
// ">" that ends an autolink, such as <https://example.com>, turns the text into
// a link. Whether the text before the cursor ends in a complete link is up to
// the parser, so that a URL with balanced parentheses, a title with a ")" or a
// destination in angle brackets doesn't fire early, and so that escapes and
// character references in the URL and title are resolved. An escaped "[" or
// "<", an image or inline HTML doesn't fire, nor does a link with inline code
// in its syntax, or whose syntax starts or ends in a link. The text between
// the brackets keeps its marks, except links, which a link can't contain, such
// as autolink literals typed in it.
export function linkInputRule(markType: MarkType): InputRule {
  return new InputRule(
    /(?:\]\((?:(?!\]\().)*\)|<[^\s<>]+>)$/u,
    (state, match, start, end) => {
      if (hasStoredCodeMark(state)) {
        return null;
      }
      const input = typedInput(state, match, start, end);
      if (input === null) {
        return null;
      }
      const link = parseLastLink(markdownInlineParser(), input.text, markType);
      if (
        link?.end !== input.text.length ||
        link.contentEnd === null ||
        input.textblockStart + link.contentEnd > input.from
      ) {
        return null;
      }
      const from = input.textblockStart + link.start;
      const to = input.textblockStart + link.contentEnd;
      if (
        state.doc.rangeHasMark(from, from + 1, markType) ||
        state.doc.rangeHasMark(input.from - 1, input.from, markType) ||
        hasCodeMark(state.doc, from, from + 1) ||
        hasCodeMark(state.doc, to, input.from) ||
        !markApplies(state.doc, from + 1, to, link.mark)
      ) {
        return null;
      }
      return state.tr
        .delete(to, end)
        .delete(from, from + 1)
        .addMark(from, to - 1, link.mark);
    },
    { inCodeMark: false },
  );
}

// Whether the mark can be added to the content between from and to: the
// textblock allows it, and no mark there excludes it
function markApplies(
  doc: ProseMirrorNode,
  from: number,
  to: number,
  mark: Mark,
): boolean {
  if (!doc.resolve(from).parent.type.allowsMarkType(mark.type)) {
    return false;
  }
  let applies = true;
  doc.nodesBetween(from, to, (node) => {
    applies &&= !node.isInline || mark.isInSet(mark.addToSet(node.marks));
  });
  return applies;
}

// The link the text ends with, either last or followed only by text, with
// offsets into the text. The text is read as the content of a textblock, so
// that none of its lines is read as e.g. a heading or a list.
function parseLastLink(
  parser: Processor<Root>,
  text: string,
  markType: MarkType,
): ParsedLink | null {
  // A blank line ends a paragraph even without block constructs, so a link
  // the text ends with is in the last one
  const { children: blocks } = parser.parse(text);
  const paragraph = blocks[blocks.length - 1] as
    Root["children"][number] | undefined;
  if (paragraph?.type !== "paragraph") {
    return null;
  }
  const { children } = paragraph;
  const last = children[children.length - 1] as PhrasingContent | undefined;
  const trailing =
    last?.type === "text" && children.length > 1 ? last : undefined;
  const link = trailing === undefined ? last : children[children.length - 2];
  if (link?.type !== "link") {
    return null;
  }
  const [firstChild] = link.children;
  const literal =
    link.children.length === 1 && firstChild.type === "text"
      ? firstChild.value
      : null;
  // An autolink literal after a "[" that isn't closed has no position. It is
  // the last occurrence of its text, as only text without whitespace follows
  const lastIndex = literal === null ? -1 : text.lastIndexOf(literal);
  const start =
    link.position?.start.offset ?? (lastIndex === -1 ? null : lastIndex);
  const end =
    link.position?.end.offset ??
    (start === null || literal === null ? null : start + literal.length);
  if (start === null || end === null) {
    return null;
  }
  // A URL or title can't hold an inline node, such as a hard break or an
  // image, which the text has U+FFFC for
  if (`${link.url}${link.title ?? ""}`.includes("\ufffc")) {
    return null;
  }
  const lastChild = link.children[link.children.length - 1] as
    PhrasingContent | undefined;
  return {
    contentEnd: lastChild?.position?.end.offset ?? null,
    end,
    isLiteral: literal === text.slice(start, end),
    mark: markType.create({ href: link.url, title: link.title ?? null }),
    start,
  };
}

// The text of the textblock up to the offset, as the input rules parse it. A
// hard break is a line ending and any other inline node that isn't text is
// U+FFFC. Text in a code mark has lost the delimiters that made it code and
// mustn't be read as Markdown, so each of its characters is replaced by "$",
// which GFM autolink literals treat as they do the backtick around the code.
function textForParsing(textblock: ProseMirrorNode, to: number): string {
  let text = "";
  textblock.forEach((node, offset) => {
    if (offset >= to) {
      return;
    }
    const length = Math.min(node.nodeSize, to - offset);
    if (node.type.name === "hard_break") {
      text += "\n";
    } else if (!node.isText) {
      text += "\ufffc";
    } else if (node.marks.some((mark) => Boolean(mark.type.spec.code))) {
      text += "$".repeat(length);
    } else {
      text += (node.text ?? "").slice(0, length);
    }
  });
  return text;
}

// The text an input rule matched, or null if the document doesn't hold the
// match up to the typed text. The input rules plugin doesn't say which range
// the typed text replaces: it is taken to replace the selection when the
// selection ends at `end`, doesn't start before the match, and the document
// doesn't already hold the match up to `end`, and to be inserted at `end`
// otherwise.
function typedInput(
  state: EditorState,
  match: RegExpMatchArray,
  start: number,
  end: number,
): TypedInput | null {
  const { empty, from: selectionFrom, to: selectionTo } = state.selection;
  const holdsMatchToEnd =
    state.doc.textBetween(start, end, undefined, "\ufffc") ===
    match[0].slice(0, end - start);
  const from =
    !empty && selectionTo === end && selectionFrom >= start && !holdsMatchToEnd
      ? selectionFrom
      : end;
  const $from = state.doc.resolve(from);
  if (
    !$from.sameParent(state.doc.resolve(end)) ||
    state.doc.textBetween(start, from, undefined, "\ufffc") !==
      match[0].slice(0, from - start)
  ) {
    return null;
  }
  const typed = match[0].slice(from - start);
  return {
    from,
    text: `${textForParsing($from.parent, $from.parentOffset)}${typed}`,
    textblockStart: $from.start(),
    typed,
  };
}
