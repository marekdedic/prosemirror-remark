import type { Delete, Emphasis, Text } from "mdast";
import {
  gfmStrikethroughFromMarkdown,
  gfmStrikethroughToMarkdown,
} from "mdast-util-gfm-strikethrough";
import { gfmStrikethrough } from "micromark-extension-gfm-strikethrough";
import type { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import { MarkExtension, MarkInputRule } from "prosemirror-unified";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { buildUnifiedExtension } from "../utils/buildUnifiedExtension";

/**
 * @public
 */
export class StrikethroughExtension extends MarkExtension<Delete> {
  public override unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>,
  ): Processor<UnistNode, UnistNode, UnistNode, UnistNode, string> {
    return processor.use(
      buildUnifiedExtension(
        [gfmStrikethrough()],
        [gfmStrikethroughFromMarkdown()],
        [gfmStrikethroughToMarkdown()],
      ),
    );
  }

  public override unistNodeName(): "delete" {
    return "delete";
  }

  public override proseMirrorMarkName(): string {
    return "strikethrough";
  }

  public override proseMirrorMarkSpec(): MarkSpec {
    return {
      parseDOM: [
        { tag: "s" },
        { tag: "del" },
        {
          style: "text-decoration",
          getAttrs: (value) =>
            /(^|[\s])line-through([\s]|$)/.test(value) && null,
        },
      ],
      toDOM(): DOMOutputSpec {
        return ["s"];
      },
    };
  }

  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      new MarkInputRule(
        /~([^\s](?:.*[^\s~])?)~([^~])$/,
        proseMirrorSchema.marks[this.proseMirrorMarkName()],
      ),
      new MarkInputRule(
        /~~([^\s](?:.*[^\s])?)~~([\s\S])$/,
        proseMirrorSchema.marks[this.proseMirrorMarkName()],
      ),
    ];
  }

  public override unistNodeToProseMirrorNodes(
    _node: Delete,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return convertedChildren.map((child) =>
      child.mark(
        child.marks.concat([
          proseMirrorSchema.marks[this.proseMirrorMarkName()].create(),
        ]),
      ),
    );
  }

  public override processConvertedUnistNode(
    convertedNode: Emphasis | Text,
  ): Delete {
    return { type: this.unistNodeName(), children: [convertedNode] };
  }
}
