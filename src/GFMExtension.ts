import { Extension } from "prosemirror-unified";

import { MarkdownExtension } from "./MarkdownExtension";

/**
 * @public
 */
export class GFMExtension extends Extension {
  public override dependencies(): Array<Extension> {
    return [new MarkdownExtension()];
  }
}
