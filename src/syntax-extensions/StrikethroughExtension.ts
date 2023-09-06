import type { Delete, Emphasis, Text } from "mdast";
import type { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  Mark,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import { MarkExtension, MarkInputRule } from "prosemirror-unified";
import remarkGfm from "remark-gfm";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

/**
 * @public
 */
export class StrikethroughExtension extends MarkExtension<Delete> {
  public unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, string>,
  ): Processor<UnistNode, UnistNode, UnistNode, string> {
    return processor.use(remarkGfm); // TODO: Too general
  }

  public proseMirrorToUnistTest(node: UnistNode, mark: Mark): boolean {
    return (
      ["text", "emphasis", "strong"].indexOf(node.type) > -1 &&
      mark.type.name === this.proseMirrorMarkName()
    );
  }

  public unistNodeName(): "delete" {
    return "delete";
  }

  public proseMirrorMarkName(): string {
    return "strikethrough";
  }

  public proseMirrorMarkSpec(): MarkSpec {
    return {
      parseDOM: [
        { tag: "s" },
        { tag: "del" },
        {
          style: "text-decoration",
          getAttrs: (value) =>
            /(^|[\s])line-through([\s]|$)/.test(value as string) && null,
        },
      ],
      toDOM(): DOMOutputSpec {
        return ["s"];
      },
    };
  }

  public proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      new MarkInputRule(
        /~([^\s](?:.*[^\s])?)~([\s\S])$/,
        proseMirrorSchema.marks[this.proseMirrorMarkName()],
      ),
      new MarkInputRule(
        /~~([^\s](?:.*[^\s])?)~~([\s\S])$/,
        proseMirrorSchema.marks[this.proseMirrorMarkName()],
      ),
    ];
  }

  public unistNodeToProseMirrorNodes(
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

  public processConvertedUnistNode(convertedNode: Emphasis | Text): Delete {
    return { type: this.unistNodeName(), children: [convertedNode] };
  }
}
