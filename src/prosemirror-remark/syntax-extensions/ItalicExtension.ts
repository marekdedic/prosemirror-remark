import type { Emphasis, Text } from "mdast";
import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";

import { MarkExtension } from "../../prosemirror-unified";

export class ItalicExtension extends MarkExtension<Emphasis> {
  public mdastNodeName(): "emphasis" {
    return "emphasis";
  }

  public proseMirrorMarkName(): string {
    return "em";
  }

  public proseMirrorMarkSpec(): MarkSpec {
    return {
      parseDOM: [{ tag: "i" }, { tag: "em" }],
      toDOM(): DOMOutputSpec {
        return ["em"];
      },
    };
  }

  public unistNodeToProseMirrorNodes(
    _node: Emphasis,
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return convertedChildren.map((child) =>
      child.mark(
        child.marks.concat([schema.marks[this.proseMirrorMarkName()].create()])
      )
    );
  }

  public modifyMdastNode(convertedNode: Text): Emphasis {
    return { type: this.mdastNodeName(), children: [convertedNode] };
  }
}
