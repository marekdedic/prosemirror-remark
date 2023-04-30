import type { Strong, Text } from "mdast";
import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";

import { MarkExtension } from "../../prosemirror-unified";

export class BoldExtension extends MarkExtension<Strong> {
  public unistNodeName(): "strong" {
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

  public unistNodeToProseMirrorNodes(
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

  public modifyUnistNode(convertedNode: Text): Strong {
    return { type: this.unistNodeName(), children: [convertedNode] };
  }
}
