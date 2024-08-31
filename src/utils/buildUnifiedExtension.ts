import type { Extension as FromMarkdownExtension } from "mdast-util-from-markdown";
import type { Options as ToMarkdownExtension } from "mdast-util-to-markdown";
import type { Extension as MicromarkExtension } from "micromark-util-types";
import type { Processor } from "unified";

export function buildUnifiedExtension(
  micromarkExtensions: Array<MicromarkExtension>,
  fromMarkdownExtensions: Array<FromMarkdownExtension>,
  toMarkdownExtensions: Array<ToMarkdownExtension>,
): () => void {
  return function (this: Processor) {
    const data = this.data();

    data.micromarkExtensions ??= [];
    data.fromMarkdownExtensions ??= [];
    data.toMarkdownExtensions ??= [];

    data.micromarkExtensions.push(...micromarkExtensions);
    data.fromMarkdownExtensions.push(...fromMarkdownExtensions);
    data.toMarkdownExtensions.push(...toMarkdownExtensions);
  };
}
