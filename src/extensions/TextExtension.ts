import type { Text } from "mdast";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";

import { ProseMirrorRemarkExtension } from "../ProseMirrorRemarkExtension";
import type { SchemaExtension } from "../SchemaExtension";

export class TextExtension extends ProseMirrorRemarkExtension {
  public matchingMdastNodes(): Array<string> {
    return ["text"];
  }

  public matchingProseMirrorNodes(): Array<string> {
    return ["text"];
  }

  public schema(): SchemaExtension {
    return {
      nodes: {
        text: {
          group: "inline",
        },
      },
    };
  }

  public mdastNodeToProseMirrorNode(
    node: Text,
    _: Array<ProseMirrorNode>,
    schema: Schema
  ): Array<ProseMirrorNode> {
    return [schema.text(node.value)];
  }

  public proseMirrorNodeToMdastNode(node: ProseMirrorNode): Array<Text> {
    return [{ type: "text", value: node.text ?? "" }];
  }
}
