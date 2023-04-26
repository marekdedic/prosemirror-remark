import { type MarkSpec, type NodeSpec, Schema } from "prosemirror-model";

import type { NodeExtension } from "./NodeExtension";
import type { ProseMirrorRemarkMarkExtension } from "./ProseMirrorRemarkMarkExtension";

type Marks = string;

export class SchemaBuilder {
  private readonly nodes: Record<string, NodeSpec> = {};
  private readonly marks: Record<Marks, MarkSpec> = {};

  public constructor(
    nodeExtensions: Array<NodeExtension>,
    markExtensions: Array<ProseMirrorRemarkMarkExtension>
  ) {
    for (const extension of nodeExtensions) {
      this.nodes[extension.proseMirrorNodeName()] =
        extension.proseMirrorNodeSpec();
    }
    for (const extension of markExtensions) {
      this.marks[extension.proseMirrorMarkName()] =
        extension.proseMirrorMarkSpec();
    }
  }

  public build(): Schema<string, Marks> {
    return new Schema<string, Marks>({
      nodes: this.nodes,
      marks: this.marks,
    });
  }
}
