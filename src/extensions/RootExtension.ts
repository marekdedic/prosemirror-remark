import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { ProseMirrorRemarkExtension } from "../ProseMirrorRemarkExtension";
import type { SchemaExtension } from "../SchemaExtension";

export class RootExtension extends ProseMirrorRemarkExtension {
  public matchingMdastNodes(): Array<string> {
    return ["root"];
  }

  public schema(): SchemaExtension {
    return { nodes: { doc: { content: "block+" } } };
  }

  public mdastNodeToProseMirrorNode(
    _: UnistNode,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema
  ): ProseMirrorNode | null {
    return schema.nodes["doc"].createAndFill({}, convertedChildren);
  }
}
