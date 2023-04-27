import type { ThematicBreak } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";

import { NodeExtension } from "../NodeExtension";

export class HorizontalRuleExtension extends NodeExtension {
  public mdastNodeName(): "thematicBreak" {
    return "thematicBreak";
  }

  public proseMirrorNodeName(): string {
    return "horizontal_rule";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      group: "block",
      parseDOM: [{ tag: "hr" }],
      toDOM(): DOMOutputSpec {
        return ["div", ["hr"]];
      },
    };
  }

  public mdastNodeToProseMirrorNodes(
    _: ThematicBreak,
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

  public proseMirrorNodeToMdastNodes(): Array<ThematicBreak> {
    return [
      {
        type: this.mdastNodeName(),
      },
    ];
  }
}
