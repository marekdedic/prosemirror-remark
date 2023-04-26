import type { Node as ProseMirrorNode, NodeSpec } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { Extension } from "./Extension";

export abstract class NodeExtension extends Extension {
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
