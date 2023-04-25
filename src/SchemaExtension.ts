import type { MarkSpec, NodeSpec } from "prosemirror-model";

export interface SchemaExtension {
  nodes?: Record<string, NodeSpec>;
  marks?: Record<string, MarkSpec>;
}
