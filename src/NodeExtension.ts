import type { Node as ProseMirrorNode, NodeSpec } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { Extension } from "./Extension";

export abstract class NodeExtension extends Extension {
  public abstract proseMirrorNodeName(): string | null;

  public abstract proseMirrorNodeSpec(): NodeSpec | null;

  // TODO: There is some code duplication in the specializations of this method
  // TODO: Make this generic
  // TODO: Maybe return just a single node
  // TODO: UnistNode is a generic
  public abstract proseMirrorNodeToMdastNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<UnistNode>
  ): Array<UnistNode>;
}
