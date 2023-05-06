import type { Text } from "mdast";
import type { Node as ProseMirrorNode, NodeSpec } from "prosemirror-model";

import { NodeExtension } from "../../prosemirror-unified";

export class TextExtension extends NodeExtension<Text> {
  public unistNodeName(): "text" {
    return "text";
  }

  public proseMirrorNodeName(): string {
    return "text";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      group: "inline",
    };
  }

  public unistNodeToProseMirrorNodes(node: Text): Array<ProseMirrorNode> {
    return [this.proseMirrorSchema().text(node.value)];
  }

  public proseMirrorNodeToUnistNodes(node: ProseMirrorNode): Array<Text> {
    return [{ type: this.unistNodeName(), value: node.text ?? "" }];
  }
}
