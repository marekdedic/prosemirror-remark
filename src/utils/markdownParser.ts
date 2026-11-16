import type { Root } from "mdast";

import { gfmAutolinkLiteralFromMarkdown } from "mdast-util-gfm-autolink-literal";
import { gfmAutolinkLiteral } from "micromark-extension-gfm-autolink-literal";
import remarkParse from "remark-parse";
import { type Processor, unified } from "unified";

let parser: Processor<Root> | undefined = undefined;
let autolinkLiteralParser: Processor<Root> | undefined = undefined;

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

// A CommonMark parser for reading text as Markdown outside the editor's own
// conversion, such as in input rules
export function markdownParser(): Processor<Root> {
  parser ??= unified().use(remarkParse);
  return parser;
}
