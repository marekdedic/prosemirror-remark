import type { Break } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
} from "prosemirror-model";

import { NodeExtension } from "../../prosemirror-unified";

export class BreakExtension extends NodeExtension<Break> {
  public unistNodeName(): "break" {
    return "break";
  }

  public proseMirrorNodeName(): string {
    return "hard_break";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      inline: true,
      group: "inline",
      selectable: false,
      parseDOM: [{ tag: "br" }],
      toDOM(): DOMOutputSpec {
        return ["br"];
      },
    };
  }

  public unistNodeToProseMirrorNodes(
    _node: Break,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(convertedChildren);
  }

  public proseMirrorNodeToUnistNodes(): Array<Break> {
    return [{ type: this.unistNodeName() }];
  }
}
