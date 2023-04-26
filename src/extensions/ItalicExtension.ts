import type { Emphasis } from "mdast";
import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";

import { ProseMirrorRemarkMarkExtension } from "../ProseMirrorRemarkMarkExtension";

export class ItalicExtension extends ProseMirrorRemarkMarkExtension {
  public mdastNodeName(): string {
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

  public mdastNodeToProseMirrorNodes(
    _: Emphasis,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema
  ): Array<ProseMirrorNode> {
    return convertedChildren.map((child) =>
      child.mark(
        child.marks.concat([schema.marks[this.proseMirrorMarkName()].create()])
      )
    );
  }
}
