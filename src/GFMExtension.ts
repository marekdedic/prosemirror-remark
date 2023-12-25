import { Extension } from "prosemirror-unified";
import remarkGfm from "remark-gfm";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { MarkdownExtension } from "./MarkdownExtension";
import { StrikethroughExtension } from "./syntax-extensions/StrikethroughExtension";
import { TaskListItemExtension } from "./syntax-extensions/TaskListItemExtension";

/**
 * @public
 */
export class GFMExtension extends Extension {
  public dependencies(): Array<Extension> {
    return [
      new MarkdownExtension(),
      new StrikethroughExtension(),
      new TaskListItemExtension(),
    ];
  }

  public unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>,
  ): Processor<UnistNode, UnistNode, UnistNode, UnistNode, string> {
    return processor.use(remarkGfm);
  }
}
