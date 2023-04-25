import { type MarkSpec, type NodeSpec, Schema } from "prosemirror-model";

import type { ProseMirrorRemarkExtension } from "./ProseMirrorRemarkExtension";

type Marks = string;

export class SchemaBuilder {
  private readonly nodes: Record<string, NodeSpec> = {};
  private readonly marks: Record<Marks, MarkSpec> = {};

  public constructor(extensions: Array<ProseMirrorRemarkExtension>) {
    for (const extension of extensions) {
      const extensionSchema = extension.schema();
      if (extensionSchema.marks !== undefined) {
        this.marks = { ...this.marks, ...extensionSchema.marks };
      }
      if (extensionSchema.nodes !== undefined) {
        this.nodes = { ...this.nodes, ...extensionSchema.nodes };
      }
    }
  }

  public build(): Schema<string, Marks> {
    return new Schema<string, Marks>({
      nodes: this.nodes,
      marks: this.marks,
    });
  }
}
