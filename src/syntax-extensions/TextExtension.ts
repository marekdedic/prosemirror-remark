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

  public unistNodeToProseMirrorNodes(
    node: Text,
    proseMirrorSchema: Schema<string, string>
  ): Array<ProseMirrorNode> {
    return [proseMirrorSchema.text(node.value)];
  }

  public proseMirrorNodeToUnistNodes(node: ProseMirrorNode): Array<Text> {
    return [{ type: this.unistNodeName(), value: node.text ?? "" }];
  }
}
