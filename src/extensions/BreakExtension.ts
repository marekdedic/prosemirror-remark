import type { Break } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";

import { NodeExtension } from "../NodeExtension";

export class BreakExtension extends NodeExtension {
  public mdastNodeName(): "break" {
    return "break";
  }

  public proseMirrorNodeName(): string {
    return "hard_break";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      inline: true,
      group: "inline",
      parseDOM: [{ tag: "br" }],
      toDOM(): DOMOutputSpec {
        return ["br"];
      },
    };
  }

  // TODO: Specialize schema generic
  public mdastNodeToProseMirrorNodes(
    _: Break,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema
  ): Array<ProseMirrorNode> {
    const proseMirrorNode = schema.nodes[
      this.proseMirrorNodeName()
    ].createAndFill({}, convertedChildren);
    if (proseMirrorNode === null) {
      return [];
    }
    return [proseMirrorNode];
  }

  public proseMirrorNodeToMdastNodes(): Array<Break> {
    return [{ type: this.mdastNodeName() }];
  }
}
