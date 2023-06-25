import { Extension } from "prosemirror-unified";
import remarkGfm from "remark-gfm";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { MarkdownExtension } from "./MarkdownExtension";

/**
 * @public
 *
 * TODO: Add support for tables
 * TODO: Add support for task list items
 * TODO: Add support for strikethrough
 * TODO: Add support for extended autolinks
 * TODO: Add support for filtered raw HTML
 */
export class GFMExtension extends Extension {
  public dependencies(): Array<Extension> {
    return [new MarkdownExtension()];
  }

  public unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, string>
  ): Processor<UnistNode, UnistNode, UnistNode, string> {
    return processor.use(remarkGfm);
  }
}
