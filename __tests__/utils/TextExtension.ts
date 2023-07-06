import type {
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import { NodeExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

export interface UnistText extends UnistNode {
  type: "text";
  value: string;
}

export class TextExtension extends NodeExtension<UnistText> {
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
    node: UnistText,
    proseMirrorSchema: Schema<string, string>
  ): Array<ProseMirrorNode> {
    return [proseMirrorSchema.text(node.value)];
  }

  public proseMirrorNodeToUnistNodes(node: ProseMirrorNode): Array<UnistText> {
    return [{ type: "text", value: node.text ?? "" }];
  }
}
