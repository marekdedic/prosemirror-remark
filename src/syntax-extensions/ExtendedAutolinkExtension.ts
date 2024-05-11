import {
  gfmAutolinkLiteralFromMarkdown,
  gfmAutolinkLiteralToMarkdown,
} from "mdast-util-gfm-autolink-literal";
import { gfmAutolinkLiteral } from "micromark-extension-gfm-autolink-literal";
import { Extension } from "prosemirror-unified";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { buildUnifiedExtension } from "../utils/buildUnifiedExtension";

/**
 * @public
 */
export class ExtendedAutolinkExtension extends Extension {
  public override unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>,
  ): Processor<UnistNode, UnistNode, UnistNode, UnistNode, string> {
    return processor.use(
      buildUnifiedExtension(
        [gfmAutolinkLiteral()],
        [gfmAutolinkLiteralFromMarkdown()],
        [gfmAutolinkLiteralToMarkdown()],
      ),
    );
  }
}
