import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { SchemaExtension } from "./SchemaExtension";

export abstract class ProseMirrorRemarkExtension {
  // TODO: Maybe just one string?
  public abstract matchingMdastNodes(): Array<string>;

  // TODO: Maybe just either one node or one mark?
  public abstract schema(): SchemaExtension;

  // TODO: There is some code duplication in the specializations of this method
  public abstract mdastNodeToProseMirrorNode(
    node: UnistNode,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema
  ): Array<ProseMirrorNode>;
}
