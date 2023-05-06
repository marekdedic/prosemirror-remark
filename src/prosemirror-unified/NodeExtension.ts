import type {
  Attrs,
  Node as ProseMirrorNode,
  NodeSpec,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { SyntaxExtension } from "./SyntaxExtension";

export abstract class NodeExtension<
  UNode extends UnistNode
> extends SyntaxExtension<UNode> {
  public proseMirrorToUnistTest(node: ProseMirrorNode): boolean {
    return this.proseMirrorNodeName() === node.type.name;
  }

  protected createProseMirrorNodeHelper(
    children: Array<ProseMirrorNode>,
    attrs: Attrs = {}
  ): Array<ProseMirrorNode> {
    const nodeName = this.proseMirrorNodeName();
    if (nodeName === null) {
      return [];
    }
    const proseMirrorNode = this.proseMirrorSchema().nodes[
      nodeName
    ].createAndFill(attrs, children);
    if (proseMirrorNode === null) {
      return [];
    }
    return [proseMirrorNode];
  }

  public abstract proseMirrorNodeName(): string | null;

  public abstract proseMirrorNodeSpec(): NodeSpec | null;

  public abstract proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<UnistNode>
  ): Array<UNode>;
}
