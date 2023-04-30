import { type MarkSpec, type NodeSpec, Schema } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { MarkExtension } from "./MarkExtension";
import type { NodeExtension } from "./NodeExtension";

export class SchemaBuilder {
  private readonly nodes: Record<string, NodeSpec> = {};
  private readonly marks: Record<string, MarkSpec> = {};

  public constructor(
    nodeExtensions: Array<NodeExtension<UnistNode>>,
    markExtensions: Array<MarkExtension<UnistNode>>
  ) {
    for (const extension of nodeExtensions) {
      const name = extension.proseMirrorNodeName();
      const spec = extension.proseMirrorNodeSpec();
      if (name !== null && spec !== null) {
        this.nodes[name] = spec;
      }
    }
    for (const extension of markExtensions) {
      this.marks[extension.proseMirrorMarkName()] =
        extension.proseMirrorMarkSpec();
    }
  }

  public build(): Schema<string, string> {
    return new Schema<string, string>({
      nodes: this.nodes,
      marks: this.marks,
    });
  }
}
