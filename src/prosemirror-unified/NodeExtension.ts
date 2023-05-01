import type {
  Attrs,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { SyntaxExtension } from "./SyntaxExtension";

export abstract class NodeExtension<
  UNode extends UnistNode
> extends SyntaxExtension<UNode> {
  protected createProseMirrorNodeHelper(
    schema: Schema<string, string>,
    children: Array<ProseMirrorNode>,
    attrs: Attrs = {}
  ): Array<ProseMirrorNode> {
    const nodeName = this.proseMirrorNodeName();
    if (nodeName === null) {
      return [];
    }
    const proseMirrorNode = schema.nodes[nodeName].createAndFill(
      attrs,
      children
    );
    if (proseMirrorNode === null) {
      return [];
    }
    return [proseMirrorNode];
  }

  public abstract proseMirrorNodeName(): string | null;

  public abstract proseMirrorNodeSpec(): NodeSpec | null;

  // TODO: There is some code duplication in the specializations of this method
  public abstract proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<UnistNode>
  ): Array<UNode>;
}
