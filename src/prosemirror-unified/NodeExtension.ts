import type { Node as ProseMirrorNode, NodeSpec } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { SyntaxExtension } from "./SyntaxExtension";

export abstract class NodeExtension<
  UNode extends UnistNode
> extends SyntaxExtension<UNode> {
  public abstract proseMirrorNodeName(): string | null;

  public abstract proseMirrorNodeSpec(): NodeSpec | null;

  // TODO: There is some code duplication in the specializations of this method
  public abstract proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<UnistNode>
  ): Array<UNode>;
}
