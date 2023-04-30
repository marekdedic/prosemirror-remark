import type { Strong, Text } from "mdast";
import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";

import { MarkExtension } from "../MarkExtension";

export class BoldExtension extends MarkExtension<Strong> {
  public mdastNodeName(): "strong" {
    return "strong";
  }

  public proseMirrorMarkName(): string {
    return "strong";
  }

  public proseMirrorMarkSpec(): MarkSpec {
    return {
      parseDOM: [{ tag: "b" }, { tag: "strong" }],
      toDOM(): DOMOutputSpec {
        return ["strong"];
      },
    };
  }

  public mdastNodeToProseMirrorNodes(
    _node: Strong,
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return convertedChildren.map((child) =>
      child.mark(
        child.marks.concat([schema.marks[this.proseMirrorMarkName()].create()])
      )
    );
  }

  public modifyMdastNode(convertedNode: Text): Strong {
    return { type: this.mdastNodeName(), children: [convertedNode] };
  }
}
