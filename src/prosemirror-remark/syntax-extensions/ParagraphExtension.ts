import type { Paragraph, PhrasingContent } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";

import { NodeExtension } from "../../prosemirror-unified";

export class ParagraphExtension extends NodeExtension<Paragraph> {
  public unistNodeName(): "paragraph" {
    return "paragraph";
  }

  public proseMirrorNodeName(): string {
    return "paragraph";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "inline*",
      group: "block",
      parseDOM: [{ tag: "p" }],
      toDOM(): DOMOutputSpec {
        return ["p", 0];
      },
    };
  }

  public unistNodeToProseMirrorNodes(
    _node: Paragraph,
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(schema, convertedChildren);
  }

  public proseMirrorNodeToUnistNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<PhrasingContent>
  ): Array<Paragraph> {
    return [{ type: this.unistNodeName(), children: convertedChildren }];
  }
}
