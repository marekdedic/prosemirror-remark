import { Extension } from "prosemirror-unified";
import remarkGfm from "remark-gfm";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { MarkdownExtension } from "./MarkdownExtension";

/**
 * @public
 */
export class GFMExtension extends Extension {
  public dependencies(): Array<Extension> {
    return [new MarkdownExtension()];
  }

  public unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, string>,
  ): Processor<UnistNode, UnistNode, UnistNode, string> {
    return processor.use(remarkGfm);
  }
}
