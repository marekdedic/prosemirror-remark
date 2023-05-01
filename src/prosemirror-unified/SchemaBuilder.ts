import { type MarkSpec, type NodeSpec, Schema } from "prosemirror-model";

import type { ExtensionManager } from "./ExtensionManager";

export class SchemaBuilder {
  private readonly nodes: Record<string, NodeSpec> = {};
  private readonly marks: Record<string, MarkSpec> = {};

  public constructor(extensionManager: ExtensionManager) {
    for (const extension of extensionManager.nodeExtensions()) {
      const name = extension.proseMirrorNodeName();
      const spec = extension.proseMirrorNodeSpec();
      if (name !== null && spec !== null) {
        this.nodes[name] = spec;
      }
    }
    for (const extension of extensionManager.markExtensions()) {
      const name = extension.proseMirrorMarkName();
      const spec = extension.proseMirrorMarkSpec();
      if (name !== null && spec !== null) {
        this.marks[name] = spec;
      }
    }
  }

  public build(): Schema<string, string> {
    return new Schema<string, string>({
      nodes: this.nodes,
      marks: this.marks,
    });
  }
}
