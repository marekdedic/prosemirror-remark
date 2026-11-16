import type { PhrasingContent, Root } from "mdast";
import type {
  Mark,
  MarkType,
  Node as ProseMirrorNode,
} from "prosemirror-model";
import type { EditorState } from "prosemirror-state";

import { InputRule } from "prosemirror-inputrules";

import { hasCodeMark, hasStoredCodeMark } from "./hasCodeMark";
import { markdownInlineParser } from "./markdownParser";

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

// Typing the ")" that ends an inline link, such as [text](url "title"), turns
// the text into a link. Whether the text before the cursor ends in a complete
// link is up to the parser, so that a URL with balanced parentheses, a title
// with a ")" or a destination in angle brackets doesn't fire early, and so that
// escapes and character references in the URL and title are resolved. An
// escaped "[" or an image doesn't fire, nor does a link with inline code in its
// syntax, or where the link can't be added. The text between the brackets
// keeps its marks.
export function linkInputRule(markType: MarkType): InputRule {
  return new InputRule(
    /\]\((?:(?!\]\().)*\)$/u,
    (state, match, start, end) => {
      if (hasStoredCodeMark(state)) {
        return null;
      }
      const input = typedInput(state, match, start, end);
      if (input === null) {
        return null;
      }
      const range = parseTrailingLink(input.text);
      if (range === null) {
        return null;
      }
      const from = input.textblockStart + range.from;
      const to = input.textblockStart + range.labelEnd;
      const mark = markType.create({ href: range.href, title: range.title });
      if (
        to > input.from ||
        state.doc.rangeHasMark(from, input.from, markType) ||
        hasCodeMark(state.doc, from, from + 1) ||
        hasCodeMark(state.doc, to, input.from) ||
        !markApplies(state.doc, from + 1, to, mark)
      ) {
        return null;
      }
      return state.tr
        .delete(to, end)
        .delete(from, from + 1)
        .addMark(from, to - 1, mark);
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

// The inline link the text ends with, with the offsets of its "[" and "]".
// Null if it doesn't end with one, or the link has no text.
function parseTrailingLink(text: string): {
  from: number;
  href: string;
  labelEnd: number;
  title: string | null;
} | null {
  // The text is read as the content of a textblock, so that none of its lines
  // is read as e.g. a heading or a list. A blank line still ends a paragraph,
  // so a link the text ends with is in the last one.
  const { children: blocks } = markdownInlineParser().parse(text);
  const paragraph = blocks[blocks.length - 1] as
    Root["children"][number] | undefined;
  if (paragraph?.type !== "paragraph") {
    return null;
  }
  const link = paragraph.children[paragraph.children.length - 1] as
    PhrasingContent | undefined;
  if (link?.type !== "link" || link.position?.end.offset !== text.length) {
    return null;
  }
  // A URL or title can't hold an inline node, such as a hard break or an
  // image, which the text has U+FFFC for
  if (`${link.url}${link.title ?? ""}`.includes("\ufffc")) {
    return null;
  }
  const from = link.position.start.offset;
  const labelEnd = (
    link.children[link.children.length - 1] as PhrasingContent | undefined
  )?.position?.end.offset;
  if (from === undefined || labelEnd === undefined) {
    return null;
  }
  return {
    from,
    href: link.url,
    labelEnd,
    title: link.title ?? null,
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
