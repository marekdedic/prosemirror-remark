import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { ProseMirrorRemarkExtension } from "../ProseMirrorRemarkExtension";
import type { SchemaExtension } from "../SchemaExtension";

export class ParagraphExtension extends ProseMirrorRemarkExtension {
  public matchingMdastNodes(): Array<string> {
    return ["paragraph"];
  }

  public schema(): SchemaExtension {
    return {
      nodes: {
        paragraph: {
          // TODO: This is incorrect
          content: "text*",
          group: "block",
          parseDOM: [{ tag: "p" }],
          toDOM(): DOMOutputSpec {
            return ["p", 0];
          },
        },
      },
    };
  }

  public mdastNodeToProseMirrorNode(
    _: UnistNode,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema
  ): ProseMirrorNode | null {
    return schema.nodes["doc"].createAndFill({}, convertedChildren);
  }
}
