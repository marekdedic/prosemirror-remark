import type {
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { NodeExtension } from "prosemirror-unified";

export interface UnistText extends UnistNode {
  type: "text";
  value: string;
}

export class TextExtension extends NodeExtension<UnistText> {
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
  ): Array<UnistText> {
    return [{ type: "text", value: node.text ?? "" }];
  }

  public override unistNodeName(): "text" {
    return "text";
  }

  public override unistNodeToProseMirrorNodes(
    node: UnistText,
    proseMirrorSchema: Schema<string, string>,
  ): Array<ProseMirrorNode> {
    return [proseMirrorSchema.text(node.value)];
  }
}
