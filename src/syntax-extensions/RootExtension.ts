import type { Root, RootContent } from "mdast";
import type {
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";

import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";

/**
 * @public
 */
export class RootExtension extends NodeExtension<Root> {
  public override proseMirrorNodeName(): string {
    return "doc";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return { content: "block+" };
  }

  public override proseMirrorNodeToUnistNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<RootContent>,
  ): Array<Root> {
    return [{ type: this.unistNodeName(), children: convertedChildren }];
  }

  public override unistNodeName(): "root" {
    return "root";
  }

  public override unistNodeToProseMirrorNodes(
    _node: Root,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren,
    );
  }
}
