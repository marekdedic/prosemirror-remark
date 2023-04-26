import { type MarkSpec, type NodeSpec, Schema } from "prosemirror-model";

import type { ProseMirrorRemarkNodeExtension } from "./ProseMirrorRemarkNodeExtension";

type Marks = string;

export class SchemaBuilder {
  private readonly nodes: Record<string, NodeSpec> = {};
  private readonly marks: Record<Marks, MarkSpec> = {};

  public constructor(nodeExtensions: Array<ProseMirrorRemarkNodeExtension>) {
    for (const extension of nodeExtensions) {
      this.nodes[extension.proseMirrorNodeName()] =
        extension.proseMirrorNodeSpec();
    }
  }

  public build(): Schema<string, Marks> {
    return new Schema<string, Marks>({
      nodes: this.nodes,
      marks: this.marks,
    });
  }
}
