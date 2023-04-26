import type { Node as ProseMirrorNode, NodeSpec } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { ProseMirrorRemarkExtension } from "./ProseMirrorRemarkExtension";

export abstract class ProseMirrorRemarkNodeExtension extends ProseMirrorRemarkExtension {
  public abstract proseMirrorNodeName(): string;

  public abstract proseMirrorNodeSpec(): NodeSpec;

  // TODO: There is some code duplication in the specializations of this method
  // TODO: Make this generic
  // TODO: Maybe return just a single node
  public abstract proseMirrorNodeToMdastNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<UnistNode>
  ): Array<UnistNode>;
}
