import type { Root } from "mdast";

import { gfmAutolinkLiteralFromMarkdown } from "mdast-util-gfm-autolink-literal";
import { gfmAutolinkLiteral } from "micromark-extension-gfm-autolink-literal";
import remarkParse from "remark-parse";
import { type Processor, unified } from "unified";

let parser: Processor<Root> | undefined = undefined;
let autolinkLiteralParser: Processor<Root> | undefined = undefined;
let inlineParser: Processor<Root> | undefined = undefined;

// The micromark constructs that start a block. Without them, text is read as a
// single paragraph whose lines are all inline content.
const blockConstructs = [
  "blockQuote",
  "codeFenced",
  "codeIndented",
  "definition",
  "headingAtx",
  "htmlFlow",
  "list",
  "setextUnderline",
  "thematicBreak",
];

// A CommonMark parser that also reads GFM autolink literals
export function markdownAutolinkLiteralParser(): Processor<Root> {
  autolinkLiteralParser ??= unified()
    .use(remarkParse)
    .data({
      fromMarkdownExtensions: [gfmAutolinkLiteralFromMarkdown()],
      micromarkExtensions: [gfmAutolinkLiteral()],
    });
  return autolinkLiteralParser;
}

// A CommonMark parser that reads text as the content of a textblock: as one
// paragraph, in which no line starts a block, such as a heading or a list
export function markdownInlineParser(): Processor<Root> {
  inlineParser ??= unified()
    .use(remarkParse)
    .data({ micromarkExtensions: [{ disable: { null: blockConstructs } }] });
  return inlineParser;
}

// A CommonMark parser for reading text as Markdown outside the editor's own
// conversion, such as in input rules
export function markdownParser(): Processor<Root> {
  parser ??= unified().use(remarkParse);
  return parser;
}
