import type { Text } from "mdast";
import type {
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";

import { NodeExtension } from "prosemirror-unified";

/**
 * @public
 */
export class TextExtension extends NodeExtension<Text> {
  public override proseMirrorNodeName(): string {
    return "text";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      group: "inline",
    };
  }

  public override proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
  ): Array<Text> {
    return [{ type: this.unistNodeName(), value: node.text ?? "" }];
  }

  public override unistNodeName(): "text" {
    return "text";
  }

  public override unistNodeToProseMirrorNodes(
    node: Text,
    proseMirrorSchema: Schema<string, string>,
  ): Array<ProseMirrorNode> {
    return [proseMirrorSchema.text(node.value)];
  }
}
