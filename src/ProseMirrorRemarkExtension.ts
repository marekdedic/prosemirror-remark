import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { SchemaExtension } from "./SchemaExtension";

export abstract class ProseMirrorRemarkExtension {
  public abstract matchingMdastNodes(): Array<string>;

  public abstract schema(): SchemaExtension;

  public abstract mdastNodeToProseMirrorNode(
    node: UnistNode,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema
  ): ProseMirrorNode | null;
}
