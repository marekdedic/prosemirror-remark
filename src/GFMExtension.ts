import { Extension } from "prosemirror-unified";

import { MarkdownExtension } from "./MarkdownExtension";
import { StrikethroughExtension } from "./syntax-extensions/StrikethroughExtension";

/**
 * @public
 */
export class GFMExtension extends Extension {
  public override dependencies(): Array<Extension> {
    return [new MarkdownExtension(), new StrikethroughExtension()];
  }
}
