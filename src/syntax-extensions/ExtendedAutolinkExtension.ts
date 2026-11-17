import type { InputRule } from "prosemirror-inputrules";
import type { Schema } from "prosemirror-model";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import {
  gfmAutolinkLiteralFromMarkdown,
  gfmAutolinkLiteralToMarkdown,
} from "mdast-util-gfm-autolink-literal";
import { gfmAutolinkLiteral } from "micromark-extension-gfm-autolink-literal";
import { Extension } from "prosemirror-unified";

import { buildUnifiedExtension } from "../utils/buildUnifiedExtension";
import { autolinkLiteralInputRule } from "../utils/linkInputRule";
import { linkMarkType } from "../utils/linkRange";

export class ExtendedAutolinkExtension extends Extension {
  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    const markType = linkMarkType(proseMirrorSchema);
    return markType === undefined ? [] : [autolinkLiteralInputRule(markType)];
  }

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
