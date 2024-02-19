import type { Paragraph, PhrasingContent } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";

/**
 * @public
 */
export class ParagraphExtension extends NodeExtension<Paragraph> {
  public override unistNodeName(): "paragraph" {
    return "paragraph";
  }

  public override proseMirrorNodeName(): string {
    return "paragraph";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "inline*",
      group: "block",
      parseDOM: [{ tag: "p" }],
      toDOM(): DOMOutputSpec {
        return ["p", 0];
      },
    };
  }

  public override unistNodeToProseMirrorNodes(
    _node: Paragraph,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren,
    );
  }

  public override proseMirrorNodeToUnistNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<PhrasingContent>,
  ): Array<Paragraph> {
    return [{ type: this.unistNodeName(), children: convertedChildren }];
  }
}
