import { Extension } from "prosemirror-unified";

import { MarkdownExtension } from "./MarkdownExtension";
import { StrikethroughExtension } from "./syntax-extensions/StrikethroughExtension";
import { TaskListItemExtension } from "./syntax-extensions/TaskListItemExtension";

/**
 * @public
 */
export class GFMExtension extends Extension {
  public override dependencies(): Array<Extension> {
    return [
      new MarkdownExtension(),
      new StrikethroughExtension(),
      new TaskListItemExtension(),
    ];
  }
}
