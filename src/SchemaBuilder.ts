import { type MarkSpec, type NodeSpec, Schema } from "prosemirror-model";

type Nodes = string;
type Marks = string;

export class SchemaBuilder {
  private readonly nodes: Record<Nodes, NodeSpec> = {};
  private readonly marks: Record<Marks, MarkSpec> = {};

  public constructor() {
    this.nodes["text"] = {};
    this.nodes["doc"] = { content: "text*" };
  }

  public build(): Schema<Nodes, Marks> {
    return new Schema<Nodes, Marks>({
      nodes: this.nodes,
      marks: this.marks,
    });
  }
}
