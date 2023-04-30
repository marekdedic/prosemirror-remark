import { type MarkSpec, type NodeSpec, Schema } from "prosemirror-model";

import type { MarkExtension } from "./MarkExtension";
import type { NodeExtension } from "./NodeExtension";

type Marks = string;

export class SchemaBuilder {
  private readonly nodes: Record<string, NodeSpec> = {};
  private readonly marks: Record<Marks, MarkSpec> = {};

  public constructor(
    nodeExtensions: Array<NodeExtension>,
    markExtensions: Array<MarkExtension>
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

  // TODO: stricter generic types?
  public build(): Schema<string, Marks> {
    return new Schema<string, Marks>({
      nodes: this.nodes,
      marks: this.marks,
    });
  }
}
