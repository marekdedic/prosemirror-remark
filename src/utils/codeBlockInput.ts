import type { Root } from "mdast";
import type { NodeType, ResolvedPos } from "prosemirror-model";
import type { Command, EditorState, Transaction } from "prosemirror-state";

import { InputRule } from "prosemirror-inputrules";
import remarkParse from "remark-parse";
import { type Processor, unified } from "unified";

import { type CodeBlockAttrs, codeBlockAttrs } from "./codeBlockAttrs";

// A line that starts like an opening fence. Whether it is one is up to the
// parser, see parseFenceLine.
const fenceStart = /^ {0,3}(?:`{3}|~{3})/u;

// A fence followed by at most one word, which is all that can be typed: the
// first space already converts the paragraph. Text with a space or tab after
// the fence is prose, even if CommonMark would read it as a fence with a meta.
// A line break, image or hard break (see paragraphText) ends the line early.
const typeableFenceLine = new RegExp(
  `${fenceStart.source}[^\\t\\n\\r \\ufffc]*$`,
  "u",
);

// A typed space, which browsers may turn into a non-breaking one when input is
// read back from the DOM. Not \s, which would match the line ending Enter is
// passed to the input rules as.
const typedSpace = "[ \\u00a0]";

// A fence followed by a language and a space, which converts the paragraph
const fenceOnSpace = new RegExp(
  `${fenceStart.source}[^\\t \\u00a0]*${typedSpace}$`,
  "u",
);

// Anything typed into a paragraph that starts like a fence, including Enter
const fenceLineInput = new RegExp(`${fenceStart.source}.*\\n?$`, "u");

let markdownParser: Processor<Root> | undefined = undefined;

export function codeBlockInputRules(nodeType: NodeType): Array<InputRule> {
  return [
    // Like textblockTypeInputRule, but only for a whole paragraph that is a
    // fence line, as with Enter
    new InputRule(fenceOnSpace, (state, match, start, end) => {
      // Typed text of any length (e.g. "js " from autocomplete) is read as
      // part of the line
      const attrs = typedFenceAttrs(state, match, start, end, nodeType);
      return attrs === null
        ? null
        : toCodeBlock(state.tr, start, end, nodeType, attrs);
    }),
    // While a paragraph is a fence line, typed text is inserted as it is, so
    // that the mark input rules after this one don't strip delimiters from
    // the language
    new InputRule(
      fenceLineInput,
      (state, match, start, end) => {
        const typed = typedIntoParagraph(state, match, start, end);
        if (typed === null) {
          return null;
        }
        if (typed === "\n") {
          // Enter only needs guarding where fenceOnEnter converts the fence,
          // so this is the same check. Prosemirror-unified passes Enter to
          // the input rules as a line ending and then runs the keymap
          // anyway, which converts the fence; an empty transaction keeps
          // the mark rules from running first.
          return typedFenceAttrs(state, match, start, end, nodeType) === null
            ? null
            : state.tr;
        }
        return canBecomeCodeBlock(state.doc.resolve(end), nodeType) &&
          parseFenceLine(match[0]) !== null
          ? state.tr.insertText(typed, end)
          : null;
      },
      { undoable: false },
    ),
    // Like textblockTypeInputRule, but only in a paragraph, as with fences.
    // Text after the spaces becomes the code, as in CommonMark.
    new InputRule(
      new RegExp(`^${typedSpace}{4}$`, "u"),
      (state, match, start, end) =>
        typedIntoParagraph(state, match, start, end) !== null &&
        canBecomeCodeBlock(state.doc.resolve(start), nodeType)
          ? toCodeBlock(state.tr, start, end, nodeType)
          : null,
    ),
  ];
}

export function fenceOnEnter(nodeType: NodeType): Command {
  return (state, dispatch): boolean => {
    const { $from, empty } = state.selection;
    const attrs = empty ? fenceParagraphAttrs($from, nodeType) : null;
    if (attrs === null) {
      return false;
    }
    if (dispatch) {
      dispatch(
        toCodeBlock(
          state.tr,
          $from.start(),
          $from.pos,
          nodeType,
          attrs,
        ).scrollIntoView(),
      );
    }
    return true;
  };
}

function canBecomeCodeBlock($pos: ResolvedPos, nodeType: NodeType): boolean {
  return (
    // A heading whose text is a fence stays a heading, as in CommonMark
    $pos.parent.type.name === "paragraph" &&
    $pos.node(-1).canReplaceWith($pos.index(-1), $pos.indexAfter(-1), nodeType)
  );
}

// `line` is the text the paragraph is about to have, if not its current text
function fenceParagraphAttrs(
  $pos: ResolvedPos,
  nodeType: NodeType,
  line?: string,
): CodeBlockAttrs | null {
  if (
    !canBecomeCodeBlock($pos, nodeType) ||
    $pos.parentOffset !== $pos.parent.content.size
  ) {
    return null;
  }
  return parseFenceLine(line ?? paragraphText($pos));
}

// The paragraph's text, with a placeholder for images and hard breaks, which
// stop it from being a fence line
function paragraphText($pos: ResolvedPos): string {
  return $pos.parent.textBetween(
    0,
    $pos.parent.content.size,
    undefined,
    "\ufffc",
  );
}

// The attributes of a typeable fence line, as CommonMark reads it, or null if
// the text isn't one
function parseFenceLine(text: string): CodeBlockAttrs | null {
  if (!typeableFenceLine.test(text)) {
    return null;
  }
  markdownParser ??= unified().use(remarkParse);
  const { children } = markdownParser.parse(`${text}\n`);
  const [node] = children;
  // Indented code has the line as its value, an unclosed fence has none
  if (children.length !== 1 || node.type !== "code" || node.value !== "") {
    return null;
  }
  return codeBlockAttrs(node.lang, node.meta);
}

// `from` to `to` is the fence line or indentation that the code block replaces
function toCodeBlock(
  tr: Transaction,
  from: number,
  to: number,
  nodeType: NodeType,
  attrs?: CodeBlockAttrs,
): Transaction {
  return tr.delete(from, to).setBlockType(from, from, nodeType, attrs);
}

// The attributes for the fence line an input rule's match completes, the
// match's last character being the space or line ending that ends the line
function typedFenceAttrs(
  state: EditorState,
  match: RegExpMatchArray,
  start: number,
  end: number,
  nodeType: NodeType,
): CodeBlockAttrs | null {
  return typedIntoParagraph(state, match, start, end) === null
    ? null
    : fenceParagraphAttrs(
        state.doc.resolve(end),
        nodeType,
        match[0].slice(0, -1),
      );
}

// The text an input rule's match adds to a paragraph, if the match covers the
// paragraph from its start and the document up to the cursor is what the match
// starts with. An input method replacing a range (autocorrect, Android
// keyboards) breaks that, and is left to the default handling.
function typedIntoParagraph(
  state: EditorState,
  match: RegExpMatchArray,
  start: number,
  end: number,
): string | null {
  const before = state.doc.textBetween(start, end, undefined, "\ufffc");
  if (
    !state.selection.empty ||
    state.doc.resolve(start).parentOffset !== 0 ||
    !match[0].startsWith(before)
  ) {
    return null;
  }
  return match[0].slice(before.length);
}
